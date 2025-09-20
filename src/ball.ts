import { RK41DObject } from "./rk4-integrator";
import { normalizeRadian, vectorLength } from "./utils";
import * as Constants from "./constants";

export interface StaticBall {
  counter: number;
  radius: number;
  x: number;
  y: number;
}

export class Ball extends RK41DObject {
  counter: number;
  radius: number;
  x: number;
  y: number;
  direction: number;

  constructor(radius: number, x: number, y: number, angle: number) {
    super();

    this.counter = 3;

    this.radius = radius;
    this.x = x;
    this.y = y;

    this.direction = angle;
    this.state.u = 0;
    this.state.v = 1;
  }

  override acceleration() {
    return Constants.DEFAULT_BALL_ACCELERATION;
  }

  update(t: number, dt: number, staticBalls: Array<StaticBall>) {
    const previousStateU = this.state.u;

    this.integrate(t, dt);

    const d = this.state.u - previousStateU;
    this.x += d * Math.cos(this.direction);
    this.y += d * Math.sin(this.direction);

    this.bounce(staticBalls);
  }

  private bounce(staticBalls: Array<StaticBall>) {
    if (this.x > 1 - this.radius) {
      this.x = 1 - this.radius;
      this.direction = normalizeRadian(Math.PI - this.direction);
    } else if (this.x < this.radius) {
      this.x = this.radius;
      this.direction = normalizeRadian(Math.PI - this.direction);
    }

    if (this.y > 1 - this.radius) {
      this.y = 1 - this.radius;
      this.direction = normalizeRadian(-this.direction);
    }

    for (let i = 0; i < staticBalls.length; ++i) {
      const o = staticBalls[i];

      const normalX = this.x - o.x;
      const normalY = this.y - o.y;
      const dist = vectorLength(normalX, normalY);

      if (dist <= o.radius + this.radius) {
        --o.counter;

        // Move it back to prevent clipping
        this.x = o.x + normalX * (this.radius + o.radius) / dist;
        this.y = o.y + normalY * (this.radius + o.radius) / dist;

        // http://en.wikipedia.org/wiki/Elastic_collision#Two-Dimensional_Collision_With_Two_Moving_Objects
        // Assuming no speed and an infinite mass for the second ball.
        const phi = Math.atan2(normalY, normalX), theta = this.direction, velocity = this.state.v;

        const velocityX = -velocity * Math.cos(theta - phi) * Math.cos(phi) + velocity * Math.sin(theta - phi) * Math.cos(phi + Math.PI / 2);
        const velocityY = -velocity * Math.cos(theta - phi) * Math.sin(phi) + velocity * Math.sin(theta - phi) * Math.sin(phi + Math.PI / 2);

        // Linear speed doesn't change, only the direction.
        this.direction = Math.atan2(velocityY, velocityX);
      }
    }
  }

  staticSnapshot(): StaticBall {
    return {
      counter: this.counter,
      radius: this.radius,
      x: this.x,
      y: this.y,
    };
  }
}

export function computeExpandedRadius(
  {x, y}: { x: number; y: number; },
  staticBalls: Array<{ radius: number; x: number; y: number; }>
) {
  let minRadius = Number.MAX_VALUE, available: number, o: { radius: number; x: number; y: number; };

  for (let i = 0; i < staticBalls.length; ++i) {
    o = staticBalls[i];
    available = vectorLength(x - o.x, y - o.y) - o.radius;
    if (minRadius > available) minRadius = available;
  }

  available = x;
  if (minRadius > available) minRadius = available;

  available = 1 - x;
  if (minRadius > available) minRadius = available;

  available = Math.abs(y);
  if (minRadius > available) minRadius = available;

  available = Math.abs(1 - y);
  if (minRadius > available) minRadius = available;

  return Math.abs(minRadius);
}
