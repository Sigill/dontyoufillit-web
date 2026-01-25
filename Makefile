# http://msdn.microsoft.com/en-us/library/windows/desktop/dn742485.aspx
FAVICONS = dist/www/icon-16x16.png \
           dist/www/icon-32x32.png \
           dist/www/favicon.ico

# https://developer.apple.com/library/content/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
# https://developer.apple.com/ios/human-interface-guidelines/icons-and-images/app-icon/
APL_ICONS = dist/www/touch-icon-iphone.png \
            dist/www/touch-icon-ipad.png \
            dist/www/touch-icon-iphone-retina.png \
            dist/www/touch-icon-ipad-retina.png

# Ignore Safari Pinned Tabs icons
# https://developer.apple.com/library/content/documentation/AppleApplications/Reference/SafariWebContent/pinnedTabs/pinnedTabs.html

# Progressive web apps icons
# https://developers.google.com/web/fundamentals/app-install-banners/
PWA_ICONS = dist/www/ic_launcher_48.png \
            dist/www/ic_launcher_72.png \
            dist/www/ic_launcher_96.png \
            dist/www/ic_launcher_144.png \
            dist/www/ic_launcher_192.png

CACHED_FILES = dist/www/play.html \
               dist/www/app.css \
               dist/www/app.js \
               dist/www/service-worker.js \
               dist/www/favicon.ico \
               dist/www/icon-16x16.png \
               dist/www/icon-32x32.png

WEB_FILES = $(FAVICONS) $(APL_ICONS) $(PWA_ICONS) \
            dist/www/play_online.html dist/www/play.html dist/www/app.js dist/www/app.css dist/www/cache.manifest dist/www/.htaccess dist/www/manifest.json \
            dist/dev/wall-collision.js dist/dev/ball-collision.js dist/dev/ball-engine-comparator.js

AND_RES = dist/android/res
MDPI = $(AND_RES)/mipmap-mdpi
HDPI = $(AND_RES)/mipmap-hdpi
XHDPI = $(AND_RES)/mipmap-xhdpi
XXHDPI = $(AND_RES)/mipmap-xxhdpi
XXXHDPI = $(AND_RES)/mipmap-xxxhdpi

SQ_ICON = ic_launcher.png
RND_ICON = ic_launcher_round.png

AND_LAUNCHER_ICONS = $(MDPI)/$(SQ_ICON) \
                     $(HDPI)/$(SQ_ICON) \
                     $(XHDPI)/$(SQ_ICON) \
                     $(XXHDPI)/$(SQ_ICON) \
                     $(XXXHDPI)/$(SQ_ICON) \
                     $(MDPI)/$(RND_ICON) \
                     $(HDPI)/$(RND_ICON) \
                     $(XHDPI)/$(RND_ICON) \
                     $(XXHDPI)/$(RND_ICON) \
                     $(XXXHDPI)/$(RND_ICON)

AND_AST = dist/android/assets

AND_FILES = $(AND_LAUNCHER_ICONS) $(AND_AST)/app.js $(AND_AST)/app.css $(AND_AST)/play.html

DIRECTORIES = $(MDPI) $(HDPI) $(XHDPI) $(XXHDPI) $(XXXHDPI) $(AND_AST) $(AND_RES) dist/www dist/tmp

.PHONY: web_package android_package all clean

web_package: $(WEB_FILES)
android_package: $(AND_FILES)
all: web_package android_package

clean:
	rm -rf dist/

define svg-to-png =
	rsvg-convert -o $@ -w $(1) -h $(1) $< && pngcrush -brute -c $(2) -q -ow $@ $$(mktemp -p dist/tmp)
endef

dist/www/icon-16x16.png: img/icon3.svg
	$(call svg-to-png,16,4)

dist/www/icon-32x32.png: img/icon3.svg
	$(call svg-to-png,32,4)

dist/tmp/icon-48x48.png: img/icon3.svg
	$(call svg-to-png,48,4)

dist/tmp/icon-256x256.png: img/icon3.svg
	$(call svg-to-png,256,4)

dist/www/favicon.ico: dist/www/icon-16x16.png dist/www/icon-32x32.png dist/tmp/icon-48x48.png dist/tmp/icon-256x256.png
	convert $^ $@


dist/www/touch-icon-iphone.png: img/icon.svg
	$(call svg-to-png,120,0)

dist/www/touch-icon-ipad.png: img/icon.svg
	$(call svg-to-png,152,0)

