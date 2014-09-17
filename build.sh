#!/bin/bash

if [ "$#" -ne "1" ]
then
	echo "You need to specity the url where the game will be published."
	exit
fi

url=$( ruby -ruri -e "print '$1'.to_s.chomp('/')" )
origin=$( ruby -ruri -e "print URI.join('$1', '/').to_s.chomp('/')" )
path=$( ruby -ruri -e "print URI.parse('$1').path.chomp('/')" )

[ -d dist ] || mkdir dist

## Build the offline app
cp requestAnimationFrame.min.js stats.min.js observable.js canyoufillit.js canyoufillit_canvas_gui.js .htaccess dist/
cp index.html icon-128.png icon-512.png bootstrap.css dist/
sed 's/<html>/<html manifest="cache.manifest">/g' play.html > dist/play.html

# Compute a hash of all the files that need to be cached.
h=$(for f in play.html requestAnimationFrame.min.js stats.min.js observable.js canyoufillit.js canyoufillit_canvas_gui.js
do
	echo `sha1sum $f`
done|sha1sum|cut -d ' ' -f1)

# and put it in the cache manifest, in order to make it unique.
sed "s/# hash xyz/# hash $h/g" cache.manifest > dist/cache.manifest

## For testing purpose, keep an online version of the game.
cp play.html dist/play_online.html

## Build the hosted open web app manifest
sed "s!PATH!$path!g" manifest.webapp > dist/manifest.webapp

## Build the packaged open web app
[ -d tmp ] || mkdir tmp

cp play.html requestAnimationFrame.min.js stats.min.js observable.js canyoufillit.js canyoufillit_canvas_gui.js tmp/
cp icon-128.png icon-512.png tmp/
sed "/appcache_path/d" manifest.webapp|sed "s!PATH!!g" > tmp/manifest.webapp

zip dist/CanYouFillIt-WebApp.zip -j -r tmp

sed "s!URL!$url!g" package.webapp > dist/package.webapp

rm -rf tmp
