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
	stats.dom.style.position = 'absolute';
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

function setNodeText(node, text) {
	var child = node.firstChild;
	do {
		if (3 == child.nodeType) child.nodeValue = text;
	} while (child = child.nextSibling);
}

Array.prototype.forEach.call(document.getElementsByClassName('hideable'), function(hideable) {
	var foreach_enablers = function(cbk) {
		Array.prototype.forEach.call(document.getElementsByClassName(hideable.getAttribute('data-toggle')), cbk);
	};

	hideable.reset = function() {
		this.style.display = 'none';
		foreach_enablers(function(e) {
			setNodeText(e, "Show details");
		});
	};

	foreach_enablers(function(enabler) {
		enabler.addEventListener('click', function(evt) {
			var visible = hideable.style.display != 'none';
			foreach_enablers(function(e) {
				setNodeText(e, visible ? "Show details" : "Hide details");
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
