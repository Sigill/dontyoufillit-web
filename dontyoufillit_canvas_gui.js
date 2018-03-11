"use strict";
function DontYouFillItCanvasGui(game, canvasID) {
	var that = this; // Allow closures to access this.

	function drawPauseButton() {
		var x1 = mainCtx.canvas.width - Math.floor(SCALE / 6 * 0.9),
		    x2 = mainCtx.canvas.width - Math.floor(SCALE / 6 * 0.4),
		     y = Math.floor(SCALE / 6 * 0.1),
		     w = Math.floor(SCALE / 6 * 0.3),
		     h = Math.floor(SCALE / 6 * 0.8);

		mainCtx.fillStyle = 'white';
		mainCtx.fillRect(x1, y, w, h);
		mainCtx.fillRect(x2, y, w, h);
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

	function drawMainCanvas(ctx) {
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		ctx.strokeStyle = 'white';
		ctx.lineWidth = '1';

		// Always add 0.5 to coordinates of lines of width 1
		// https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Canvas_tutorial/Applying_styles_and_colors#A_lineWidth_example

		ctx.beginPath();
		ctx.moveTo(Math.floor(LEFT_BORDER) + 0.5, Math.floor(BOTTOM_BORDER) + 0.5);
		ctx.lineTo(Math.floor(LEFT_BORDER) + 0.5, Math.floor(TOP_BORDER) + 0.5);
		ctx.lineTo(Math.floor(RIGHT_BORDER) - 0.5, Math.floor(TOP_BORDER) + 0.5);
		ctx.lineTo(Math.floor(RIGHT_BORDER) - 0.5, Math.floor(BOTTOM_BORDER) + 0.5);
		if(!ctx.setLineDash)
			ctx.closePath();
		ctx.stroke();

		// Android stock browser does not support setLineDash
		// (at least on version <= 4.1.2)
		if(ctx.setLineDash) {
			ctx.beginPath();
			ctx.setLineDash([5, 5]);
			ctx.moveTo(Math.floor(RIGHT_BORDER) - 0.5, Math.floor(BOTTOM_BORDER) + 0.5);
			ctx.lineTo(Math.floor(LEFT_BORDER) + 0.5, Math.floor(BOTTOM_BORDER) + 0.5);
			ctx.stroke();
			ctx.setLineDash([]);
		}

		drawPauseButton();

		ctx.textAlign = 'left';
		ctx.textBaseline = 'bottom';
		ctx.font = Math.floor(SCALE / 12) + 'px Arial';
		ctx.fillText('Highscore', LEFT_BORDER, TOP_BORDER - SCALE / 12 + SCALE / 120);
		ctx.fillText('Score', LEFT_BORDER, TOP_BORDER);

		var scoreOffset = ctx.measureText('Highscore ').width;
		ctx.fillText(game.highscore, LEFT_BORDER + scoreOffset, TOP_BORDER - SCALE / 12 + SCALE / 120);
		ctx.fillText(game.score, LEFT_BORDER + scoreOffset, TOP_BORDER);
	}

	function drawCannonCanvas() {
		clearCanvas(cannonCtx);

		cannonCtx.setTransform(1, 0, 0, 1, 0, 0);
		cannonCtx.translate(-SCALE / 2 + Math.ceil(CANNON_BBOX_WIDTH) / 2,
		                    -GAME_HEIGHT + Math.ceil(CANNON_BBOX_HEIGHT));
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

			ballCtx.canvas.style.left = Math.floor(H_OFFSET) + Math.floor(LEFT_BORDER) + dx + "px";
			ballCtx.canvas.style.top = Math.floor(V_OFFSET) + Math.floor(BOTTOM_BORDER) + dy + "px";
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

				b.ctx.canvas.style.left = dx + "px";
				b.ctx.canvas.style.top = Math.floor(SCALE) + dy + "px";
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
				drawMainCanvas(mainCtx);
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
			setScreenVisible(gameoverScreen, 1);
		}
	}

	function pauseGame() {
		if(game.state == game.RUNNING()) {
			game.pause();
			setScreenVisible(pauseScreen, 1);
		}
	}

	function handleTouchOrClick(evx, evy) {
		var rect = mainCtx.canvas.getBoundingClientRect();
		var x = evx - rect.left,
		    y = evy - rect.top;

		// Pause button bbox.
		var xp1 = mainCtx.canvas.width - SCALE / 6,
		    xp2 = mainCtx.canvas.width,
		    yp1 = 0,
		    yp2 = SCALE / 6;

		if ((x > xp1) && (x <= xp2) && (y > yp1) && (y <= yp2)) {
			pauseGame();
			return;
		}

		if((game.currentBall == null) && (game.state == game.RUNNING())) {
			game.fire();
			return;
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

		mainCtx.canvas.width = Math.floor(GAME_WIDTH);
		mainCtx.canvas.height = Math.floor(GAME_HEIGHT);
		mainCtx.canvas.style.left = Math.floor(H_OFFSET) + "px";
		mainCtx.canvas.style.top = Math.floor(V_OFFSET) + "px";

		cannonCtx.canvas.width = Math.ceil(CANNON_BBOX_WIDTH);
		cannonCtx.canvas.height = Math.ceil(CANNON_BBOX_HEIGHT);
		cannonCtx.canvas.style.left = Math.ceil(H_OFFSET + (SCALE - CANNON_BBOX_WIDTH) / 2) + "px";
		cannonCtx.canvas.style.top = Math.floor(V_OFFSET + GAME_HEIGHT - CANNON_BBOX_HEIGHT) + "px";

		ballCtx.canvas.width = BALL_CANVAS_SIZE;
		ballCtx.canvas.height = BALL_CANVAS_SIZE;

		ballContainer.style.width = Math.floor(SCALE) + "px";
		ballContainer.style.height = Math.floor(SCALE) + "px";
		ballContainer.style.left = Math.floor(H_OFFSET) + "px";
		ballContainer.style.top = Math.floor(V_OFFSET) + Math.floor(TOP_BORDER) + "px";

		redrawUponResize = true;

		// Redraw event when the game is not running
		if(game.state != game.RUNNING())
			window.requestAnimationFrame(step);
	}

	function computeGameDimensions() {
		var w = container.clientWidth, h = container.clientHeight;

		if(w / h < 3/4) {
			GAME_WIDTH = w;
			GAME_HEIGHT = 4/3 * GAME_WIDTH;
		} else {
			GAME_HEIGHT = h;
			GAME_WIDTH = 3/4 * GAME_HEIGHT;
		}

		SCALE              = GAME_WIDTH;
		V_OFFSET           = (h - GAME_HEIGHT) / 2;
		H_OFFSET           = (w - GAME_WIDTH) / 2;
		TOP_BORDER         = SCALE / 6;
		BOTTOM_BORDER      = TOP_BORDER + SCALE;
		LEFT_BORDER        = 0;
		RIGHT_BORDER       = LEFT_BORDER + SCALE;
		CANNON_BASE_WIDTH  = SCALE / 10;
		CANNON_BASE_HEIGHT = SCALE / 15;
		CANNON_LENGTH      = SCALE / 15;
		CANNON_WIDTH       = SCALE / 18;
		BALL_CANVAS_SIZE   = Math.ceil(SCALE / 20.0) + BALL_CANVAS_MARGIN * 2;

		var cannon_hypot = Math.sqrt((CANNON_WIDTH / 2) * (CANNON_WIDTH / 2) + CANNON_LENGTH * CANNON_LENGTH)
		CANNON_BBOX_WIDTH  = cannon_hypot * 2;
		CANNON_BBOX_HEIGHT = CANNON_BASE_HEIGHT + cannon_hypot;
	}

	function setScreenVisible(screen, zindex) {
		screen.style.zIndex = (zindex >= 0 ? zindex : -1);
		screen.scrollTop = 0;
		// Prevent flickering
		screen.style.display = (zindex >= 0 ? 'block' : 'none');
	}

	this.MENU = 1;
	this.GAME = 2;

	this.state = this.MENU;

	this.game = game;
	this.observable = new Observable();



	var     mainCtx = document.getElementById("MainCanvas").getContext('2d'),
	      cannonCtx = document.getElementById("CannonCanvas").getContext('2d'),
	        ballCtx = document.getElementById("BallCanvas").getContext('2d'),
	      container = mainCtx.canvas.parentNode,
	  ballContainer = document.getElementById('Balls'),
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

	function addTouchOrClickEvent(elementId, callback) {
		var e = document.getElementById(elementId);
		e.addEventListener('click', callback);
		e.addEventListener('touchstart', callback, supportsPassive ? { passive: false } : false);
	}

	var gameState = undefined;

	addTouchOrClickEvent('startScreenPlayButton', function(evt) {
		evt.preventDefault();
		if (isGhostEvent(evt)) return;
		game.resume();
		that.state = that.GAME;
		window.requestAnimationFrame(step);
		setScreenVisible(startScreen, -1);
	});

	addTouchOrClickEvent('pauseScreenContinueButton', function(evt) {
		evt.preventDefault();
		if (isGhostEvent(evt)) return;
		game.resume();
		window.requestAnimationFrame(step);
		setScreenVisible(pauseScreen, -1);
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
		setScreenVisible(gameoverScreen, -1);
	});

	addTouchOrClickEvent('startScreenLicenseButton', function(evt) {
		evt.preventDefault();
		if (isGhostEvent(evt)) return;
		setScreenVisible(licenseScreen, 2);
	});

	addTouchOrClickEvent('licenseScreenBackButton', function(evt) {
		evt.preventDefault();
		if (isGhostEvent(evt)) return;
		setScreenVisible(licenseScreen, -1);
	});

	var SCALE, GAME_WIDTH, GAME_HEIGHT, V_OFFSET, H_OFFSET,
	    BOTTOM_BORDER, TOP_BORDER, LEFT_BORDER, RIGHT_BORDER,
	    CANNON_BASE_WIDTH, CANNON_BASE_HEIGHT, CANNON_LENGTH, CANNON_WIDTH,
	    CANNON_BBOX_WIDTH, CANNON_BBOX_HEIGHT,
	    BALL_CANVAS_SIZE,
	    BALL_CANVAS_MARGIN = 8;

	window.addEventListener('resize', resizeCanvas, false);

	[mainCtx.canvas, container].forEach(function(e) {
		e.addEventListener('mousedown', function(evt) {
			evt.preventDefault();
			if (isGhostEvent(evt)) return;
			handleTouchOrClick(evt.clientX, evt.clientY);
		}, false);
		// Flag the event handler as non-passive so it does not break scrolling. OK, there's no scrolling,
		// but this will generate a warning if the passive option is left to true (the default value).
		// https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
		// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners
		e.addEventListener('touchstart', function(evt) {
			evt.preventDefault();
			if (isGhostEvent(evt)) return;
			handleTouchOrClick(evt.touches[0].clientX, evt.touches[0].clientY);
		}, supportsPassive ? { passive: false } : false);
	});

	document.addEventListener('visibilitychange', handleVisibilityChange, false);

	resizeCanvas();

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
