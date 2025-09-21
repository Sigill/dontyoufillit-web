import { StaticBall } from "./static-ball";
import { normalizeRadian, vectorLength } from "./utils";


export abstract class BouncingBall {
  radius: number;
  x: number;
  y: number;
  direction: number;

  constructor(radius: number, x: number, y: number, angle: number) {
    this.radius = radius;
    this.x = x;
    this.y = y;

    this.direction = angle;
  }

  abstract get velocity(): number;

  abstract stop(): void;

  update(t: number, dt: number, staticBalls: Array<StaticBall>) {
    this.internalUpdate(t, dt);

    this.bounce(staticBalls);
  }

  abstract internalUpdate(t: number, dt: number): void;

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
        const phi = Math.atan2(normalY, normalX);
        const theta = this.direction;
        const velocity = this.velocity;

        const velocityX = -velocity * Math.cos(theta - phi) * Math.cos(phi) + velocity * Math.sin(theta - phi) * Math.cos(phi + Math.PI / 2);
        const velocityY = -velocity * Math.cos(theta - phi) * Math.sin(phi) + velocity * Math.sin(theta - phi) * Math.sin(phi + Math.PI / 2);

        // Linear speed doesn't change, only the direction.
        this.direction = Math.atan2(velocityY, velocityX);
      }
    }
  }
}
