import { Ball, computeExpandedRadius, StaticBall } from "./ball";
import { BallEngine } from "./ball-engine";
import { normalizeRadian } from "./utils";

export class BallEngineRK4 extends BallEngine {
  staticBalls: Array<StaticBall> = [];
  currentBall: Ball | null = null;

  fire({nr, angle, nx, ny}: { nr: number; angle: number; nx: number; ny: number; }) {
    this.currentBall = new Ball(nr, nx, ny, angle);
  }

  /*
   * Position of the current ball is important, so it will be calculated 1000 times per second.
   * Position of the cannon isn't, so it will be calculated only once every frame.
   */
  update(lastUpdateTime: number | undefined, t1: number) {
    lastUpdateTime ??= t1;

    const updateState = {
      score: 0,
      gameover: false,
    };

    if (this.currentBall) {
      let loopLastUpdateTime = lastUpdateTime;
      const steps = Math.floor(t1 - lastUpdateTime);

      for (let i = 1; i <= steps; ++i) {
        const loopCurrentUpdateTime = (lastUpdateTime * (steps - i) + t1 * i) / steps;
        this.currentBall.update(loopLastUpdateTime / 1000, (loopCurrentUpdateTime - loopLastUpdateTime) / 1000, this.staticBalls);

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

    // this.cannon.update(lastUpdateTime / 1000, (time - lastUpdateTime) / 1000);

    return updateState;
  }

  restoreSnapshot(snapshot: Array<[StaticBall, StaticBall]>) {
    this.staticBalls = snapshot.map(([ball, snapshot]) => {
      ball.counter = snapshot.counter;
      ball.nr = snapshot.nr;
      ball.nx = snapshot.nx;
      ball.ny = snapshot.ny;
      return ball;
    });

  }

  reset() {
    this.currentBall = null;
    this.staticBalls = [];
  }
}
