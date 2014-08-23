var stats = new Stats();
stats.setMode(0); // 0: fps, 1: ms
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';
document.body.appendChild( stats.domElement );

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign#Polyfill
if(!Math.sign) {
	Math.__proto__.sign = function(x) {
		if(isNaN(x)) {
			return NaN;
		} else if(x === 0) {
			return x;
		} else {
			return (x > 0 ? 1 : -1);
		}
	}
}

function vectorLength(x, y) {
	return Math.sqrt(x * x + y * y);
}

function RK41DObject_State(u, s) {
	this.u = u;
	this.s = s;
}

function RK41DObject_Derivative(du, ds) {
	this.du = du;
	this.ds = ds;
}

function RK41DObject() {
	this.state = new RK41DObject_State(0, 0);
}

RK41DObject.prototype.evaluate = function(initialState, t, dt, derivative) {
	if(typeof dt == 'undefined') {
		return new RK41DObject_Derivative(initialState.s, this.acceleration(initialState, t));
	} else {
		var state = new RK41DObject_State(initialState.u + derivative.du * dt,
							  initialState.s + derivative.ds * dt);

		return new RK41DObject_Derivative(state.s, this.acceleration(state, t + dt));
	}
};

RK41DObject.prototype.integrate = function(t, dt) {
	var a = this.evaluate(this.state, t),
	    b = this.evaluate(this.state, t, dt * 0.5, a),
	    c = this.evaluate(this.state, t, dt * 0.5, b),
	    d = this.evaluate(this.state, t, dt, c);

	var dxdt = 1/6 * (a.du + 2 * (b.du + c.du) + d.du),
	    dvdt = 1/6 * (a.ds + 2 * (b.ds + c.ds) + d.ds);

	this.state.u = this.state.u + dxdt * dt;
	this.state.s = this.state.s + dvdt * dt;
};

// TODO Improve this
function normalizeRadian(a) {
	while(a > 2 * Math.PI) {
		a -= 2 * Math.PI;
	}

	while(a < 0) {
		a += 2 * Math.PI;
	}

	return a;
}


