"use strict";
function DontYouFillItCanvasGui(game, canvasID) {
	var that = this; // Allow closures to access this.

	function drawPauseButton(ctx) {
		var x1 = Math.floor(SCALE / 6 * 0.1),
		    x2 = Math.floor(SCALE / 6 * 0.6),
		     y = Math.floor(SCALE / 6 * 0.1),
		     w = Math.floor(SCALE / 6 * 0.3),
		     h = Math.floor(SCALE / 6 * 0.8);

		ctx.fillStyle = 'white';
		ctx.fillRect(x1, y, w, h);
		ctx.fillRect(x2, y, w, h);
	}

	function drawCannon(ctx) {
		var r = Math.round(CANNON_BASE_WIDTH / 2),
		   xc = Math.round(SCALE / 2),
		   x1 = xc - r,
		   x2 = xc + r,
		   y1 = Math.round(BOTTOM_BORDER + SCALE / 6),
		   y2 = Math.round(BOTTOM_BORDER + SCALE / 6 - CANNON_BASE_HEIGHT);

		ctx.lineWidth = CANNON_WIDTH;
		ctx.fillStyle = 'white';
		ctx.strokeStyle = 'white';
		ctx.lineCap   = 'butt';

		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x1, y2);
		ctx.arc(xc, y2, r, Math.PI, 0);
		ctx.lineTo(x2, y1);
		ctx.closePath();
		ctx.fill();

		ctx.beginPath();
		ctx.moveTo(xc, y2);
		ctx.lineTo(xc + Math.cos(game.cannon.getAngle()) * CANNON_LENGTH,
		           y2 - Math.sin(game.cannon.getAngle()) * CANNON_LENGTH);
		ctx.closePath();
		ctx.stroke();
	}

	function id(v) { return v; }

	function path(ctx) {
		ctx.moveTo(arguments[1], arguments[2]);
		for(var i = 3; i < arguments.length; i += 2)
			ctx.lineTo(arguments[i], arguments[i+1]);
	}

	function drawBall(ctx, ball) {
		var x =  ball.nx * SCALE,
		    y = -ball.ny * SCALE,
		    r =  ball.nr * SCALE;

		// Only floor/ceil if the ball is big enough, small numbers
		// will otherwise have irregular shapes.
		var f = (r > 32) ? Math.floor : id;
		var c = (r > 32) ? Math.ceil : id;

		ctx.fillStyle = 'white';
		ctx.strokeStyle = 'white';
		ctx.lineWidth = 1;

		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI*2, false);

		if(ball.counter == 1) {
			var x1 = f(x - r * 0.2), x2 = c(x + r * 0.2),
			    y1 = f(y - r * 0.7), y2 = c(y + r * 0.7);
			path(ctx, x1, y1, x1, y2, x2, y2, x2, y1);
		} else if(ball.counter == 2) {
			var x1 = f(x - r * 0.5), x2 = f(x - r * 0.1),
			    x3 = c(x + r * 0.1), x4 = c(x + r * 0.5),
			    y1 = f(y - r * 0.7), y2 = f(y - r * 0.3),
			    y3 = f(y - r * 0.15), y4 = c(y + r * 0.15),
			    y5 = c(y + r * 0.3), y6 = c(y + r * 0.7);
			path(ctx, x4, y1, x1, y1, x1, y2, x3, y2, x3, y3, x1, y3,
			          x1, y6, x4, y6, x4, y5, x2, y5, x2, y4, x4, y4);
		} else if(ball.counter == 3) {
			var x1 = f(x - r * 0.5), x2 = c(x + r * 0.1), x3 = c(x + r * 0.5),
			    y1 = f(y - r * 0.7), y2 = f(y - r * 0.3), y3 = f(y - r * 0.15),
			    y4 = c(y + r * 0.15), y5 = c(y + r * 0.3), y6 = c(y + r * 0.7);
			path(ctx, x3, y1, x1, y1, x1, y2, x2, y2, x2, y3, x1, y3,
			          x1, y4, x2, y4, x2, y5, x1, y5, x1, y6, x3, y6);
		}

		ctx.closePath();
		ctx.fill();
	}

	function clearCanvas(ctx) {
		// clearRect might not work in android stock browser.
		if (!that.androidStockCompat) {
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		} else {
			// Efficient workaround, but does not support stacking transparent canvas.
			// ctx.fillStyle = 'black';
			// ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			// https://issuetracker.google.com/issues/36957795#comment16
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.canvas.style.display = 'none';// Detach from DOM
			ctx.canvas.offsetHeight; // Force the detach
			ctx.canvas.style.display = 'inherit'; // Reattach to DOM

			// Another solution (triggers a reallocation of the canvas).
			// Slightly less efficient that the solution above.
			// ctx.canvas.width = ctx.canvas.width;
		}
	}

	function drawScoreCanvas(ctx) {
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		ctx.fillStyle = 'white';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'bottom';
		ctx.font = FONT;
		ctx.fillText('Highscore', LEFT_BORDER, TOP_BORDER - SCALE / 12 + SCALE / 120);
		ctx.fillText('Score', LEFT_BORDER, TOP_BORDER);

		var scoreOffset = ctx.measureText('Highscore ').width;
		ctx.fillText(game.highscore, LEFT_BORDER + scoreOffset, TOP_BORDER - SCALE / 12 + SCALE / 120);
		ctx.fillText(game.score, LEFT_BORDER + scoreOffset, TOP_BORDER);
	}

	function drawPauseCanvas(ctx) {
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		drawPauseButton(ctx);
	}

	function drawCannonCanvas() {
		clearCanvas(cannonCtx);

		cannonCtx.setTransform(1, 0, 0, 1, 0, 0);
		cannonCtx.translate(-SCALE / 2 + CANNON_BBOX_WIDTH / 2,
		                    -GAME_HEIGHT + CANNON_BBOX_HEIGHT);
		drawCannon(cannonCtx, game.cannon);
		cannonCtx.setTransform(1, 0, 0, 1, 0, 0);
	}

	function drawCurrentBallCanvas() {
		if(game.currentBall) {
			var x =  game.currentBall.nx * SCALE,
			    y = -game.currentBall.ny * SCALE,
			    r =  game.currentBall.nr * SCALE;
			// Position of the ball canvas.
			var dx = Math.floor(x - r - BALL_CANVAS_MARGIN),
			    dy = Math.floor(y - r - BALL_CANVAS_MARGIN);

			ballCtx.setTransform(1, 0, 0, 1, 0, 0);

			clearCanvas(ballCtx);

			ballCtx.save();

			ballCtx.translate(-dx, -dy);
			drawBall(ballCtx, game.currentBall);

			ballCtx.restore();

			ballCtx.canvas.style.left    = H_OFFSET + Math.floor(LEFT_BORDER) + dx + "px";
			ballCtx.canvas.style.top     = V_OFFSET + Math.floor(BOTTOM_BORDER) + dy + "px";
			ballCtx.canvas.style.display = 'block';
		} else {
			ballCtx.canvas.style.display = 'none';
		}
	}

	var recycledCtx = [];

	function drawStaticBalls() {
		if (gameState != undefined) {
			for (var i = 0; i < gameState.previousBalls.length; ++i) {
				var pb = gameState.previousBalls[i];
				if (pb.counter == 0) {
					recycledCtx.push(pb.ctx);
					delete pb.ctx;
				}
			}
		}

		for(var i = 0; i < game.staticBalls.length; ++i) {
			var b = game.staticBalls[i];
			var x =  b.nx * SCALE,
			    y = -b.ny * SCALE,
			    r =  b.nr * SCALE;
			// Position of the ball canvas.
			var dx = Math.floor(x - r - 1),
			    dy = Math.floor(y - r - 1);

			var hasBeenResized = false;

			if (redrawUponResize || (b.ctx === undefined)) {
				if (b.ctx === undefined) {
					if (recycledCtx.length == 0) { // No recycled canvas available, create a new one.
						b.ctx = document.createElement('canvas').getContext('2d');
						b.ctx.canvas.classList.add('ball');
						ballContainer.appendChild(b.ctx.canvas);
					} else {
						b.ctx = recycledCtx.pop();
					}
				}

				var s = Math.ceil(r * 2) + 2;
				var c = b.ctx.canvas;

				if (c.width != s || c.height != s) {
					c.width = s;
					c.height = s;
					hasBeenResized = true;
				}

				// -1 because of the border of the div.
				b.ctx.canvas.style.left = (dx - 1) + "px";
				b.ctx.canvas.style.top = (SCALE - 1) + dy + "px";
				b.ctx.canvas.style.display = 'block';
			}

			if (redrawUponResize || (b.was === undefined) || (b.was != b.counter)) {
				b.was = b.counter;

				b.ctx.setTransform(1, 0, 0, 1, 0, 0);

				// Clearing the canvas might be an expensive operation (thank you, Android stock browser).
				// Don't do it if the canvas has been resized (which already cleared it).
				if (!hasBeenResized)
					clearCanvas(b.ctx);

				b.ctx.translate(-dx, -dy);
				drawBall(b.ctx, b);
			}
		}

		// Hide any unused context
		for (var i = 0; i < recycledCtx.length; ++i) {
			if (recycledCtx[i].canvas.style.display != "none")
				recycledCtx[i].canvas.style.display = "none";
		}
	}

	function draw() {
		if(that.state == that.GAME) {
			if (redrawUponResize || (gameState === undefined) || (gameState.score != game.score)) {
				drawScoreCanvas(scoreCtx);
			}

			if (redrawUponResize){
				drawPauseCanvas(pauseCtx);
			}

			drawStaticBalls();

			redrawUponResize = false;

			drawCannonCanvas();

			drawCurrentBallCanvas();

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
			document.getElementById('gameoverScreenScoreMessage').style.display = (game.newHighscore ? 'none' : 'inline');
			document.getElementById('gameoverScreenHighscoreMessage').style.display = (game.newHighscore ? 'inline' : 'none');
			document.getElementById('gameoverScreenScore').innerHTML = game.score;
			pushScreen(gameoverScreen);
		}
	}

	function pauseGame() {
		if(game.state == game.RUNNING()) {
			game.pause();
			pushScreen(pauseScreen);
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

		scoreCtx.font              = FONT;
		scoreCtx.canvas.width      = Math.ceil(scoreCtx.measureText('Highscore XXXX').width);
		scoreCtx.canvas.height     = Math.ceil(SCALE / 6);
		scoreCtx.canvas.style.left = H_OFFSET + "px";
		scoreCtx.canvas.style.top  = V_OFFSET + "px";

		pauseCtx.canvas.width      = Math.ceil(SCALE / 6);
		pauseCtx.canvas.height     = Math.ceil(SCALE / 6);
		pauseCtx.canvas.style.left = H_OFFSET + GAME_WIDTH - Math.ceil(SCALE / 6) + "px";
		pauseCtx.canvas.style.top  = V_OFFSET + "px";

		cannonCtx.canvas.width      = CANNON_BBOX_WIDTH;
		cannonCtx.canvas.height     = CANNON_BBOX_HEIGHT;
		cannonCtx.canvas.style.left = Math.ceil(H_OFFSET + (SCALE - CANNON_BBOX_WIDTH) / 2) + "px";
		cannonCtx.canvas.style.top  = Math.floor(V_OFFSET + GAME_HEIGHT - CANNON_BBOX_HEIGHT) + "px";

		ballCtx.canvas.width  = BALL_CANVAS_SIZE;
		ballCtx.canvas.height = BALL_CANVAS_SIZE;

		// -2 because of the 1px border
		ballContainer.style.width  = SCALE - 2 + "px";
		ballContainer.style.height = SCALE - 2 + "px";
		ballContainer.style.left   = H_OFFSET + "px";
		ballContainer.style.top    = V_OFFSET + TOP_BORDER + "px";

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
		CANNON_BASE_WIDTH  = SCALE / 10;
		CANNON_BASE_HEIGHT = SCALE / 15;
		CANNON_LENGTH      = SCALE / 15;
		CANNON_WIDTH       = SCALE / 18;
		BALL_CANVAS_SIZE   = Math.ceil(SCALE / 20.0) + BALL_CANVAS_MARGIN * 2;

		var cannon_hypot   = Math.sqrt((CANNON_WIDTH / 2) * (CANNON_WIDTH / 2) + CANNON_LENGTH * CANNON_LENGTH)
		CANNON_BBOX_WIDTH  = Math.ceil(cannon_hypot * 2);
		CANNON_BBOX_HEIGHT = Math.ceil(CANNON_BASE_HEIGHT + cannon_hypot);

		FONT = Math.floor(SCALE / 12) + 'px Arial';
	}

	this.MENU = 1;
	this.GAME = 2;

	this.state = this.MENU;

	this.game = game;
	this.observable = new Observable();

	var    scoreCtx = document.getElementById("ScoreCanvas").getContext('2d'),
	       pauseCtx = document.getElementById("PauseCanvas").getContext('2d'),
	      cannonCtx = document.getElementById("CannonCanvas").getContext('2d'),
	        ballCtx = document.getElementById("BallCanvas").getContext('2d'),
	      container = scoreCtx.canvas.parentNode,
	  ballContainer = document.getElementById('Balls'),
	screenContainer = document.getElementById('screenContainer'),
	    startScreen = document.getElementById('startScreen'),
	    pauseScreen = document.getElementById('pauseScreen'),
	 gameoverScreen = document.getElementById('gameoverScreen'),
	  licenseScreen = document.getElementById('licenseScreen');

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

	addTouchOrClickEvent('startScreenPlayButton', function(evt) {
		evt.preventDefault();
		if (isGhostEvent(evt)) return;
		game.resume();
		that.state = that.GAME;
		window.requestAnimationFrame(step);
		popAllScreens();
	});

	addTouchOrClickEvent('pauseScreenContinueButton', function(evt) {
		evt.preventDefault();
		if (isGhostEvent(evt)) return;
		game.resume();
		window.requestAnimationFrame(step);
		popScreen();
	});

	addTouchOrClickEvent('gameoverScreenPlayAgainButton', function(evt) {
		evt.preventDefault();
		if (isGhostEvent(evt)) return;

		for(var i = 0; i < game.staticBalls.length; ++i) {
			recycledCtx.push(game.staticBalls[i].ctx);
			delete game.staticBalls[i].ctx;
		}

		gameState = undefined;
		game.reset();
		window.requestAnimationFrame(step);
		popAllScreens();
	});

	addTouchOrClickEvent('startScreenLicenseButton', function(evt) {
		evt.preventDefault();
		if (isGhostEvent(evt)) return;
		pushScreen(licenseScreen);
	});

	addTouchOrClickEvent('licenseScreenBackButton', function(evt) {
		evt.preventDefault();
		if (isGhostEvent(evt)) return;
		popScreen();
		licenseScreen.reset();
	});

	var SCALE, GAME_WIDTH, GAME_HEIGHT, V_OFFSET, H_OFFSET,
	    BOTTOM_BORDER, TOP_BORDER, LEFT_BORDER, RIGHT_BORDER,
	    CANNON_BASE_WIDTH, CANNON_BASE_HEIGHT, CANNON_LENGTH, CANNON_WIDTH,
	    CANNON_BBOX_WIDTH, CANNON_BBOX_HEIGHT,
	    BALL_CANVAS_SIZE,
	    BALL_CANVAS_MARGIN = 8,
	    FONT;

	window.addEventListener('resize', resizeCanvas, false);

	addTouchOrClickEvent('PauseCanvas', function(evt) {
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

	resizeCanvas();

	pushScreen(startScreen);

	window.requestAnimationFrame(step);
}

DontYouFillItCanvasGui.prototype.addObserver = function(o) {
	this.observable.addObserver(o);
};

DontYouFillItCanvasGui.prototype.removeObserver = function(o) {
	this.observable.removeObserver(o);
};

DontYouFillItCanvasGui.prototype.notifyObservers = function() {
	this.observable.notifyObservers();
};
