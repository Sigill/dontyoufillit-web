import { StaticBall } from "./static-ball";
import { normalizeRadian, vectorLength } from "./utils";


/**
 * Represents a ball that bounces against walls and other balls.
 *
 * This is an abstract class that handles the collision logic (bouncing)
 * while leaving the movement integration to its subclasses.
 */
export abstract class BouncingBall {
  /** The radius of the ball. */
  radius: number;
  /** The x-coordinate of the ball's center. */
  x: number;
  /** The y-coordinate of the ball's center. */
  y: number;
  /** The current direction of movement in radians. */
  direction: number;

  constructor(radius: number, x: number, y: number, angle: number) {
    this.radius = radius;
    this.x = x;
    this.y = y;

    this.direction = angle;
  }

  /**
   * Returns the current scalar velocity of the ball.
   */
  abstract get velocity(): number;

  /**
   * Stops the ball's movement.
   */
  abstract stop(): void;

  /**
   * Updates the ball's position and handles collisions.
   *
   * @param frameTime The current time in seconds.
   * @param lastFrameTime The time of the last update in seconds.
   * @param staticBalls The list of static balls to check for collisions against.
   */
  update(frameTime: number, lastFrameTime: number, staticBalls: Array<StaticBall>) {
    this.internalUpdate(frameTime, lastFrameTime);

    this.bounce(staticBalls);
  }

  /**
   * Performs the actual position update based on the elapsed time.
   * Implemented by subclasses to use different integration methods (e.g., RK4, linear).
   *
   * @param frameTime The current time in seconds.
   * @param lastFrameTime The time of the last update in seconds.
   */
  abstract internalUpdate(frameTime: number, lastFrameTime: number): void;

  /**
   * Handles bouncing against the bounding box and static balls.
   *
   * @param staticBalls The list of static balls to check for collisions against.
   */
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
