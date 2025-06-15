function vectorLength(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

interface RK41DObject_State {
  u: number;
  s: number;
}

interface RK41DObject_Derivative {
  du: number;
  ds: number;
}

abstract class RK41DObject {
  state: RK41DObject_State = { u: 0, s: 0 };

  abstract acceleration(state: RK41DObject_State, t: number): number;

  evaluate(initialState: RK41DObject_State, t: number, dt: number, derivative: RK41DObject_Derivative): RK41DObject_Derivative {
    const state: RK41DObject_State = {
      u: initialState.u + derivative.du * dt,
      s: initialState.s + derivative.ds * dt,
    };

    return {
      du: state.s,
      ds: this.acceleration(state, t + dt),
    };
  }

  integrate(t: number, dt: number): void {
    const a = this.evaluate(this.state, t, 0, {du: 0, ds: 0});
    const b = this.evaluate(this.state, t, dt * 0.5, a);
    const c = this.evaluate(this.state, t, dt * 0.5, b);
    const d = this.evaluate(this.state, t, dt, c);

    const dxdt = 1 / 6 * (a.du + 2 * (b.du + c.du) + d.du);
    const dvdt = 1 / 6 * (a.ds + 2 * (b.ds + c.ds) + d.ds);

    this.state.u = this.state.u + dxdt * dt;
    this.state.s = this.state.s + dvdt * dt;
  }
}

// TODO Improve this
function normalizeRadian(a: number) {
  while(a > 2 * Math.PI) {
    a -= 2 * Math.PI;
  }

  while(a < 0) {
    a += 2 * Math.PI;
  }

  return a;
}

class Cannon extends RK41DObject {
  constructor() {
    super();
    this.state.u = 0;
    this.state.s = Math.PI / 3;
  }

  acceleration(): number {
    return 0;
  }

  getAngle(): number {
    return this.state.u + Math.PI / 2;
  }

  update(t: number, dt: number) {
    this.integrate(t, dt);

    if (Math.abs(this.state.u) >= Math.PI / 2) {
      this.state.u = ((Math.PI / 2) - Math.abs(Math.PI / 2 - Math.abs(this.state.u))) * Math.sign(this.state.u);
      this.state.s *= -1;
    }
  }
}

export class Ball extends RK41DObject {
  nr: number;
  nx: number;
  ny: number;
  direction: number;
  counter: number;

  constructor(r: number, x: number, y: number, a: number) {
    super();

    this.nr = r; // Normalized radius and coordinates
    this.nx = x;
    this.ny = y;

    this.direction = a;
    this.state.u = 0;
    this.state.s = 1;

    this.counter = 3;
  }

  acceleration(state: RK41DObject_State, t: number) {
    return -0.4;
  }

  update(t: number, dt: number, staticBalls: Array<Ball>) {
    const previousStateU = this.state.u;

    this.integrate(t, dt);

    var d = this.state.u - previousStateU;
    this.nx += d * Math.cos(this.direction);
    this.ny += d * Math.sin(this.direction);

    this.bounce(staticBalls);
  }

  bounce(staticBalls: Array<Ball>) {
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

    for (var i = 0; i < staticBalls.length; ++i) {
      var o = staticBalls[i];

      var normalX = this.nx - o.nx, normalY = this.ny - o.ny, dist = vectorLength(normalX, normalY);

      if (dist <= o.nr + this.nr) {
        --o.counter;

        // Move it back to prevent clipping
        this.nx = o.nx + normalX * (this.nr + o.nr) / dist;
        this.ny = o.ny + normalY * (this.nr + o.nr) / dist;

        // http://en.wikipedia.org/wiki/Elastic_collision#Two-Dimensional_Collision_With_Two_Moving_Objects
        // Assuming no speed and an infinite mass for the second ball.
        var phi = Math.atan2(normalY, normalX), theta = this.direction, speed = this.state.s;

        var velocityX = -speed * Math.cos(theta - phi) * Math.cos(phi) + speed * Math.sin(theta - phi) * Math.cos(phi + Math.PI / 2), velocityY = -speed * Math.cos(theta - phi) * Math.sin(phi) + speed * Math.sin(theta - phi) * Math.sin(phi + Math.PI / 2);

        // Linear speed doesn't change, only the direction.
        this.direction = Math.atan2(velocityY, velocityX);
      }
    }
  }

  grow(staticBalls: Array<Ball>) {
    var minRadius = Number.MAX_VALUE, available, o;

    for (var i = 0; i < staticBalls.length; ++i) {
      o = staticBalls[i];
      available = vectorLength(this.nx - o.nx, this.ny - o.ny) - o.nr;
      if (minRadius > available) minRadius = available;
    }

    available = this.nx;
    if (minRadius > available) minRadius = available;

    available = 1 - this.nx;
    if (minRadius > available) minRadius = available;

    available = Math.abs(this.ny);
    if (minRadius > available) minRadius = available;

    available = Math.abs(1 - this.ny);
    if (minRadius > available) minRadius = available;

    this.nr = Math.abs(minRadius);
  }
}

export class DontYouFillItGame {
  state: number;
  cannon: Cannon;
  staticBalls: Array<Ball>;
  currentBall: Ball | null;
  lastUpdateTime: number;
  score: number;

  DEFAULT_BALL_RADIUS: number;
  CANNON_Y_POSITION: number;
  CANNON_BASE_HEIGHT: number;
  CANNON_LENGTH: number;

  constructor() {
    this.state = DontYouFillItGame.PAUSED;
    this.cannon = new Cannon();
    this.staticBalls = [];
    this.currentBall = null;

    // Browsers supporting high resolution timestamps will use them in requestAnimationFrame
    this.lastUpdateTime = performance.now ? performance.now() : Date.now();

    this.score = 0;

    this.DEFAULT_BALL_RADIUS = 1 / 40.0;
    this.CANNON_Y_POSITION = -1 / 6.0;
    this.CANNON_BASE_HEIGHT = 1 / 15.0;
    this.CANNON_LENGTH = 1 / 15.0;
  }

  static PAUSED = 1;
  static RUNNING = 2;
  static GAMEOVER = 3;

  /*
   * Position of the current ball is important, so it will be calculated 1000 times per second.
   * Position of the cannon isn't, so it will be calculated only once every frame.
   */
  update(time: number) {
    if (this.currentBall) {
      var last = this.lastUpdateTime, steps = Math.floor(time - this.lastUpdateTime), current;
      for (var i = 1; i <= steps; ++i) {
        current = (this.lastUpdateTime * (steps - i) + time * i) / steps;
        this.currentBall.update(last / 1000, (current - last) / 1000, this.staticBalls);

        for (var j = this.staticBalls.length - 1; j >= 0; --j) {
          if (this.staticBalls[j].counter == 0) {
            ++this.score;
            this.staticBalls.splice(j, 1);
          }
        }

        if (this.currentBall.ny < this.currentBall.nr && normalizeRadian(this.currentBall.direction) > Math.PI) {
          this.currentBall.state.s = 0;
          this.state = DontYouFillItGame.GAMEOVER;
        } else if (this.currentBall.state.s < 0.001) {
          if (this.currentBall.ny >= 0) {
            this.currentBall.grow(this.staticBalls);
            this.staticBalls.push(this.currentBall);
          }
          this.currentBall = null;
          break;
        }
        last = current;
      }
    }

    this.cannon.update(this.lastUpdateTime / 1000, (time - this.lastUpdateTime) / 1000);

    this.lastUpdateTime = time;
  }

  pause() {
    this.state = DontYouFillItGame.PAUSED;
  }

  resume() {
    this.lastUpdateTime = performance.now ? performance.now() : Date.now();
    this.state = DontYouFillItGame.RUNNING;
  }

  reset() {
    this.currentBall = null;
    this.staticBalls = [];
    this.cannon.state.u = 0;
    this.score = 0;
    this.resume();
  }

  fire() {
    this.currentBall = new Ball(
      this.DEFAULT_BALL_RADIUS,
      0.5 + Math.cos(this.cannon.getAngle()) * this.CANNON_LENGTH,
      this.CANNON_Y_POSITION + this.CANNON_BASE_HEIGHT + Math.sin(this.cannon.getAngle()) * this.CANNON_LENGTH,
      this.cannon.getAngle());
  }
}
