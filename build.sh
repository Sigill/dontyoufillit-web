#!/bin/bash

if [ "$#" -ne "2" ]
then
	echo "Usage: $0 <publication url> <private key>"
	exit
fi

url=$( ruby -ruri -e "print '$1'.to_s.chomp('/')" )
origin=$( ruby -ruri -e "print URI.join('$1', '/').to_s.chomp('/')" )
path=$( ruby -ruri -e "print URI.parse('$1').path.chomp('/')" )

rm -rf dist

[ -d dist ] || mkdir dist
[ -d tmp/packaged_app ] || mkdir -p tmp/packaged_app

## Icons
# 16: favicon
# 32: hidpi favicon
# 16, 32, 48, 256: Windows desktop icons, in ico (http://msdn.microsoft.com/en-us/library/windows/desktop/dn742485.aspx)
# 57, 76, 120, 152, 180: Apple devices (https://developer.apple.com/library/ios/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html, https://developer.apple.com/library/ios/documentation/UserExperience/Conceptual/MobileHIG/IconMatrix.html#//apple_ref/doc/uid/TP40006556-CH27)
# 48, 72, 96, 144, 192: Android launcher (http://developer.android.com/design/style/iconography.html)
# 128, 192: homescreen icons for Chrome for Android (https://developer.chrome.com/multidevice/android/installtohomescreen)
# 70, 150, 310x150, 310: Windows 8 tiles (recommanded: 128, 270, 558x270, 558) (http://msdn.microsoft.com/en-us/library/ie/dn455106%28v=vs.85%29.aspx)
# 128, 512: Firefox Marketplace

# Inkscape does not export grayscale png, pngcrush will

for S in 512 270 192 128
do
	if [ img/icon.svg -nt tmp/icon-${S}x${S}.png ]; then
		inkscape -z -e tmp/icon-${S}x${S}.png -w $S -h $S img/icon.svg
		pngcrush -brute -c 0 -q -ow tmp/icon-${S}x${S}.png
	fi
	cp tmp/icon-${S}x${S}.png dist/icon-${S}x${S}.png
done

for S in 16 32 48 64 256
do
	if [ img/icon3.svg -nt tmp/icon-${S}x${S}.png ]; then
		inkscape -z -e tmp/icon-${S}x${S}.png -w $S -h $S img/icon3.svg
		pngcrush -brute -c 4 -q -ow tmp/icon-${S}x${S}.png
	fi
done

cp tmp/icon-16x16.png tmp/icon-32x32.png tmp/icon-64x64.png dist/
convert tmp/icon-16x16.png tmp/icon-32x32.png tmp/icon-48x48.png tmp/icon-256x256.png dist/favicon.ico

sed -e "s!URL!$url!g" index.html > dist/index.html

## Add paragraph markup to license file
sed -e '/^\s*$/d' -e 's/^/<p>/g' -e 's/$/<\/p>/g' LICENSE > tmp/LICENSE

## For testing purpose, keep an online version of the game.
sed -e '/\$LICENSE\$/ {
r tmp/LICENSE
d
}' play.html > dist/play_online.html

## Build the offline app
# Add the cache manifest
sed -e 's/<html>/<html manifest="cache.manifest">/g' dist/play_online.html > dist/play.html

cp app.css requestAnimationFrame.min.js stats.min.js observable.js canyoufillit.js canyoufillit_canvas_gui.js app.js .htaccess dist/
cp bootstrap.css dist/

# Compute a hash of all the files that need to be cached.
h=$(for f in app.css play.html requestAnimationFrame.min.js stats.min.js observable.js canyoufillit.js canyoufillit_canvas_gui.js app.js
do
	echo `sha1sum $f`
done|sha1sum|cut -d ' ' -f1)

# and put it in the cache manifest, in order to make it unique.
sed -e "s/# hash xyz/# hash $h/g" cache.manifest > dist/cache.manifest


## Build the hosted open web app manifest
sed "s!PATH!$path!g" manifest.webapp > dist/manifest.webapp

## Build the packaged Open Web App
# Remove the favicons
sed -e '/BEGIN FAVICONS/,/END FAVICONS/d' dist/play_online.html > tmp/packaged_app/play.html
cp app.css requestAnimationFrame.min.js stats.min.js observable.js canyoufillit.js canyoufillit_canvas_gui.js app.js tmp/packaged_app/
cp dist/icon-64x64.png dist/icon-128x128.png dist/icon-512x512.png tmp/packaged_app/
sed -e "/appcache_path/d" -e "s!PATH!!g" manifest.webapp > tmp/packaged_app/manifest.webapp

zip dist/CanYouFillIt-FirefoxApp.zip -j -r tmp/packaged_app

sed "s!URL!$url!g" package.webapp > dist/package.webapp

## Build the packaged Chrome packaged app
# https://developer.chrome.com/extensions/apps
# TODO Crop 128 image https://developer.chrome.com/webstore/images
# Chrome >= 35 assumes apps are offline capable by default: https://developer.chrome.com/extensions/manifest/offline_enabled
mkdir -p tmp/chrome/packaged

sed -e '/BEGIN FAVICONS/,/END FAVICONS/d' dist/play_online.html > tmp/chrome/packaged/play.html
cp app.css requestAnimationFrame.min.js stats.min.js observable.js canyoufillit.js canyoufillit_canvas_gui.js app.js tmp/chrome/packaged/
cp dist/icon-128x128.png tmp/chrome/packaged/
cp packaged.manifest.json tmp/chrome/packaged/manifest.json

./crxmake.sh tmp/chrome/packaged/ $2 dist/CanYouFillIt-ChromePackaged.crx

## Build the hosted Chrome packaged app
# https://developers.google.com/chrome/apps/docs/developers_guide
mkdir -p tmp/chrome/hosted

sed "s!URL!$url!g" hosted.manifest.json > tmp/chrome/hosted/manifest.json
cp dist/icon-128x128.png tmp/chrome/hosted/

./crxmake.sh tmp/chrome/hosted/ $2 dist/CanYouFillIt-ChromeHosted.crx
