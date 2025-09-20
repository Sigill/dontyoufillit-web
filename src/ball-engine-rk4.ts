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
      ball.radius = snapshot.radius;
      ball.x = snapshot.x;
      ball.y = snapshot.y;
      return ball;
    });
  }

  fire({radius: radius, angle, x, y}: { radius: number; angle: number; x: number; y: number; }) {
    this.takeSnapshot();

    this.currentBall = new Ball(radius, x, y, angle);
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

        if (this.currentBall.y < this.currentBall.radius && normalizeRadian(this.currentBall.direction) > Math.PI) {
          this.currentBall.state.v = 0;
          updateState.gameover = true;
          this.currentBall = null;
          break;
        }

        if (this.currentBall.state.v < 0.001) {
          if (this.currentBall.y >= 0) {
            this.currentBall.state.v = 0;
            const expandedRadius = computeExpandedRadius(this.currentBall, this.staticBalls);
            this.staticBalls.push({
              counter: 3,
              radius: expandedRadius,
              x: this.currentBall.x,
              y: this.currentBall.y,
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
