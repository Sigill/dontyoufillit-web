import { BallEngineTemporalDiscretization } from "./ball-engine-temporal-discretization";
import { MovingBall } from "../ball";
import { BouncingBall } from "./bouncing-ball";
import * as Constants from "../constants";
import { RK41DObject } from "../rk4-integrator";


/**
 * A specialized bouncing ball that uses 4th-order Runge-Kutta integration for movement.
 */
class BouncingBallRK4 extends BouncingBall {
  /**
   * Internal integrator using RK4 to solve the equations of motion.
   */
  #integrator = new class extends RK41DObject {
    constructor() {
      super(0, Constants.DEFAULT_BALL_VELOCITY);
    }

    override acceleration(): number {
      return Constants.DEFAULT_BALL_ACCELERATION;
    }
  };

  /**
   * Returns the current velocity from the RK4 integrator.
   */
  get velocity(): number {
    return this.#integrator.v;
  }

  /**
   * Stops the ball by setting integrator velocity to zero.
   */
  override stop() {
    this.#integrator.v = 0;
  }

  /**
   * Updates the ball's position using the RK4 integrator.
   *
   * @param frameTime Current time in seconds.
   * @param lastFrameTime Last update time in seconds.
   */
  override update(frameTime: number, lastFrameTime: number) {
    const previousStateU = this.#integrator.u;

    this.#integrator.integrate(lastFrameTime, frameTime - lastFrameTime);

    const deltaU = this.#integrator.u - previousStateU;
    this.x += deltaU * this.angle.cos;
    this.y += deltaU * this.angle.sin;
  }
}

/**
 * A BallEngine implementation that uses Runge-Kutta integration (RK4) for ball physics.
 */
export class BallEngineRK4 extends BallEngineTemporalDiscretization {
  /**
   * Replaces the current ball with a new BouncingBallRK4 instance.
   */
  override internalFire(ball: MovingBall) {
    this.currentBall = new BouncingBallRK4(ball);
  }
}
