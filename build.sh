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

rm -rf dist tmp/chrome android
mkdir -p dist tmp/chrome android

## Icons
# 16: favicon
# 32: hidpi favicon
# 16, 32, 48, 256: Windows desktop icons, in ico (http://msdn.microsoft.com/en-us/library/windows/desktop/dn742485.aspx)
# 57, 76, 120, 152, 180: Apple devices (https://developer.apple.com/library/ios/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html, https://developer.apple.com/library/ios/documentation/UserExperience/Conceptual/MobileHIG/IconMatrix.html#//apple_ref/doc/uid/TP40006556-CH27)
# 48, 72, 96, 144, 192: Android launcher (http://developer.android.com/design/style/iconography.html)
# 128, 192: homescreen icons for Chrome for Android (https://developer.chrome.com/multidevice/android/installtohomescreen)
# 70, 150, 310x150, 310: Windows 8 tiles (recommanded: 128, 270, 558x270, 558) (http://msdn.microsoft.com/en-us/library/ie/dn455106%28v=vs.85%29.aspx)

# Inkscape does not export grayscale png, pngcrush does

for S in 270 192 128 96
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

for S in 270 192 128 64 32 16
do
	cp tmp/icon-${S}x${S}.png dist/
done

convert tmp/icon-16x16.png tmp/icon-32x32.png tmp/icon-48x48.png tmp/icon-256x256.png dist/favicon.ico

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

JAVASCRIPT_FILES="requestAnimationFrame.js passiveEvent.js stats.js observable.js dontyoufillit.js dontyoufillit_canvas_gui.js app.js"

for F in $JAVASCRIPT_FILES
do
	if [ $F -nt tmp/app.js ]; then
		closure-compiler --compilation_level SIMPLE_OPTIMIZATIONS $JAVASCRIPT_FILES > tmp/app.js
		break
	fi
done
cp tmp/app.js dist/app.js

cat app.css| cssmin -w 512 > dist/app.css
cp .htaccess dist/

# Compute a hash of all the files that need to be cached.
h=$(tar -c app.css play.html requestAnimationFrame.js passiveEvent.js stats.js observable.js dontyoufillit.js dontyoufillit_canvas_gui.js app.js|sha1sum|cut -d ' ' -f1)

# and put it in the cache manifest, in order to make it unique.
sed -e "s/# hash xyz/# hash $h/g" cache.manifest > dist/cache.manifest


# Icons are useless in a packaged app
sed -e '/BEGIN FAVICONS/,/END FAVICONS/d' dist/play_online.html > tmp/packageable_play.html


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

./crxmake.sh tmp/chrome/packaged/ $chromePackagedKey dist/DontYouFillIt-ChromePackaged.crx

# Package to be submitted to the chrome store
sed -e "/update_url/d" tmp/chrome/packaged/manifest.json > tmp/chrome/packaged/manifest.json2
mv tmp/chrome/packaged/manifest.json2 tmp/chrome/packaged/manifest.json
zip dist/DontYouFillIt-Chrome.zip -j -r -q tmp/chrome/packaged/

## The hosted one
# https://developers.google.com/chrome/apps/docs/developers_guide
mkdir -p tmp/chrome/hosted

sed -e "s!URL!$url!g" -e "s!VERSION!$version!g" hosted.manifest.json > tmp/chrome/hosted/manifest.json
cp tmp/chrome/icon-128x128.png tmp/chrome/hosted/

./crxmake.sh tmp/chrome/hosted/ $chromeHostedKey dist/DontYouFillIt-ChromeHosted.crx


## Build android version
# Add license, remove favicons
sed -e '/\$LICENSE\$/ {
r tmp/LICENSE
d
}' -e '/BEGIN FAVICONS/,/END FAVICONS/d' play.html > android/play.html

cp app.css android/
cp $JAVASCRIPT_FILES android/

mkdir -p android/res/mipmap-mdpi android/res/mipmap-hdpi android/res/mipmap-xhdpi android/res/mipmap-xxhdpi android/res/mipmap-xxxhdpi

for S in 48 72 96 144 192 512
do
	if [ img/android.svg -nt tmp/android-${S}x${S}.png ]; then
		inkscape -z -e tmp/android-${S}x${S}.png -w $S -h $S img/android.svg
		pngcrush -brute -c 4 -q -ow tmp/android-${S}x${S}.png
	fi
done

mv tmp/android-48x48.png android/res/mipmap-mdpi/ic_launcher.png
mv tmp/android-72x72.png android/res/mipmap-hdpi/ic_launcher.png
mv tmp/android-96x96.png android/res/mipmap-xhdpi/ic_launcher.png
mv tmp/android-144x144.png android/res/mipmap-xxhdpi/ic_launcher.png
mv tmp/android-192x192.png android/res/mipmap-xxxhdpi/ic_launcher.png

mv tmp/android-512x512.png android/res/ic_launcher-web.png

for S in 48 72 96 144 192
do
	if [ img/android.round.svg -nt tmp/android-${S}x${S}.png ]; then
		inkscape -z -e tmp/android-${S}x${S}.png -w $S -h $S img/android.round.svg
		pngcrush -brute -c 4 -q -ow tmp/android-${S}x${S}.png
	fi
done

mv tmp/android-48x48.png android/res/mipmap-mdpi/ic_launcher_round.png
mv tmp/android-72x72.png android/res/mipmap-hdpi/ic_launcher_round.png
mv tmp/android-96x96.png android/res/mipmap-xhdpi/ic_launcher_round.png
mv tmp/android-144x144.png android/res/mipmap-xxhdpi/ic_launcher_round.png
mv tmp/android-192x192.png android/res/mipmap-xxxhdpi/ic_launcher_round.png
