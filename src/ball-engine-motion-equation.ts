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

  override internalUpdate(frameTime: number, lastFrameTime: number) {
    const deltaT = frameTime - lastFrameTime;
    const deltaU = this.#v * deltaT + 1/2 * Constants.DEFAULT_BALL_ACCELERATION * deltaT**2;
    this.#v += Constants.DEFAULT_BALL_ACCELERATION * deltaT;

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

class BouncingBallMotionEquationAbsolute extends BouncingBall {
  #u = 0;
  #v = Constants.DEFAULT_BALL_VELOCITY;

  #firedAt?: number;

  get velocity(): number {
    return this.#v;
  }

  override stop() {
    this.#v = 0;
  }

  override internalUpdate(frameTime: number) {
    this.#firedAt ??= frameTime;

    const prevU = this.#u;

    const ballTime = frameTime - this.#firedAt;
    // Does this reduce rounding error accumulation compared to the delta-based implementation?
    this.#u = Constants.DEFAULT_BALL_VELOCITY * ballTime + 1/2 * Constants.DEFAULT_BALL_ACCELERATION * ballTime**2;
    this.#v = Constants.DEFAULT_BALL_VELOCITY + Constants.DEFAULT_BALL_ACCELERATION * ballTime;

    const deltaU = this.#u - prevU;

    this.x += deltaU * Math.cos(this.direction);
    this.y += deltaU * Math.sin(this.direction);
  }
}

export class BallEngineMotionEquationAbsolute extends BallEngineTemporalDiscretization {
  override internalFire({radius: radius, angle, x, y}: { radius: number; angle: number; x: number; y: number; }) {
    this.currentBall = new BouncingBallMotionEquationAbsolute(radius, x, y, angle);
  }

  override internalReset() {
    this.currentBall = null;
  }
}
