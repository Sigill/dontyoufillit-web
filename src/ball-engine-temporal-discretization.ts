import { BallEngine } from "./ball-engine";
import { BouncingBall } from "./bouncing-ball";
import { computeExpandedRadius } from "./static-ball";
import { normalizeRadian } from "./utils";


/**
 * A BallEngine implementation that uses temporal discretization to update the physics.
 *
 * This engine updates the current ball's position and speed at a fixed frequency
 * (1000 times per second) regardless of the frame rate. This ensures an accurate
 * enough simulation.
 *
 * This is an abstract class. Implementations shall extend this class to provide the
 * `internalFire()` method where a {@link BouncingBall} object (which provides the
 * actual ball physics) is built.
 */
export abstract class BallEngineTemporalDiscretization extends BallEngine {
  currentBall: BouncingBall | null = null;

  /**
   * Updates the game state by progressing the physics simulation using fixed time steps.
   *
   * It calculates the number of steps to perform based on the time elapsed since the
   * last frame, with a resolution of 1ms per step.
   *
   * @param frameTime The current frame time in seconds.
   * @param lastFrameTime The last frame time in seconds.
   * @returns An object containing the score increment and game over status.
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
