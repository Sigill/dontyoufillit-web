#!/bin/bash

if [ "$#" -ne "4" ]
then
	echo "Usage: $0 <publication url> <chrome hosted app private key> <chrome packaged app private key> <version>"
	exit
fi

url=$( ruby -ruri -e "print '$1'.to_s.chomp('/')" )
origin=$( ruby -ruri -e "print URI.join('$1', '/').to_s.chomp('/')" )
path=$( ruby -ruri -e "print URI.parse('$1').path.chomp('/')" )

chromeHostedKey="$2"
chromePackagedKey="$3"
version="$4"

rm -rf dist tmp/chrome tmp/firefox
mkdir -p dist tmp/firefox tmp/chrome

## Icons
# 16: favicon
# 32: hidpi favicon
# 16, 32, 48, 256: Windows desktop icons, in ico (http://msdn.microsoft.com/en-us/library/windows/desktop/dn742485.aspx)
# 57, 76, 120, 152, 180: Apple devices (https://developer.apple.com/library/ios/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html, https://developer.apple.com/library/ios/documentation/UserExperience/Conceptual/MobileHIG/IconMatrix.html#//apple_ref/doc/uid/TP40006556-CH27)
# 48, 72, 96, 144, 192: Android launcher (http://developer.android.com/design/style/iconography.html)
# 128, 192: homescreen icons for Chrome for Android (https://developer.chrome.com/multidevice/android/installtohomescreen)
# 70, 150, 310x150, 310: Windows 8 tiles (recommanded: 128, 270, 558x270, 558) (http://msdn.microsoft.com/en-us/library/ie/dn455106%28v=vs.85%29.aspx)
# 128, 512: Firefox Marketplace

# Inkscape does not export grayscale png, pngcrush does

for S in 512 270 192 128 96
do
	if [ img/icon.svg -nt tmp/icon-${S}x${S}.png ]; then
		inkscape -z -e tmp/icon-${S}x${S}.png -w $S -h $S img/icon.svg
		pngcrush -brute -c 0 -q -ow tmp/icon-${S}x${S}.png
	fi
done

for S in 16 32 48 64 256
do
	if [ img/icon3.svg -nt tmp/icon-${S}x${S}.png ]; then
		inkscape -z -e tmp/icon-${S}x${S}.png -w $S -h $S img/icon3.svg
		pngcrush -brute -c 4 -q -ow tmp/icon-${S}x${S}.png
	fi
done

for S in 512 270 192 128 64 32 16
do
	cp tmp/icon-${S}x${S}.png dist/
done

convert tmp/icon-16x16.png tmp/icon-32x32.png tmp/icon-48x48.png tmp/icon-256x256.png dist/favicon.ico

sed -e "s!URL!$url!g" index.html > dist/index.html

## Add paragraph markup to license file
# Removes empty lines and add paragraph tags to each lines
sed -e '/^\s*$/d' -e 's/^/<p>/g' -e 's/$/<\/p>/g' LICENSE > tmp/LICENSE

## Add license, strip unneeded js files (due to minimization)
# For testing purpose, keep an online version of the game.
sed -e '/\$LICENSE\$/ {
r tmp/LICENSE
d
}' -e '/BEGIN JS/,/END JS/d' play.html > dist/play_online.html

## Build the offline app
# Add the cache manifest to the game
sed -e 's/<html>/<html manifest="cache.manifest">/g' -e 's/^[[:space:]]*//g' dist/play_online.html > dist/play.html

for F in requestAnimationFrame.js stats.js observable.js canyoufillit.js canyoufillit_canvas_gui.js app.js
do
	if [ $F -nt tmp/app.js ]; then
		closure-compiler --compilation_level SIMPLE_OPTIMIZATIONS requestAnimationFrame.js stats.js observable.js canyoufillit.js canyoufillit_canvas_gui.js app.js > tmp/app.js
		break
	fi
done
cp tmp/app.js dist/app.js

cat app.css| cssmin -w 512 > dist/app.css
cat bootstrap.css| cssmin -w 512 > dist/bootstrap.css
cp .htaccess dist/

# Compute a hash of all the files that need to be cached.
h=$(tar -c app.css play.html requestAnimationFrame.js stats.js observable.js canyoufillit.js canyoufillit_canvas_gui.js app.js|sha1sum|cut -d ' ' -f1)

# and put it in the cache manifest, in order to make it unique.
sed -e "s/# hash xyz/# hash $h/g" cache.manifest > dist/cache.manifest


## Build the hosted open web app manifest
sed -e "s!PATH!$path!g" -e "s!VERSION!$version!g" manifest.webapp > dist/manifest.webapp

# Icons are useless in a packaged app
sed -e '/BEGIN FAVICONS/,/END FAVICONS/d' dist/play_online.html > tmp/packageable_play.html

## Build the packaged Open Web App
cp tmp/packageable_play.html tmp/firefox/play.html
cp dist/app.js app.css dist/icon-512x512.png tmp/firefox/
sed -e "/appcache_path/d" -e "s!PATH!!g" -e "s!URL!!g" -e "s!VERSION!$version!g" manifest.webapp > tmp/firefox/manifest.webapp

zip dist/CanYouFillIt-FirefoxApp.zip -j -r -q tmp/firefox

sed -e "s!URL!$url!g" -e "s!VERSION!$version!g" package.webapp > dist/package.webapp

## Build the Chrome app
# https://developer.chrome.com/extensions/apps
mkdir -p tmp/chrome/packaged

# https://developer.chrome.com/webstore/images
convert tmp/icon-96x96.png -bordercolor transparent -border 16 tmp/chrome/icon-128x128.png

## The packaged app
# Chrome >= 35 assumes apps are offline capable by default: https://developer.chrome.com/extensions/manifest/offline_enabled
cp tmp/packageable_play.html tmp/chrome/packaged/play.html
cp dist/app.css dist/app.js tmp/chrome/packaged/
cp tmp/chrome/icon-128x128.png tmp/chrome/packaged/
sed -e "s!URL!$url!g" -e "s!VERSION!$version!g" packaged.manifest.json > tmp/chrome/packaged/manifest.json
sed -e "s!URL!$url!g" -e "s!VERSION!$version!g" chrome-updates.xml > dist/chrome-updates.xml

./crxmake.sh tmp/chrome/packaged/ $chromePackagedKey dist/CanYouFillIt-ChromePackaged.crx

# Package to be submitted to the chrome store
sed -e "/update_url/d" tmp/chrome/packaged/manifest.json > tmp/chrome/packaged/manifest.json2
mv tmp/chrome/packaged/manifest.json2 tmp/chrome/packaged/manifest.json
zip dist/CanYouFillIt-Chrome.zip -j -r -q tmp/chrome/packaged/

## The hosted one
# https://developers.google.com/chrome/apps/docs/developers_guide
mkdir -p tmp/chrome/hosted

sed -e "s!URL!$url!g" -e "s!VERSION!$version!g" hosted.manifest.json > tmp/chrome/hosted/manifest.json
cp tmp/chrome/icon-128x128.png tmp/chrome/hosted/

./crxmake.sh tmp/chrome/hosted/ $chromeHostedKey dist/CanYouFillIt-ChromeHosted.crx
