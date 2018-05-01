"use strict";
function DontYouFillItCanvasGui(game, highscore) {
	var that = this; // Allow closures to access this.

	function px(v) { return v + 'px'; }

	function drawCannon() {
		// Old android stock browser needs the webkit prefix.
		Turret.style.transform = Turret.style["webkitTransform"] = "rotate(-" + game.cannon.getAngle() + "rad)";
	}

	function drawCurrentBall() {
		if(game.currentBall) {
			var dx = (game.currentBall.nx - game.currentBall.nr) * (SCALE-2);
			var dy = (1 - game.currentBall.ny - game.currentBall.nr) * (SCALE-2);
			// Using exact values will cause the numbers to not be pixel-perfect.
			// Rounding the values fill fix it, that's OK at a pixelratio of 1,
			// but will cause the balls to "jump" for higher pixelratio.
			LiveBall.style.transform = LiveBall.style["webkitTransform"] = 'translate(' + dx + 'px, '+ dy + 'px)';
			LiveBall.style.display = 'block';
		} else {
			LiveBall.style.display = 'none';
		}
	}

	function drawStaticBalls() {
		if (gameState != undefined) {
			for (var i = 0; i < gameState.previousBalls.length; ++i) {
				var pb = gameState.previousBalls[i];
				if (pb.counter == 0) {
					if (pb.css !== undefined) {
						pb.css.parentNode.removeChild(pb.css);
						delete pb.css;
					}
				}
			}
		}

		for(var i = 0; i < game.staticBalls.length; ++i) {
			var b = game.staticBalls[i];

			var hasBeenResized = false;
			var newBall = b.css === undefined;

			if (newBall) {
				b.css = DefaultBall.cloneNode(true);
				staticBallLayer.appendChild(b.css);
			}

			if ((b.was === undefined) || (b.was != b.counter)) {
				var klassList = b.css.classList;
				if (b.was !== undefined) {
					klassList.remove('B' + b.was);
				}

				b.was = b.counter;
				klassList.add('B' + b.counter);
			}

			if (redrawUponResize || newBall) {
				var dx = (b.nx - b.nr) * (SCALE-2);
				var dy = (1 - b.ny - b.nr) * (SCALE-2);

				b.css.style.left    = px(dx);
				b.css.style.top     = px(dy);
				b.css.style.width   = b.css.style.height = 200 * b.nr + '%';
				b.css.style.display = 'block';
			}
		}
	}

	function draw() {
		if(that.state == that.GAME) {
			if ((gameState === undefined) || (gameState.score != game.score)) {
				Highscore.innerHTML = highscore;
				Score.innerHTML = game.score;
			}

			drawStaticBalls();

			redrawUponResize = false;

			drawCannon();

			drawCurrentBall();

			gameState = {
				previousBalls: game.staticBalls.slice(),
				score: game.score
			};
		}
	}

	function step(time) {
		that.observable.notifyObservers('beginStep');

		if(game.state == game.RUNNING())
			game.update(time);

		draw();

		that.observable.notifyObservers('endStep');

		if(game.state == game.RUNNING()) {
			window.requestAnimationFrame(step);
		} else if(game.state == game.GAMEOVER()) {
			highscore = Math.max(game.score, highscore);

			that.observable.notifyObservers('gameover', game.score);

			for(var i = 0; i < game.staticBalls.length; ++i) {
				var b = game.staticBalls[i];
				b.css.parentNode.removeChild(b.css);
				delete b.css;
			}
		}
	}

	function pauseGame() {
		if(game.state == game.RUNNING()) {
			game.pause();
			that.observable.notifyObservers('pause');
		}
	}

	function handleVisibilityChange() {
		if(document.hidden) {
			pauseGame();
		}
	}

	var redrawUponResize = true;

	function resizeCanvas() {
		computeGameDimensions();

		board.style.width  = px(GAME_WIDTH);
		board.style.height = px(GAME_HEIGHT);
		board.style.left   = px(H_OFFSET);
		board.style.top    = px(V_OFFSET);

		staticBallLayer.style.width = staticBallLayer.style.height = px(SCALE);
		liveBallLayer.style.width = liveBallLayer.style.height = px(SCALE);
		staticBallLayer.style.top = liveBallLayer.style.top = px(TOP_BORDER);

		LiveBall.style.width   = LiveBall.style.height = 200 * game.DEFAULT_BALL_RADIUS + '%';

		redrawUponResize = true;

		// Redraw event when the game is not running
		if(game.state != game.RUNNING())
			window.requestAnimationFrame(step);
	}

	function computeGameDimensions() {
		var w = container.clientWidth, h = container.clientHeight;

		if(w / h < 3/4) {
			SCALE = w;
		} else {
			SCALE = Math.floor(3/4 * h);
		}

		GAME_WIDTH         = SCALE;
		GAME_HEIGHT        = Math.floor(4/3 * SCALE);
		V_OFFSET           = Math.floor((h - GAME_HEIGHT) / 2);
		H_OFFSET           = Math.floor((w - GAME_WIDTH) / 2);
		TOP_BORDER         = Math.floor(SCALE / 6);
		BOTTOM_BORDER      = TOP_BORDER + SCALE;
		LEFT_BORDER        = 0;
		RIGHT_BORDER       = LEFT_BORDER + SCALE;

		// Until text-size-adjust is supported
		document.getElementById('Score').style.font = SCALE / 12 + "px Arial";
	}

	this.MENU = 1;
	this.GAME = 2;

	this.state = this.MENU;

	this.game = game;
	this.observable = new Observable();

	var    container = document.getElementById('Game'),
	           board = document.getElementById('Board'),
	 staticBallLayer = document.getElementById('StaticBallLayer'),
	   liveBallLayer = document.getElementById('LiveBallLayer'),
	          cannon = document.getElementById('Cannon');

	var DefaultBall = document.getElementById('DefaultBall');
	DefaultBall.removeAttribute('id');

	var LiveBall = DefaultBall.cloneNode(true);
	LiveBall.setAttribute('id', 'LiveBall');
	LiveBall.classList.add('B3');
	LiveBall.style.display = 'none';
	liveBallLayer.appendChild(LiveBall);

	var Turret = document.getElementById('Turret');
	var Highscore = document.getElementById('highscore');
	var Score = document.getElementById('score');

	var lastClickDate = 0;

	// Some browser (e.g. Android stock browser) might generate a click event after a touch one,
	// even if preventDefault()/stopPropagation() has been called.
	function isGhostEvent(evt) {
		if (evt.timeStamp - lastClickDate < 500) return true;
		lastClickDate = evt.timeStamp;
		return false;
	}

	function addTouchOrClickEvent(element, callback) {
		var e = (typeof element === 'string') ? document.getElementById(element) : element;
		e.addEventListener('click', callback);
		// A listener on touchstart is mandatory as some browser will wait 300ms before
		// firing the click event associated to a touch action (in order to distinguish
		// a click from a scrolling action).
		// Flag touch event handler as non-passive so it does not break scrolling.
		// OK, there's no scrolling, but this will generate a warning if the passive
		// option is left to true (the default value).
		// https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
		// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners
		e.addEventListener('touchstart', callback, supportsPassive ? { passive: false } : false);
	}

	var gameState = undefined;

	var SCALE, GAME_WIDTH, GAME_HEIGHT, V_OFFSET, H_OFFSET,
	    BOTTOM_BORDER, TOP_BORDER, LEFT_BORDER, RIGHT_BORDER,
	    FONT;

	window.addEventListener('resize', resizeCanvas, false);

	addTouchOrClickEvent('PauseButton', function(evt) {
		evt.preventDefault();
		evt.stopPropagation(); // Otherwise canvas receives it on Firefox.
		if (isGhostEvent(evt)) return;
		pauseGame();
	});

	addTouchOrClickEvent(container, function(evt) {
		evt.preventDefault();
		if (isGhostEvent(evt)) return;
		if((game.currentBall == null) && (game.state == game.RUNNING())) {
			game.fire();
		}
	});

	document.addEventListener('visibilitychange', handleVisibilityChange, false);

	this.resume = function() {
		game.resume();
		this.state = this.GAME;
		window.requestAnimationFrame(step);
	};

	this.reset = function() {
		gameState = undefined;
		game.reset();
		window.requestAnimationFrame(step);
	};

	resizeCanvas();

	window.requestAnimationFrame(step);
}

DontYouFillItCanvasGui.prototype.addObserver = function(o) {
	this.observable.addObserver(o);
};

DontYouFillItCanvasGui.prototype.removeObserver = function(o) {
	this.observable.removeObserver(o);
};

DontYouFillItCanvasGui.prototype.hasObserver = function(o) {
	return this.observable.hasObserver(o);
};

DontYouFillItCanvasGui.prototype.notifyObservers = function() {
	this.observable.notifyObservers();
};
