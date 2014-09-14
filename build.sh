#!/bin/sh

[ -d dist ] || mkdir dist

cp index.html requestAnimationFrame.min.js stats.min.js observable.js canyoufillit.js canyoufillit_canvas_gui.js .htaccess dist/

sed 's/<html>/<html manifest="cache.manifest">/g' play.html > dist/play.html

# Compute a hash of all the files that need to be cached.
h=$(for f in play.html requestAnimationFrame.min.js stats.min.js observable.js canyoufillit.js canyoufillit_canvas_gui.js
do
	echo `sha1sum $f`
done|sha1sum|cut -d ' ' -f1)

sed "s/# hash xyz/# hash $h/g" cache.manifest > dist/cache.manifest
