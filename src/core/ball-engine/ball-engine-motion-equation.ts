import { BallEngineTemporalDiscretization } from "./ball-engine-temporal-discretization";
import { MovingBall } from "../ball";
import { BouncingBall } from "./bouncing-ball";
import * as Constants from "../constants";


/**
 * A specialized bouncing ball that uses the displacement/velocity delta equations of motion.
 */
class BouncingBallMotionEquationDelta extends BouncingBall {
  #velocity: number;
  readonly #acceleration: number;

  constructor(ball: MovingBall) {
    super(ball);
    this.#velocity = ball.velocity;
    this.#acceleration = ball.acceleration;
  }

  /**
   * Returns the current scalar velocity.
   */
  get velocity(): number {
    return this.#velocity;
  }

  /**
   * Stops the ball by setting its velocity to zero.
   */
  override stop() {
    this.#velocity = 0;
  }

  /**
   * Updates the ball's position using delta-based equations of motion.
   *
   * @param frameTime Current time in seconds.
   * @param lastFrameTime Last update time in seconds.
   */
  override update(frameTime: number, lastFrameTime: number) {
    const deltaT = frameTime - lastFrameTime;
    const deltaU = this.#velocity * deltaT + 1/2 * this.#acceleration * deltaT**2;
    this.#velocity += this.#acceleration * deltaT;

    this.x += deltaU * Math.cos(this.angle);
    this.y += deltaU * Math.sin(this.angle);
  }
}

/**
 * A BallEngine implementation using delta-based equations of motion for physics.
 */
export class BallEngineMotionEquationDelta extends BallEngineTemporalDiscretization {
  /**
   * Replaces the current ball with a new BouncingBallMotionEquationDelta instance.
   */
  override internalFire(ball: MovingBall) {
    this.currentBall = new BouncingBallMotionEquationDelta(ball);
  }
}

/**
 * A specialized bouncing ball that uses absolute equations of motion from the time of firing.
 */
class BouncingBallMotionEquationAbsolute extends BouncingBall {
  #u = 0;
  #v = Constants.DEFAULT_BALL_VELOCITY;

  /** Time when the ball was fired. */
  #firedAt?: number;

  /**
   * Returns the current scalar velocity.
   */
  get velocity(): number {
    return this.#v;
  }

  /**
   * Stops the ball by setting its velocity to zero.
   */
  override stop() {
    this.#v = 0;
  }

  /**
   * Updates the ball's position using absolute equations of motion.
   *
   * @param frameTime Current time in seconds.
   */
  override update(frameTime: number) {
    this.#firedAt ??= frameTime;

    const prevU = this.#u;

    const ballTime = frameTime - this.#firedAt;
    // Does this reduce rounding error accumulation compared to the delta-based implementation?
    this.#u = Constants.DEFAULT_BALL_VELOCITY * ballTime + 1/2 * Constants.DEFAULT_BALL_ACCELERATION * ballTime**2;
    this.#v = Constants.DEFAULT_BALL_VELOCITY + Constants.DEFAULT_BALL_ACCELERATION * ballTime;

    const deltaU = this.#u - prevU;

    this.x += deltaU * Math.cos(this.angle);
    this.y += deltaU * Math.sin(this.angle);
  }
}

/**
 * A BallEngine implementation using absolute equations of motion for physics.
 */
export class BallEngineMotionEquationAbsolute extends BallEngineTemporalDiscretization {
  /**
   * Replaces the current ball with a new BouncingBallMotionEquationAbsolute instance.
   */
  override internalFire(ball: MovingBall) {
    this.currentBall = new BouncingBallMotionEquationAbsolute(ball);
  }
}
