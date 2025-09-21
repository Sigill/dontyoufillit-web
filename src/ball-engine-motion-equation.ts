import { BallEngineTemporalDiscretization } from "./ball-engine-temporal-discretization";
import { BouncingBall } from "./bouncing-ball";
import * as Constants from "./constants";


class BouncingBallMotionEquationDelta extends BouncingBall {
  #v = Constants.DEFAULT_BALL_VELOCITY;

  get velocity(): number {
    return this.#v;
  }

  override stop() {
    this.#v = 0;
  }

  override internalUpdate(t: number, dt: number) {
    const deltaU = this.#v * dt + 1/2 * Constants.DEFAULT_BALL_ACCELERATION * dt**2;
    this.#v += Constants.DEFAULT_BALL_ACCELERATION * dt;

    this.x += deltaU * Math.cos(this.direction);
    this.y += deltaU * Math.sin(this.direction);
  }
}

export class BallEngineMotionEquationDelta extends BallEngineTemporalDiscretization {
  override internalFire({radius: radius, angle, x, y}: { radius: number; angle: number; x: number; y: number; }) {
    this.currentBall = new BouncingBallMotionEquationDelta(radius, x, y, angle);
  }

  override internalReset() {
    this.currentBall = null;
  }
}
