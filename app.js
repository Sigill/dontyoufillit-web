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
	stats.showPanel(0); // 0: fps, 1: ms
	stats.dom.style.removeProperty('top');
	stats.dom.style.position = 'fixed';
	stats.dom.style.left = '0px';
	stats.dom.style.bottom = '0px';
	document.body.appendChild( stats.dom );

	gui.addObserver(function(message) {
		if(message == 'beginStep')
			stats.begin();
		else if(message == 'endStep')
			stats.end();
	});
}

gui.androidStockCompat = (qs['stock'] == true);


var screenContainer = document.getElementById('screenContainer'),
        startScreen = document.getElementById('startScreen'),
        pauseScreen = document.getElementById('pauseScreen'),
     gameoverScreen = document.getElementById('gameoverScreen'),
      licenseScreen = document.getElementById('licenseScreen');

var screens = [];

function pushScreen(screen) {
	if (screens.length != 0) screens[screens.length - 1].style.display = 'none';

	screens.push(screen);
	screen.style.zIndex = screens.length;
	// Prevent flickering
	screen.style.visibility = 'hidden';
	screen.style.display = 'block';
	screen.scrollTop = 0;
	screen.style.visibility = 'visible';

	screenContainer.style.display = 'block';
	screenContainer.style.backgroundColor = (screen == pauseScreen) ? 'rgba(0, 0, 0, 0.85)' : 'black';
}

function popScreen() {
	if (screens.length == 0) return;

	screens.pop().style.display = 'none';

	if (screens.length == 0) {
		screenContainer.style.display = 'none';
	} else {
		screens[screens.length - 1].style.display = 'block';
	}
}

function popAllScreens() {
	while(screens.length > 0)
		screens.pop().style.display = 'none';

	screenContainer.style.display = 'none';
}

document.getElementById('startScreenPlayButton').addEventListener('click', function(evt) {
	evt.preventDefault();
	gui.resume();
	popAllScreens();
});

document.getElementById('pauseScreenContinueButton').addEventListener('click', function(evt) {
	evt.preventDefault();
	gui.resume();
	popScreen();
});

document.getElementById('gameoverScreenPlayAgainButton').addEventListener('click', function(evt) {
	evt.preventDefault();
	gui.reset();
	popAllScreens();
});

document.getElementById('startScreenLicenseButton').addEventListener('click', function(evt) {
	evt.preventDefault();
	pushScreen(licenseScreen);
});

document.getElementById('licenseScreenBackButton').addEventListener('click', function(evt) {
	evt.preventDefault();
	popScreen();
	licenseScreen.reset();
});

gui.addObserver(function(message) {
	if(message == 'pause') pushScreen(pauseScreen);
});

gui.addObserver(function(message, score, newHighscore) {
	if(message == 'gameover') {
		document.getElementById('gameoverScreenScoreMessage').style.display = (newHighscore ? 'none' : 'inline');
		document.getElementById('gameoverScreenHighscoreMessage').style.display = (newHighscore ? 'inline' : 'none');
		document.getElementById('gameoverScreenScore').innerHTML = score;
		pushScreen(gameoverScreen);
	}
});

pushScreen(startScreen);


function setNodeText(node, text) {
	var child = node.firstChild;
	do {
		if (3 == child.nodeType) {
			child.nodeValue = text;
			break;
		}
	} while (child = child.nextSibling);
}

Array.prototype.forEach.call(document.getElementsByClassName('hideable'), function(hideable) {
	var foreach_enablers = function(cbk) {
		Array.prototype.forEach.call(document.getElementsByClassName(hideable.getAttribute('data-toggle')), cbk);
	};

	hideable.reset = function() {
		this.style.display = 'none';
		foreach_enablers(function(e) {
			setNodeText(e, "[-]");
		});
	};

	foreach_enablers(function(enabler) {
		enabler.addEventListener('click', function(evt) {
			var visible = hideable.style.display != 'none';
			foreach_enablers(function(e) {
				setNodeText(e, visible ? "[+]" : "[-]");
			});
			hideable.style.display = visible ? 'none' : 'block';
			evt.preventDefault();
		});
	});

	hideable.style.display = 'none';
});

document.getElementById('licenseScreen').reset = function() {
	Array.prototype.forEach.call(this.getElementsByClassName('hideable'), function(hideable) {
		hideable.reset();
	});
};
