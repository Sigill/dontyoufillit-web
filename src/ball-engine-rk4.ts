import { BallEngineTemporalDiscretization } from "./ball-engine-temporal-discretization";
import { BouncingBall } from "./bouncing-ball";
import * as Constants from "./constants";
import { RK41DObject } from "./rk4-integrator";


class BouncingBallRK4 extends BouncingBall {
  #integrator = new class extends RK41DObject {
    constructor() {
      super(0, Constants.DEFAULT_BALL_VELOCITY);
    }

    override acceleration(): number {
      return Constants.DEFAULT_BALL_ACCELERATION;
    }
  };

  get velocity(): number {
    return this.#integrator.v;
  }

  override stop() {
    this.#integrator.v = 0;
  }

  override internalUpdate(frameTime: number, lastFrameTime: number) {
    const previousStateU = this.#integrator.u;

    this.#integrator.integrate(lastFrameTime, frameTime - lastFrameTime);

    const deltaU = this.#integrator.u - previousStateU;
    this.x += deltaU * Math.cos(this.direction);
    this.y += deltaU * Math.sin(this.direction);
  }
}

export class BallEngineRK4 extends BallEngineTemporalDiscretization {
  override internalFire({radius: radius, angle, x, y}: { radius: number; angle: number; x: number; y: number; }) {
    this.currentBall = new BouncingBallRK4(radius, x, y, angle);
  }

  override internalReset() {
    this.currentBall = null;
  }
}
