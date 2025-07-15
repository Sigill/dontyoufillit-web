import { RK41DObject } from "./rk4-integrator.js";
import { normalizeRadian, vectorLength } from "./utils.js";

export interface StaticBall {
  counter: number;
  nr: number;
  nx: number;
  ny: number;
}

export class Ball extends RK41DObject {
  counter: number;
  nr: number;
  nx: number;
  ny: number;
  direction: number;

  constructor(r: number, x: number, y: number, a: number) {
    super();

    this.counter = 3;

    this.nr = r; // Normalized radius and coordinates
    this.nx = x;
    this.ny = y;

    this.direction = a;
    this.state.u = 0;
    this.state.s = 1;
  }

  override acceleration() {
    return -0.4;
  }

  update(t: number, dt: number, staticBalls: Array<Ball>) {
    const previousStateU = this.state.u;

    this.integrate(t, dt);

    const d = this.state.u - previousStateU;
    this.nx += d * Math.cos(this.direction);
    this.ny += d * Math.sin(this.direction);

    this.bounce(staticBalls);
  }

  private bounce(staticBalls: Array<StaticBall>) {
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

    for (let i = 0; i < staticBalls.length; ++i) {
      const o = staticBalls[i];

      const normalX = this.nx - o.nx;
      const normalY = this.ny - o.ny;
      const dist = vectorLength(normalX, normalY);

      if (dist <= o.nr + this.nr) {
        --o.counter;

        // Move it back to prevent clipping
        this.nx = o.nx + normalX * (this.nr + o.nr) / dist;
        this.ny = o.ny + normalY * (this.nr + o.nr) / dist;

        // http://en.wikipedia.org/wiki/Elastic_collision#Two-Dimensional_Collision_With_Two_Moving_Objects
        // Assuming no speed and an infinite mass for the second ball.
        const phi = Math.atan2(normalY, normalX), theta = this.direction, speed = this.state.s;

        const velocityX = -speed * Math.cos(theta - phi) * Math.cos(phi) + speed * Math.sin(theta - phi) * Math.cos(phi + Math.PI / 2);
        const velocityY = -speed * Math.cos(theta - phi) * Math.sin(phi) + speed * Math.sin(theta - phi) * Math.sin(phi + Math.PI / 2);

        // Linear speed doesn't change, only the direction.
        this.direction = Math.atan2(velocityY, velocityX);
      }
    }
  }

  grow(staticBalls: Array<Ball>) {
    let minRadius = Number.MAX_VALUE, available, o;

    for (let i = 0; i < staticBalls.length; ++i) {
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

  staticSnapshot(): StaticBall {
    return {
      counter: this.counter,
      nr: this.nr,
      nx: this.nx,
      ny: this.ny,
    };
  }
}
