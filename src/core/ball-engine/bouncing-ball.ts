import { BallGeometry, MovingBall } from "../ball";
import { Angle } from "../utils";

/**
 * Represents a ball that bounces against walls and other balls.
 *
 * This is an abstract class that handles the collision logic (bouncing)
 * while leaving the movement integration to its subclasses.
 */
export abstract class BouncingBall implements BallGeometry {
  /** The radius of the ball. */
  radius: number;
  /** The x-coordinate of the ball's center. */
  x: number;
  /** The y-coordinate of the ball's center. */
  y: number;
  /** The current direction of movement in radians. */
  angle: Angle;

  constructor({ radius, x, y, angle }: Pick<MovingBall, 'radius' | 'x' | 'y' | 'angle'>) {
    this.radius = radius;
    this.x = x;
    this.y = y;

    this.angle = angle;
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
   * Updates the ball's position.
   * Implemented by subclasses to use different integration methods (e.g., RK4, linear).
   *
   * @param frameTime The current time in seconds.
   * @param lastFrameTime The time of the last update in seconds.
   */
  abstract update(frameTime: number, lastFrameTime: number): void;
}
