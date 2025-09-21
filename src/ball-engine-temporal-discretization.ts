import { BallEngine } from "./ball-engine";
import { BouncingBall } from "./bouncing-ball";
import { computeExpandedRadius } from "./static-ball";
import { normalizeRadian } from "./utils";


export abstract class BallEngineTemporalDiscretization extends BallEngine {
  currentBall: BouncingBall | null = null;

  /*
   * Position of the current ball is important, so it will be calculated 1000 times per second.
   */
  override update(frameTime: number, lastFrameTime: number): { score: number; gameover: boolean; } {
    const updateState = {
      score: 0,
      gameover: false,
    };

    if (this.currentBall) {
      let loopLastUpdateTime = lastFrameTime;
      const steps = Math.floor((frameTime - lastFrameTime) * 1000);

      for (let i = 1; i <= steps; ++i) {
        const loopCurrentUpdateTime = (lastFrameTime * (steps - i) + frameTime * i) / steps;
        this.currentBall.update(loopCurrentUpdateTime, loopLastUpdateTime, this.staticBalls);

        for (let j = this.staticBalls.length - 1; j >= 0; --j) {
          if (this.staticBalls[j].counter === 0) {
            ++updateState.score;
            this.staticBalls.splice(j, 1);
          }
        }

        if (this.currentBall.y < this.currentBall.radius && normalizeRadian(this.currentBall.direction) > Math.PI) {
          this.currentBall.stop();
          updateState.gameover = true;
          this.currentBall = null;
          break;
        }

        if (this.currentBall.velocity < 0.001) {
          if (this.currentBall.y >= 0) {
            this.currentBall.stop();
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
}
