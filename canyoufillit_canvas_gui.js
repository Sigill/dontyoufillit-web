function CanYouFillItCanvasGui(game, containerID) {
	PlayPauseButton = {
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
			} else if(game.state == game.PAUSED()) {
				ctx.beginPath();
				ctx.moveTo(canvas.width - Math.floor(SCALE / 6 * 0.9), Math.floor(SCALE / 6 * 0.1));
				ctx.lineTo(canvas.width - Math.floor(SCALE / 6 * 0.9), Math.floor(SCALE / 6 * 0.9));
				ctx.lineTo(canvas.width - 10, Math.floor(SCALE / 12));
				ctx.closePath();
				ctx.fill();
			}
		},
		handleClick: function(x, y) {
			if((x > canvas.width - Math.floor(SCALE / 6)) && (y < Math.floor(SCALE / 6))) {
				if(game.state == game.RUNNING()) {
					game.pause();
				} else if(game.state == game.PAUSED()) {
					game.resume();
					window.requestAnimationFrame(step);
				}

				return true;
			}

			return false;
		}
	};

	// TODO Background on button
	MenuScreen = {
		draw: function() {
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = 'white';

			ctx.font = Math.floor(SCALE / 8) + 'px Arial';
			ctx.fillText('CanYouFillIt', LEFT_BORDER + SCALE / 2, TOP_BORDER + SCALE / 3);

			ctx.font = Math.floor(SCALE / 10) + 'px Arial';
			ctx.fillText('Play now', LEFT_BORDER + SCALE / 2, TOP_BORDER + 2 * SCALE / 3);
		},
		handleClick: function(x, y) {
			var s = ctx.measureText('Play now').width;
			if(x >= LEFT_BORDER + (SCALE - s) / 2 &&
			   x <= LEFT_BORDER + (SCALE + s) / 2 &&
			   y >= TOP_BORDER + (2 * SCALE) / 3 - Math.floor(SCALE / 10) / 2 &&
			   y <= TOP_BORDER + (2 * SCALE) / 3 + Math.floor(SCALE / 10) / 2) {
				game.resume();
				that.state = that.GAME;
				window.requestAnimationFrame(step);
				return true;
			}
			return false;
		}
	};

	// TODO Add "Menu" button
	// TODO Background on button
	GameOverScreen = {
		draw: function() {
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = 'white';

			ctx.font = Math.floor(SCALE / 8) + 'px Arial';
			ctx.fillText('Game Over', LEFT_BORDER + SCALE / 2, TOP_BORDER + SCALE / 3);

			ctx.font = Math.floor(SCALE / 10) + 'px Arial';
			ctx.fillText('Play again', LEFT_BORDER + SCALE / 2, TOP_BORDER + 2 * SCALE / 3);
		},
		handleClick: function(x, y) {
			var s = ctx.measureText('Play again').width;
			if(x >= LEFT_BORDER + (SCALE - s) / 2 &&
			   x <= LEFT_BORDER + (SCALE + s) / 2 &&
			   y >= TOP_BORDER + (2 * SCALE) / 3 - Math.floor(SCALE / 10) / 2 &&
			   y <= TOP_BORDER + (2 * SCALE) / 3 + Math.floor(SCALE / 10) / 2) {
				game.reset();
				window.requestAnimationFrame(step);
				return true;
			}

			return false;
		}
	};

	// TODO Add "Menu" button
	PauseScreen = {
		draw: function() {
			ctx.font = Math.floor(SCALE / 8) + 'px Arial';
			var s = ctx.measureText('Pause').width,
			    o = 0.2 * SCALE / 8;
			ctx.fillStyle = 'black';
			ctx.fillRect(Math.floor((canvas.width - s - o) / 2),
			             Math.floor((canvas.height - Math.floor(SCALE / 12) - o) / 2),
			             Math.ceil(s + o),
			             Math.ceil(Math.floor(SCALE / 12) + o));

			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = 'white';
			ctx.fillText('Pause', canvas.width / 2, canvas.height / 2);
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
		ctx.moveTo(Math.floor(LEFT_BORDER) + 0.5, Math.floor(TOP_BORDER) + 0.5);
		ctx.lineTo(Math.floor(RIGHT_BORDER) - 0.5, Math.floor(TOP_BORDER) + 0.5);
		ctx.lineTo(Math.floor(RIGHT_BORDER) - 0.5, Math.floor(BOTTOM_BORDER) + 0.5);
		ctx.lineTo(Math.floor(LEFT_BORDER) + 0.5, Math.floor(BOTTOM_BORDER) + 0.5);
		ctx.closePath();
		ctx.stroke();

		drawCannon(game.cannon);

		for(var i = 0; i < game.staticBalls.length; ++i)
			drawBall(game.staticBalls[i]);

		if(game.currentBall)
			drawBall(game.currentBall);

		PlayPauseButton.draw();

		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		ctx.font = Math.floor(SCALE / 12) + 'px Arial';
		ctx.fillText('Highscore', LEFT_BORDER, V_OFFSET + SCALE / 120);
		ctx.fillText('Score', LEFT_BORDER, V_OFFSET + SCALE / 12);

		var scoreOffset = ctx.measureText('Highscore ').width;
		ctx.fillText(game.highscore, LEFT_BORDER + scoreOffset, V_OFFSET + SCALE / 120);
		ctx.fillText(game.score, LEFT_BORDER + scoreOffset, V_OFFSET + SCALE / 12);
	}

	function draw() {
		// clearRect doesn't work on android stock browser, fillRect is used instead
		// ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		if(that.state == that.MENU) {
			MenuScreen.draw();
		} else {
			if(game.state == game.GAMEOVER()) {
				GameOverScreen.draw();
			} else {
				drawGame();
				if(game.state == game.PAUSED()) {
					PauseScreen.draw();
				}
			}
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

		if(that.state == that.MENU) {
			MenuScreen.handleClick(x, y);
			return;
		}

		if(game.state == game.GAMEOVER()) {
			if(GameOverScreen.handleClick(x, y))
				return;
		}

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

	this.MENU = 1;
	this.GAME = 2;

	this.state = this.MENU;

	this.game = game;
	this.observable = new Observable();

	var container = document.getElementById(containerID),
	       canvas = container.appendChild(document.createElement('canvas'));//,
	//         menu = container.appendChild(document.createElement('div'));

	var ctx = canvas.getContext('2d');

	var SCALE, GAME_WIDTH, GAME_HEIGHT, V_OFFSET, H_OFFSET,
	    BOTTOM_BORDER, TOP_BORDER, LEFT_BORDER, RIGHT_BORDER,
	    CANNON_BASE_WIDTH, CANNON_BASE_HEIGHT, CANNON_LENGTH, CANNON_WIDTH;

	var lastClickDate = 0;

	var that = this; // Allow to access this from the closure.

	canvas.style.display = 'block';
	canvas.style.background = 'black';
	// https://bugzilla.mozilla.org/show_bug.cgi?id=430906
	canvas.setAttribute('moz-opaque', 'moz-opaque');

	window.addEventListener('resize', resizeCanvas, false);
	canvas.addEventListener('mousedown', handleClick, false);
	canvas.addEventListener('touchstart', handleTouch, false);

	document.addEventListener('visibilitychange', handleVisibilityChange, false);

	resizeCanvas();
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