dist/www/touch-icon-iphone-retina.png: img/icon.svg
	$(call svg-to-png,180,0)

dist/www/touch-icon-ipad-retina.png: img/icon.svg
	$(call svg-to-png,167,0)


dist/www/ic_launcher_48.png: $(MDPI)/$(SQ_ICON)
	cp $< $@

dist/www/ic_launcher_72.png: $(HDPI)/$(SQ_ICON)
	cp $< $@

dist/www/ic_launcher_96.png: $(XHDPI)/$(SQ_ICON)
	cp $< $@

dist/www/ic_launcher_144.png: $(XXHDPI)/$(SQ_ICON)
	cp $< $@

dist/www/ic_launcher_192.png: $(XXXHDPI)/$(SQ_ICON)
	cp $< $@


## Add paragraph markup to license file
# Removes empty lines and add paragraph tags to each lines
dist/tmp/LICENSE: LICENSE
	sed -e '/^\s*$$/d' -e 's/^/<p>/g' -e 's/$$/<\/p>/g' $< > $@


dist/www/play_online.html: src/play.html dist/tmp/LICENSE
	# Add license, strip unneeded js files (due to minimization)
	sed -e '/\$$LICENSE\$$/{r dist/tmp/LICENSE' -e 'd}' \
	    -e '/BEGIN WEB/d' \
	    -e '/END WEB/d' \
	    $< > $@


dist/www/play.html: dist/www/play_online.html
	# Add the cache manifest to the game
	sed -e 's/<html>/<html manifest="cache.manifest">/g' $< > $@

dist/www/cache.manifest: src/cache.manifest $(CACHED_FILES)
	# Compute a hash of all the files that need to be cached.
	# and put it in the cache manifest, in order to make it unique.
	h=$$(tar -c $^|sha1sum|cut -d ' ' -f1); \
	sed -e "s/# hash xyz/# hash $$h/g" $< > $@


dist/www/service-worker.js: src/service-worker.js
	cp $< $@

dist/www/manifest.json: src/manifest.json
	cp $< $@

ESBUILD_SOURCE_FILES = \
	src/app.css \
	src/app.ts \
	src/ball-engine-rk4.ts \
	src/ball-engine.ts \
	src/bouncing-ball.ts \
	src/cannon.ts \
	src/constants.ts \
	src/css-board.ts \
	src/game-handler.ts \
	dev/ball-engine-comparator.ts \
	dev/ball-collision.ts \
	dev/wall-collision.ts \
	dev/debug.ts \

dist/www/app.css dist/www/app.js dist/dev/ball-engine-comparator.js dist/dev/ball-collision.js dist/dev/wall-collision.js dist/dev/debug.js: $(ESBUILD_SOURCE_FILES)
	node esbuild.ts

dist/www/.htaccess: .htaccess
	cp .htaccess dist/www/

$(AND_AST)/play.html: src/play.html dist/tmp/LICENSE
	# Add license, remove web specific content
	sed -e '/\$$LICENSE\$$/{r dist/tmp/LICENSE' -e 'd}' \
	    -e '/BEGIN WEB/,/END WEB/d' \
	    $< > $@


$(AND_AST)/app.css: dist/www/app.css
	cp $< $@

$(AND_AST)/app.js: dist/www/app.js
	cp $< $@

$(MDPI)/$(SQ_ICON): img/android.svg
	$(call svg-to-png,48,4)

$(HDPI)/$(SQ_ICON): img/android.svg
	$(call svg-to-png,72,4)

$(XHDPI)/$(SQ_ICON): img/android.svg
	$(call svg-to-png,96,4)

$(XXHDPI)/$(SQ_ICON): img/android.svg
	$(call svg-to-png,144,4)

$(XXXHDPI)/$(SQ_ICON): img/android.svg
	$(call svg-to-png,192,4)


$(MDPI)/$(RND_ICON): img/android.round.svg
	$(call svg-to-png,48,4)

$(HDPI)/$(RND_ICON): img/android.round.svg
	$(call svg-to-png,72,4)

$(XHDPI)/$(RND_ICON): img/android.round.svg
	$(call svg-to-png,96,4)

$(XXHDPI)/$(RND_ICON): img/android.round.svg
	$(call svg-to-png,144,4)

$(XXXHDPI)/$(RND_ICON): img/android.round.svg
	$(call svg-to-png,192,4)


$(AND_RES)/ic_launcher-web.png: img/android.svg
	$(call svg-to-png,512,4)


$(shell   mkdir -p $(DIRECTORIES))
