"use strict";
var game = new DontYouFillItGame();
var gui = new DontYouFillItCanvasGui(game, 'c');

function isDebug() {
	var query = window.location.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		if (pair[0] == 'debug') {
			return true;
		}
	}
	return false;
}

if(isDebug()) {
	var stats = new Stats();
	stats.setMode(0); // 0: fps, 1: ms
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.bottom = '0px';
	document.body.appendChild( stats.domElement );

	gui.addObserver(function(message) {
		if(message == 'beginStep')
			stats.begin();
		else if(message == 'endStep')
			stats.end();
	});
}

