"use strict";
function DontYouFillItCanvasGui(game, canvasID) {
	var PlayPauseButton = {
		draw: function() {
			var x1 = canvas.width - Math.floor(SCALE / 6 * 0.9),
			    x2 = canvas.width - Math.floor(SCALE / 6 * 0.4),
			     y = Math.floor(SCALE / 6 * 0.1),
			     w = Math.floor(SCALE / 6 * 0.3),
			     h = Math.floor(SCALE / 6 * 0.8);

			ctx.fillStyle = 'white';
			ctx.fillRect(x1, y, w, h);
			ctx.fillRect(x2, y, w, h);
		},
		handleClick: function(x, y) {
			var x1 = canvas.width - SCALE / 6,
			    x2 = canvas.width,
			    y1 = 0,
			    y2 = SCALE / 6;

			if((x > x1) && (x <= x2) && (y > y1) && (y <= y2)) {
				pauseGame();
				return true;
			}

			return false;
		}
	};

	function drawCannon() {
		var r = Math.round(CANNON_BASE_WIDTH / 2),
		   xc = Math.round(SCALE / 2),
		   x1 = xc - r,
		   x2 = xc + r,
		   y1 = Math.round(BOTTOM_BORDER + SCALE / 6),
		   y2 = Math.round(BOTTOM_BORDER + SCALE / 6 - CANNON_BASE_HEIGHT);

		ctx.lineWidth = CANNON_WIDTH;
		ctx.fillStyle = 'white';
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
	};

	function id(v) { return v; }

	function path(ctx) {
		ctx.moveTo(arguments[1], arguments[2]);
		for(var i = 3; i < arguments.length; i += 2)
			ctx.lineTo(arguments[i], arguments[i+1]);
	}

	function drawBall(ball) {
		var x = LEFT_BORDER + ball.nx * SCALE,
		    y = BOTTOM_BORDER - ball.ny * SCALE,
		    r = ball.nr * SCALE;

		// Only floor/ceil if the ball is big enough, small numbers
		// will otherwise have irregular shapes.
		var f = (r > 20) ? Math.floor : id;
		var c = (r > 20) ? Math.ceil : id;

		ctx.fillStyle = 'white';
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

	function drawGame() {
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

		drawCannon(game.cannon);

		for(var i = 0; i < game.staticBalls.length; ++i)
			drawBall(game.staticBalls[i]);

		if(game.currentBall)
			drawBall(game.currentBall);

		PlayPauseButton.draw();

		ctx.textAlign = 'left';
		ctx.textBaseline = 'bottom';
		ctx.font = Math.floor(SCALE / 12) + 'px Arial';
		ctx.fillText('Highscore', LEFT_BORDER, TOP_BORDER - Math.floor(SCALE / 12) + Math.floor(SCALE / 120));
		ctx.fillText('Score', LEFT_BORDER, TOP_BORDER);

		var scoreOffset = ctx.measureText('Highscore ').width;
		ctx.fillText(game.highscore, LEFT_BORDER + scoreOffset, TOP_BORDER - Math.floor(SCALE / 12) + Math.floor(SCALE / 120));
		ctx.fillText(game.score, LEFT_BORDER + scoreOffset, TOP_BORDER);
	}

	function draw() {
		// clearRect might not work in android stock browser.
		if (!that.androidStockCompat) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		} else {
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// https://issuetracker.google.com/issues/36957795#comment16
			// ctx.clearRect(0, 0, canvas.width, canvas.height);
			// canvas.style.display = 'none';// Detach from DOM
			// canvas.offsetHeight; // Force the detach
			// canvas.style.display = 'inherit'; // Reattach to DOM

			// canvas.width = canvas.width;
		}

		if(that.state == that.GAME) {
			drawGame();
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

	function handleTouch(evt) {
		evt.preventDefault();
		handleTouchOrClick(evt.touches[0].clientX, evt.touches[0].clientY);
	}

	function handleClick(evt) {
		evt.preventDefault();
		handleTouchOrClick(evt.clientX, evt.clientY);
	}

	function handleTouchOrClick(evx, evy) {
		if(Date.now() - lastClickDate < 500)
			return;

		lastClickDate = Date.now();

		var rect = canvas.getBoundingClientRect();
		var x = evx - rect.left,
		    y = evy - rect.top;

		if(PlayPauseButton.handleClick(x, y))
			return;

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

	function resizeCanvas() {
		computeGameDimensions();

		canvas.width = Math.floor(GAME_WIDTH);
		canvas.height = Math.floor(GAME_HEIGHT);
		canvas.style.left = Math.floor(H_OFFSET) + "px";
		canvas.style.top = Math.floor(V_OFFSET) + "px";

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

	var      canvas = document.getElementById(canvasID),
	      container = canvas.parentNode,
	    startScreen = document.getElementById('startScreen'),
	    pauseScreen = document.getElementById('pauseScreen'),
	 gameoverScreen = document.getElementById('gameoverScreen'),
	  licenseScreen = document.getElementById('licenseScreen');

	document.getElementById('startScreenPlayButton').addEventListener('click', function(evt) {
		evt.preventDefault();
		game.resume();
		that.state = that.GAME;
		window.requestAnimationFrame(step);
		setScreenVisible(startScreen, -1);
	});

	document.getElementById('pauseScreenContinueButton').addEventListener('click', function(evt) {
		evt.preventDefault();
		game.resume();
		window.requestAnimationFrame(step);
		setScreenVisible(pauseScreen, -1);
	});

	document.getElementById('gameoverScreenPlayAgainButton').addEventListener('click', function(evt) {
		evt.preventDefault();
		game.reset();
		window.requestAnimationFrame(step);
		setScreenVisible(gameoverScreen, -1);
	});

	document.getElementById('startScreenLicenseButton').addEventListener('click', function(evt) {
		evt.preventDefault();
		setScreenVisible(licenseScreen, 2);
	});

	document.getElementById('licenseScreenBackButton').addEventListener('click', function(evt) {
		evt.preventDefault();
		setScreenVisible(licenseScreen, -1);
	});

	var ctx = canvas.getContext('2d');

	var SCALE, GAME_WIDTH, GAME_HEIGHT, V_OFFSET, H_OFFSET,
	    BOTTOM_BORDER, TOP_BORDER, LEFT_BORDER, RIGHT_BORDER,
	    CANNON_BASE_WIDTH, CANNON_BASE_HEIGHT, CANNON_LENGTH, CANNON_WIDTH;

	var lastClickDate = 0;

	var that = this; // Allow to access this from the closure.

	window.addEventListener('resize', resizeCanvas, false);
	[canvas, container].forEach(function(e) {
		e.addEventListener('mousedown', handleClick, false);
		e.addEventListener('touchstart', handleTouch, false);
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