function CanYouFillItGame(canvasID) {
	function Cannon() {
		RK41DObject.call(this);
		this.state.u = 0;
		this.state.s = Math.PI / 3;
	}

	Cannon.prototype = new RK41DObject();
	Cannon.prototype.constructor = RK41DObject;

	Cannon.prototype.acceleration = function(state, t) {
		return 0;
	};

	Cannon.prototype.getAngle = function() {
		return this.state.u + Math.PI / 2;
	};

	Cannon.prototype.update = function(t, dt) {
		this.integrate(t, dt);

		if(Math.abs(this.state.u) >= Math.PI / 2) {
			this.state.u = ((Math.PI / 2) - Math.abs(Math.PI / 2 - Math.abs(this.state.u))) * Math.sign(this.state.u);
			this.state.s *= -1;
		}
	};

	Cannon.prototype.draw = function() {
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
				0
			);
		ctx.lineTo(Math.round(H_OFFSET + SCALE / 2) + r,
		           Math.round(BOTTOM_BORDER + SCALE / 6));
		ctx.closePath();
		ctx.fill();

		ctx.lineWidth = CANNON_WIDTH;
		ctx.lineCap = 'butt';
		ctx.beginPath();
		ctx.moveTo(H_OFFSET + SCALE / 2,
				   BOTTOM_BORDER + SCALE / 6 - CANNON_BASE_HEIGHT);
		ctx.lineTo(H_OFFSET + SCALE / 2 + Math.cos(this.getAngle()) * CANNON_LENGTH,
				   BOTTOM_BORDER + SCALE / 6 - CANNON_BASE_HEIGHT - Math.sin(this.getAngle()) * CANNON_LENGTH);
		ctx.stroke();
		ctx.closePath();
	};

	function Ball(r, x, y, a) {
		RK41DObject.call(this);
		this.nr = r; // Normalized radius and coordinates
		this.nx = x;
		this.ny = y;

		this.direction = a;
		this.state.u = 0;
		this.state.s = 1;

		this.counter = 3;
	}

	Ball.prototype = new RK41DObject();
	Ball.prototype.constructor = RK41DObject;

	Ball.prototype.draw = function() {
		var x = LEFT_BORDER + this.nx * SCALE,
		    y = BOTTOM_BORDER - this.ny * SCALE,
		    r = this.nr * SCALE;

		ctx.fillStyle = 'white';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI*2, false);

		if(this.counter == 1) {
			ctx.moveTo(x - r * 0.2, y - r * 0.7);
			ctx.lineTo(x - r * 0.2, y + r * 0.7);
			ctx.lineTo(x + r * 0.2, y + r * 0.7);
			ctx.lineTo(x + r * 0.2, y - r * 0.7);
		} else if(this.counter == 2) {
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
		} else if(this.counter == 3) {
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
	};

	Ball.prototype.acceleration = function(state, t) {
		return -0.4;
	};

	Ball.prototype.update = function(t, dt) {
		var previousStateU = this.state.u;

		this.integrate(t, dt);

		var d = this.state.u - previousStateU;
		this.nx += d * Math.cos(this.direction);
		this.ny += d * Math.sin(this.direction);

		this.bounce();
	};

	Ball.prototype.bounce = function() {
		if (this.nx > 1 - this.nr) {
			this.nx = 1 - this.nr;
			this.direction = normalizeRadian(Math.PI - this.direction);
		} else if (this.nx < this.nr) {
			this.nx = this.nr;
			this.direction = normalizeRadian(Math.PI - this.direction);
		} 

		if (this.ny > 1 - this.nr) {
			this.ny = 1 - this.nr;
			this.direction = normalizeRadian(-this.direction);
		}

		for(var i = staticBalls.length - 1; i >= 0; --i) {
			var o = staticBalls[i];

			var normalX = this.nx - o.nx,
			    normalY = this.ny - o.ny;
			if(vectorLength(normalX, normalY) <= o.nr + this.nr) {
				--o.counter;

				var alpha = Math.atan2(normalY, normalX),
				     sine = Math.sin(alpha),
				   cosine = Math.cos(alpha);

				var velocityX = Math.cos(this.direction),
				    velocityY = Math.sin(this.direction);

				var vFinalX = -(cosine * velocityX + sine * velocityY),
				    vFinalY = cosine * velocityY - sine * velocityX;

				var bTempX = cosine * normalX + sine * normalY,
				    bTempY = cosine * normalY - sine * normalX;

				bTempX += vFinalX / SCALE;
				bTempY += vFinalY / SCALE;

				var bFinalX = cosine * bTempX - sine * bTempY,
				    bFinalY = cosine * bTempY + sine * bTempX;

				this.nx = o.nx + bFinalX;
				this.ny = o.ny + bFinalY;

				velocityX = cosine * vFinalX - sine * vFinalY;
				velocityY = cosine * vFinalY + sine * vFinalX;

				this.direction = Math.atan2(velocityY, velocityX);

				if(o.counter == 0) {
					++score;
					staticBalls.splice(i, 1);
				}
			}
		}
	};

	Ball.prototype.grow = function() {
		var minRadius = Number.MAX_VALUE,
		    available,
		    o;

		for(var i = 0; i < staticBalls.length; ++i) {
			o = staticBalls[i];
			available = vectorLength(this.nx - o.nx, this.ny - o.ny) - o.nr;
			if(minRadius > available) minRadius = available;
		}

		available = this.nx;
		if(minRadius > available) minRadius = available;

		available = 1 - this.nx;
		if(minRadius > available) minRadius = available;

		available = Math.abs(this.ny);
		if(minRadius > available) minRadius = available;

		available = Math.abs(1 - this.ny);
		if(minRadius > available) minRadius = available;

		this.nr = Math.abs(minRadius);
	};

	function initialize() {
		highscore = localStorage.getItem('highscore');
		highscore = (highscore == null) ? 0 : parseInt(highscore, 10);

		window.addEventListener('resize', resizeCanvas, false);
		resizeCanvas();
		canvas.addEventListener('mousedown', handleClick, false);
		canvas.addEventListener('touchstart', handleTouch, false);

		document.addEventListener('visibilitychange', handleVisibilityChange, false);
		window.requestAnimationFrame(step);
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
		if(Date.now() - lastClickDate < 1000)
			return;

		lastClickDate = Date.now();

		if(gameState == GAMEOVER) {
			currentBall = null;
			staticBalls = [];
			gameState = RUNNING;
			score = 0;
			return false;
		}

		var rect = canvas.getBoundingClientRect();
		var x = evx - rect.left,
		    y = evy - rect.top;

		// TODO Size and position of the button
		if((x > canvas.width - 60) && (y < 60)) {
			if(gameState == RUNNING ) {
				gameState = PAUSED;
			} else if(gameState == PAUSED) {
				gameState = RUNNING;
				lastFrameTime = performance.now ? performance.now() : Date.now();
			}

			return false;
		}

		if((currentBall == null) && (gameState == RUNNING)) {
			currentBall = new Ball(
				1 / 40,
				0.5 + Math.cos(cannon.getAngle()) * CANNON_LENGTH / SCALE,
				-1 / 6 + CANNON_BASE_HEIGHT / SCALE + Math.sin(cannon.getAngle()) * CANNON_LENGTH / SCALE,
				cannon.getAngle());
			return false;
		}

		return false;
	}

	function handleVisibilityChange() {
		if (document.hidden) {
			gameState = PAUSED;
		}
	}

	function step(time) {
		stats.begin();

		if(gameState == RUNNING)
			update(time);

		draw();

		stats.end();

		if(gameState == RUNNING) {
			window.requestAnimationFrame(step);
		} else {
			setTimeout(function() { window.requestAnimationFrame(step); }, 250);
		}
	}

	function update(time) {
		if(currentBall) {
			var last = lastFrameTime, current;
			for(var i = 1; i <= 10; ++i) {
				current = (lastFrameTime* (10-i) + time * i) / 10;
				currentBall.update(last / 1000, (current - last) / 1000);
				if(currentBall.ny < currentBall.nr && normalizeRadian(currentBall.direction) > Math.PI) {
					currentBall.state.s = 0;
					if(score > highscore) {
						highscore = score;
						localStorage.setItem('highscore', (score).toString(10));
					}
					gameState = GAMEOVER;
				}
				if(currentBall.state.s < 0.001) {
					if(currentBall.ny >= 0) {
						currentBall.grow();
						staticBalls.push(currentBall);
					}
					currentBall = null;
					break;
				}
				last = current;
			}
		}

		cannon.update(lastFrameTime / 1000, (time - lastFrameTime) / 1000);

		lastFrameTime = time;
	}

	function draw() {
		// clearRect doesn't work on android stock browser, fillRect is used instead
		// ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		if(gameState == GAMEOVER) {
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = 'white';
			ctx.font = Math.floor(SCALE / 8) + 'px Arial';
			ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);

			return;
		}

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

		cannon.draw();

		for(var i = 0; i < staticBalls.length; ++i)
			staticBalls[i].draw();

		if(currentBall)
			currentBall.draw();

		ctx.fillStyle = 'white';
		if(gameState == RUNNING) {
			ctx.fillRect(canvas.width - 40, 10, 10, 40);
			ctx.fillRect(canvas.width - 20, 10, 10, 40);
		} else if(gameState == PAUSED) {
			ctx.beginPath();
			ctx.moveTo(canvas.width - 40, 10);
			ctx.lineTo(canvas.width - 40, 40);
			ctx.lineTo(canvas.width - 10, 25);
			ctx.closePath();
			ctx.fill();
		}

		var scoreOffset = ctx.measureText('Highscore ').width;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		ctx.font = Math.floor(SCALE / 12) + 'px Arial';
		ctx.fillText('Highscore', LEFT_BORDER, V_OFFSET + SCALE / 120);
		ctx.fillText('Score', LEFT_BORDER, V_OFFSET + SCALE / 12);
		ctx.fillText(highscore, LEFT_BORDER + scoreOffset, V_OFFSET + SCALE / 120);
		ctx.fillText(score, LEFT_BORDER + scoreOffset, V_OFFSET + SCALE / 12);

		if(gameState == PAUSED) {
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
	}

	function resizeCanvas() {
		canvas.width = container.clientWidth;
		canvas.height = container.clientHeight;

		computeGameDimensions();
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

	var canvas = document.getElementById(canvasID),
	    ctx = canvas.getContext('2d'),
	    container = canvas.parentNode;

	var SCALE, GAME_WIDTH, GAME_HEIGHT, V_OFFSET, H_OFFSET,
	    BOTTOM_BORDER, TOP_BORDER, LEFT_BORDER, RIGHT_BORDER,
	    CANNON_BASE_WIDTH, CANNON_BASE_HEIGHT, CANNON_LENGTH, CANNON_WIDTH;

	const PAUSED = 1, RUNNING = 2, GAMEOVER = 3;

	// Browsers supporting high resolution timestamps will use them in requestAnimationFrame
	var lastFrameTime = performance.now ? performance.now() : Date.now();
	var staticBalls = [];
	var currentBall = null;

	var cannon = new Cannon();
	var lastClickDate = 0;
	var gameState = RUNNING;
	var score = 0;
	var highscore;

	canvas.style.display = 'block';
	canvas.style.background = 'black';

	initialize();
}

