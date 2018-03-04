"use strict";
var game = new DontYouFillItGame();
var gui = new DontYouFillItCanvasGui(game, 'c');

function parseQueryString() {
	var map = {};

	var query = window.location.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=', 2);
		map[pair[0]] = (pair.length == 2) ? pair[1] : true;
	}

	return map;
}

var qs = parseQueryString();

if(qs['debug']) {
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

gui.androidStockCompat = (qs['stock'] == true);
