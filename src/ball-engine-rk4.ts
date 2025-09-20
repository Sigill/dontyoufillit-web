import { Ball, computeExpandedRadius, StaticBall } from "./ball";
import { BallEngine } from "./ball-engine";
import { normalizeRadian } from "./utils";

export class BallEngineRK4 extends BallEngine {
  staticBalls: Array<StaticBall> = [];
  currentBall: Ball | null = null;

  snapshot = new Array<[StaticBall, StaticBall]>();

  takeSnapshot(): void {
    this.snapshot = this.staticBalls.map<[StaticBall, StaticBall]>(b => [b, structuredClone(b)]);
  }

  restoreSnapshot() {
    this.staticBalls = this.snapshot.map(([ball, snapshot]) => {
      ball.counter = snapshot.counter;
      ball.nr = snapshot.nr;
      ball.nx = snapshot.nx;
      ball.ny = snapshot.ny;
      return ball;
    });
  }

  fire({nr, angle, nx, ny}: { nr: number; angle: number; nx: number; ny: number; }) {
    this.takeSnapshot();

    this.currentBall = new Ball(nr, nx, ny, angle);
  }

  /*
   * Position of the current ball is important, so it will be calculated 1000 times per second.
   * Position of the cannon isn't, so it will be calculated only once every frame.
   */
  update(t1: number, t0: number): { score: number; gameover: boolean; } {
    const updateState = {
      score: 0,
      gameover: false,
    };

    if (this.currentBall) {
      let loopLastUpdateTime = t0;
      const steps = Math.floor((t1 - t0) * 1000);

      for (let i = 1; i <= steps; ++i) {
        const loopCurrentUpdateTime = (t0 * (steps - i) + t1 * i) / steps;
        this.currentBall.update(loopLastUpdateTime, (loopCurrentUpdateTime - loopLastUpdateTime), this.staticBalls);

        for (let j = this.staticBalls.length - 1; j >= 0; --j) {
          if (this.staticBalls[j].counter === 0) {
            ++updateState.score;
            this.staticBalls.splice(j, 1);
          }
        }

        if (this.currentBall.ny < this.currentBall.nr && normalizeRadian(this.currentBall.direction) > Math.PI) {
          this.currentBall.state.s = 0;
          updateState.gameover = true;
          this.currentBall = null;
          break;
        }

        if (this.currentBall.state.s < 0.001) {
          if (this.currentBall.ny >= 0) {
            this.currentBall.state.s = 0;
            const expandedRadius = computeExpandedRadius(this.currentBall, this.staticBalls);
            this.staticBalls.push({
              counter: 3,
              nr: expandedRadius,
              nx: this.currentBall.nx,
              ny: this.currentBall.ny,
            });
          }
          this.currentBall = null;
          break;
        }
        loopLastUpdateTime = loopCurrentUpdateTime;
      }
    }

    return updateState;
  }

  reset() {
    this.currentBall = null;
    this.staticBalls = [];
  }
}
