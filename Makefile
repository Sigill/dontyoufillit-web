# http://msdn.microsoft.com/en-us/library/windows/desktop/dn742485.aspx
FAVICONS = dist/icon-16x16.png \
           dist/icon-32x32.png \
           dist/favicon.ico

# https://developer.apple.com/library/content/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
# https://developer.apple.com/ios/human-interface-guidelines/icons-and-images/app-icon/
APL_ICONS = dist/touch-icon-iphone.png \
            dist/touch-icon-ipad.png \
            dist/touch-icon-iphone-retina.png \
            dist/touch-icon-ipad-retina.png

# Ignore Safari Pinned Tabs icons
# https://developer.apple.com/library/content/documentation/AppleApplications/Reference/SafariWebContent/pinnedTabs/pinnedTabs.html

# https://docs.microsoft.com/en-us/windows/uwp/design/shell/tiles-and-notifications/app-assets
# https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/dn320426(v=vs.85)
MSTILE_ICONS = dist/mstile-70x70.png \
               dist/mstile-150x150.png \
               dist/mstile-310x150.png \
               dist/mstile-310x310.png

# Chrome web store icons
# https://developer.chrome.com/webstore/images

# Progressive web apps icons
# https://developers.google.com/web/fundamentals/app-install-banners/
PWA_ICONS = dist/ic_launcher_48.png \
            dist/ic_launcher_72.png \
            dist/ic_launcher_96.png \
            dist/ic_launcher_144.png \
            dist/ic_launcher_192.png

CACHED_FILES = cache.manifest \
               dist/play.html \
               dist/app.css \
               dist/app.js \
               dist/service-worker.js \
               dist/favicon.ico \
               dist/icon-16x16.png \
               dist/icon-32x32.png

WEB_FILES = $(FAVICONS) $(APL_ICONS) $(MSTILE_ICONS) $(PWA_ICONS) \
            dist/play_online.html dist/play.html dist/app.js dist/app.css dist/cache.manifest dist/.htaccess dist/manifest.json

AND_RES = android/res
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

AND_AST = android/assets

AND_JS = $(AND_AST)/requestAnimationFrame.js \
         $(AND_AST)/passiveEvent.js \
         $(AND_AST)/stats.js \
         $(AND_AST)/observable.js \
         $(AND_AST)/dontyoufillit.js \
         $(AND_AST)/dontyoufillit_css_gui.js \
         $(AND_AST)/app.js

AND_FILES = $(AND_LAUNCHER_ICONS) $(AND_JS) $(AND_AST)/app.css $(AND_AST)/play.html

DIRECTORIES = $(MDPI) $(HDPI) $(XHDPI) $(XXHDPI) $(XXXHDPI) $(AND_AST) tmp dist

.PHONY: all clean
all: $(WEB_FILES) $(AND_FILES)

clean:
	rm -rf android/ tmp/ dist/

define svg-to-png =
	inkscape -o $@ -w $(1) -h $(1) $< && pngcrush -brute -c $(2) -q -ow $@
endef

dist/icon-16x16.png: img/icon3.svg
	$(call svg-to-png,16,4)

dist/icon-32x32.png: img/icon3.svg
	$(call svg-to-png,32,4)

tmp/icon-48x48.png: img/icon3.svg
	$(call svg-to-png,48,4)

tmp/icon-256x256.png: img/icon3.svg
	$(call svg-to-png,256,4)

dist/favicon.ico: dist/icon-16x16.png dist/icon-32x32.png tmp/icon-48x48.png tmp/icon-256x256.png
	convert $^ $@


dist/touch-icon-iphone.png: img/icon.svg
	$(call svg-to-png,120,0)

dist/touch-icon-ipad.png: img/icon.svg
	$(call svg-to-png,152,0)

dist/touch-icon-iphone-retina.png: img/icon.svg
	$(call svg-to-png,180,0)

dist/touch-icon-ipad-retina.png: img/icon.svg
	$(call svg-to-png,167,0)


dist/mstile-70x70.png: img/android.adaptive.svg
	inkscape -o $@ -w 70 -h 70 $<&& montage $@ -geometry +0+0 -background black $@ && pngcrush -brute -c 0 -q -ow $@

dist/mstile-150x150.png: img/android.adaptive.svg
	inkscape -o $@ -w 150 -h 150 $< && montage $@ -geometry +0+0 -background black $@ && pngcrush -brute -c 0 -q -ow $@

dist/mstile-310x150.png: img/android.adaptive.svg
	inkscape -o $@ -w 150 -h 150 $< && montage $@ -geometry +80+0 -background black $@ && pngcrush -brute -c 0 -q -ow $@

dist/mstile-310x310.png: img/android.adaptive.svg
	inkscape -o $@ -w 310 -h 310 $< && montage $@ -geometry +0+0 -background black $@ && pngcrush -brute -c 0 -q -ow $@


dist/ic_launcher_48.png: $(MDPI)/$(SQ_ICON)
	cp $< $@

dist/ic_launcher_72.png: $(HDPI)/$(SQ_ICON)
	cp $< $@

dist/ic_launcher_96.png: $(XHDPI)/$(SQ_ICON)
	cp $< $@

dist/ic_launcher_144.png: $(XXHDPI)/$(SQ_ICON)
	cp $< $@

dist/ic_launcher_192.png: $(XXXHDPI)/$(SQ_ICON)
	cp $< $@


## Add paragraph markup to license file
# Removes empty lines and add paragraph tags to each lines
tmp/LICENSE: LICENSE
	sed -e '/^\s*$$/d' -e 's/^/<p>/g' -e 's/$$/<\/p>/g' $< > $@


dist/play_online.html: play.html tmp/LICENSE
	# Add license, strip unneeded js files (due to minimization)
	sed -e '/\$$LICENSE\$$/{r tmp/LICENSE' -e 'd}' \
	    -e '/BEGIN JS/,/END JS/d' \
	    -e '/BEGIN WEB/d' \
	    -e '/END WEB/d' \
	    $< > $@


dist/play.html: dist/play_online.html
	# Add the cache manifest to the game
	sed -e 's/<html>/<html manifest="cache.manifest">/g' $< > $@


dist/cache.manifest: cache.manifest $(CACHED_FILES)
	# Compute a hash of all the files that need to be cached.
	# and put it in the cache manifest, in order to make it unique.
	h=$$(tar -c $^|sha1sum|cut -d ' ' -f1); \
	sed -e "s/# hash xyz/# hash $$h/g" $< > $@


dist/service-worker.js: service-worker.js
	cp $< $@

dist/manifest.json: manifest.json
	cp $< $@

dist/app.js: requestAnimationFrame.js passiveEvent.js stats.js observable.js dontyoufillit.js dontyoufillit_css_gui.js app.js
	closure-compiler --compilation_level SIMPLE_OPTIMIZATIONS $^ > $@


dist/app.css: app.css
	cat $< | cssmin -w 512 > $@


dist/.htaccess: .htaccess
	cp .htaccess dist/


$(AND_AST)/play.html: play.html tmp/LICENSE
	# Add license, remove web specific content
	sed -e '/\$$LICENSE\$$/{r tmp/LICENSE' -e 'd}' \
	    -e '/BEGIN WEB/,/END WEB/d' \
	    -e '/BEGIN JS/d' \
	    -e '/END JS/d' \
	    $< > $@


$(AND_AST)/app.css: app.css
	cp $< $@


$(AND_AST)/%.js: %.js
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
