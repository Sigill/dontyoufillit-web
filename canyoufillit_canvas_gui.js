"use strict";
function CanYouFillItCanvasGui(game, containerID) {
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
					pauseMenu.style.zIndex = 1;
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
			gameoverMenu.style.zIndex = 1;
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

	function makeMenu() {
		var m = container.appendChild(document.createElement('div'));
		m.style.position = 'absolute';
		m.style.top = '0';
		m.style.left = '0';
		m.style.bottom = '0';
		m.style.right = '0';
		m.style.overflowX = 'hidden';
		m.style.overflowY = 'auto';
		m.style.backgroundColor = 'black';
		m.style.color = 'white';
		m.style.zIndex = -1;
		m.style.textAlign = 'center';
		m.style.fontFamily = 'Arial';
		m.style.cursor = 'default';

		return m;
	}

	this.MENU = 1;
	this.GAME = 2;

	this.state = this.MENU;

	this.game = game;
	this.observable = new Observable();

	var container = document.getElementById(containerID),
	       canvas = container.appendChild(document.createElement('canvas')),
	         startMenu = makeMenu(),
	         pauseMenu = makeMenu(),
	      gameoverMenu = makeMenu();

	{
		startMenu.style.zIndex = 1;

		var t = startMenu.appendChild(document.createElement('p'));
		t.style.marginTop = '1em';
		t.style.fontSize = '3.5em';
		t.style.fontWeight = 'bold';
		t.innerHTML = 'CanYouFillIt';

		var pb = startMenu.appendChild(document.createElement('p'));
		pb.style.backgroundColor = 'white';
		pb.style.color = 'black';
		pb.style.borderRadius = '0.25em';
		pb.style.width = '5ex';
		pb.style.margin = '2em auto 0 auto';
		pb.style.padding = '0.25em';
		pb.style.fontSize = '3em';
		pb.style.fontWeight = 'bold';
		pb.style.cursor = 'pointer';
		pb.innerHTML = 'Play';

		pb.addEventListener('click', function(evt) {
			evt.preventDefault();
			game.resume();
			that.state = that.GAME;
			window.requestAnimationFrame(step);
			startMenu.style.zIndex = -1;
		});

		var c1 = startMenu.appendChild(document.createElement('p'));
		c1.innerHTML = 'Developped by Cyrille Faucheux';
		c1.style.fontSize = '1.5em';
		c1.style.marginTop = '4em';

		var c2 = startMenu.appendChild(document.createElement('p'));
		c2.innerHTML = 'Freely inspired by gimmefrictionbaby.com';
		c2.style.fontSize = '1.5em';
		c2.style.marginTop = '1.5em';
	}

	{
		pauseMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';

		var t = pauseMenu.appendChild(document.createElement('p'));
		t.style.marginTop = '1em';
		t.style.fontSize = '3.5em';
		t.style.fontWeight = 'bold';
		t.innerHTML = 'Game paused';

		var pb = pauseMenu.appendChild(document.createElement('p'));
		pb.style.backgroundColor = 'white';
		pb.style.color = 'black';
		pb.style.borderRadius = '0.25em';
		pb.style.width = '8ex';
		pb.style.margin = '1.5em auto 0 auto';
		pb.style.padding = '0.25em';
		pb.style.fontSize = '3em';
		pb.style.fontWeight = 'bold';
		pb.style.cursor = 'pointer';
		pb.innerHTML = 'Continue';

		pb.addEventListener('click', function(evt) {
			evt.preventDefault();
			game.resume();
			window.requestAnimationFrame(step);
			pauseMenu.style.zIndex = -1;
		});
	}

	// TODO Display score
	{
		var t = gameoverMenu.appendChild(document.createElement('p'));
		t.style.marginTop = '1em';
		t.style.fontSize = '3.5em';
		t.style.fontWeight = 'bold';
		t.innerHTML = 'Game Over';

		var pb = gameoverMenu.appendChild(document.createElement('p'));
		pb.style.backgroundColor = 'white';
		pb.style.color = 'black';
		pb.style.borderRadius = '0.25em';
		pb.style.width = '10ex';
		pb.style.margin = '1.5em auto 0 auto';
		pb.style.padding = '0.25em';
		pb.style.fontSize = '3em';
		pb.style.fontWeight = 'bold';
		pb.style.cursor = 'pointer';
		pb.innerHTML = 'Play again';

		pb.addEventListener('click', function(evt) {
			evt.preventDefault();
			game.reset();
			window.requestAnimationFrame(step);
			gameoverMenu.style.zIndex = -1;
		});
	}

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
