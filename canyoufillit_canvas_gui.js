"use strict";
function CanYouFillItCanvasGui(game, canvasID) {
	var PlayPauseButton = {
		draw: function() {
			ctx.fillStyle = 'white';
			if(game.state == game.RUNNING()) {
				ctx.fillRect(canvas.width - Math.floor(SCALE / 6 * 0.9),
				             Math.floor(SCALE / 6 * 0.1),
				             Math.floor(SCALE / 6 * 0.3),
				             Math.floor(SCALE / 6 * 0.8));
				ctx.fillRect(canvas.width - Math.floor(SCALE / 6 * 0.4),
				             Math.floor(SCALE / 6 * 0.1),
				             Math.floor(SCALE / 6 * 0.3),
				             Math.floor(SCALE / 6 * 0.8));
			}
		},
		handleClick: function(x, y) {
			if((x > canvas.width - Math.floor(SCALE / 6)) && (y < Math.floor(SCALE / 6))) {
				if(game.state == game.RUNNING()) {
					game.pause();
					setScreenVisible(pauseScreen, 1);
				}

				return true;
			}

			return false;
		}
	};

	function drawCannon(cannon) {
		var r = Math.round(CANNON_BASE_WIDTH / 2);

		ctx.fillStyle = 'white';
		ctx.beginPath();
		ctx.moveTo(Math.round(H_OFFSET + SCALE / 2) - r,
		           Math.round(BOTTOM_BORDER + SCALE / 6));
		ctx.lineTo(Math.round(H_OFFSET + SCALE / 2) - r,
		           Math.round(BOTTOM_BORDER + SCALE / 6 - CANNON_BASE_HEIGHT));
		ctx.arc(
		    Math.round(H_OFFSET + SCALE / 2),
		    Math.round(BOTTOM_BORDER + SCALE / 6 - CANNON_BASE_HEIGHT),
		    r,
		    Math.PI,
		    0);
		ctx.lineTo(Math.round(H_OFFSET + SCALE / 2) + r,
		           Math.round(BOTTOM_BORDER + SCALE / 6));
		ctx.closePath();
		ctx.fill();

		ctx.lineWidth = CANNON_WIDTH;
		ctx.lineCap = 'butt';
		ctx.beginPath();
		ctx.moveTo(H_OFFSET + SCALE / 2,
		           BOTTOM_BORDER + SCALE / 6 - CANNON_BASE_HEIGHT);
		ctx.lineTo(H_OFFSET + SCALE / 2 + Math.cos(game.cannon.getAngle()) * CANNON_LENGTH,
		           BOTTOM_BORDER + SCALE / 6 - CANNON_BASE_HEIGHT - Math.sin(game.cannon.getAngle()) * CANNON_LENGTH);
		ctx.stroke();
		ctx.closePath();
	};

	function drawBall(ball) {
		var x = LEFT_BORDER + ball.nx * SCALE,
		    y = BOTTOM_BORDER - ball.ny * SCALE,
		    r = ball.nr * SCALE;

		ctx.fillStyle = 'white';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI*2, false);

		if(ball.counter == 1) {
			ctx.moveTo(x - r * 0.2, y - r * 0.7);
			ctx.lineTo(x - r * 0.2, y + r * 0.7);
			ctx.lineTo(x + r * 0.2, y + r * 0.7);
			ctx.lineTo(x + r * 0.2, y - r * 0.7);
		} else if(ball.counter == 2) {
			ctx.moveTo(x - r * 0.5, y - r * 0.7);
			ctx.lineTo(x - r * 0.5, y - r * 0.3);
			ctx.lineTo(x + r * 0.1, y - r * 0.3);
			ctx.lineTo(x + r * 0.1, y - r * 0.15);
			ctx.lineTo(x - r * 0.5, y - r * 0.15);
			ctx.lineTo(x - r * 0.5, y + r * 0.7);
			ctx.lineTo(x + r * 0.5, y + r * 0.7);
			ctx.lineTo(x + r * 0.5, y + r * 0.3);
			ctx.lineTo(x - r * 0.1, y + r * 0.3);
			ctx.lineTo(x - r * 0.1, y + r * 0.15);
			ctx.lineTo(x + r * 0.5, y + r * 0.15);
			ctx.lineTo(x + r * 0.5, y - r * 0.7);
		} else if(ball.counter == 3) {
			ctx.moveTo(x - r * 0.5, y - r * 0.7);
			ctx.lineTo(x - r * 0.5, y - r * 0.3);
			ctx.lineTo(x + r * 0.1, y - r * 0.3);
			ctx.lineTo(x + r * 0.1, y - r * 0.15);
			ctx.lineTo(x - r * 0.5, y - r * 0.15);
			ctx.lineTo(x - r * 0.5, y + r * 0.15);
			ctx.lineTo(x + r * 0.1, y + r * 0.15);
			ctx.lineTo(x + r * 0.1, y + r * 0.3);
			ctx.lineTo(x - r * 0.5, y + r * 0.3);
			ctx.lineTo(x - r * 0.5, y + r * 0.7);
			ctx.lineTo(x + r * 0.5, y + r * 0.7);
			ctx.lineTo(x + r * 0.5, y - r * 0.7);
		}
		ctx.closePath();
		ctx.fill();
	}

	function drawGame() {
		// Always add 0.5 to coordinates of lines of width 1
		// https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Canvas_tutorial/Applying_styles_and_colors#A_lineWidth_example
		ctx.strokeStyle = 'white';
		ctx.lineWidth = '1';
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
		// clearRect doesn't work on android stock browser, fillRect is used instead
		// ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

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
			game.pause();
		}
	}

	function resizeCanvas() {
		canvas.width = container.clientWidth;
		canvas.height = container.clientHeight;

		computeGameDimensions();

		// Redraw event when the game is not running
		if(game.state != game.RUNNING())
			window.requestAnimationFrame(step);
	}

	function computeGameDimensions() {
		var w = canvas.width, h = canvas.height;

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
		TOP_BORDER         = V_OFFSET + SCALE / 6;
		BOTTOM_BORDER      = TOP_BORDER + SCALE;
		LEFT_BORDER        = H_OFFSET;
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
	canvas.addEventListener('mousedown', handleClick, false);
	canvas.addEventListener('touchstart', handleTouch, false);

	document.addEventListener('visibilitychange', handleVisibilityChange, false);

	resizeCanvas();

	window.requestAnimationFrame(step);
}

CanYouFillItCanvasGui.prototype.addObserver = function(o) {
	this.observable.addObserver(o);
};

CanYouFillItCanvasGui.prototype.removeObserver = function(o) {
	this.observable.removeObserver(o);
};

CanYouFillItCanvasGui.prototype.notifyObservers = function(o) {
	this.observable.notifyObservers();
};
