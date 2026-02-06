import { BallEngine } from "../ball-engine";
import { BouncingBall } from "./bouncing-ball";
import { computeExpandedRadius } from "../static-ball";
import { normalizeRadian } from "../utils";

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

        // 1. Integrate
        this.currentBall.update(loopCurrentUpdateTime, loopLastUpdateTime);

        // 2. Check Walls
        // Right wall
        if (this.currentBall.x > 1 - this.currentBall.radius) {
          const limit = 1 - this.currentBall.radius;
          const penetration = this.currentBall.x - limit;
          this.currentBall.x = limit - penetration; // Reflect position
          this.currentBall.angle = normalizeRadian(Math.PI - this.currentBall.angle);
        }
        // Left wall
        else if (this.currentBall.x < this.currentBall.radius) {
          const limit = this.currentBall.radius;
          const penetration = limit - this.currentBall.x;
          this.currentBall.x = limit + penetration; // Reflect position
          this.currentBall.angle = normalizeRadian(Math.PI - this.currentBall.angle);
        }

        // Top Wall
        if (this.currentBall.y > 1 - this.currentBall.radius) {
          const limit = 1 - this.currentBall.radius;
          const penetration = this.currentBall.y - limit;
          this.currentBall.y = limit - penetration; // Reflect position
          this.currentBall.angle = normalizeRadian(-this.currentBall.angle);
        }

        // 3. Check Static Balls
        for (let j = this.staticBalls.length - 1; j >= 0; --j) {
          const staticBall = this.staticBalls[j];
          const dx = this.currentBall.x - staticBall.x;
          const dy = this.currentBall.y - staticBall.y;
          const distSq = dx*dx + dy*dy;
          const minDist = this.currentBall.radius + staticBall.radius;

          if (distSq < minDist * minDist) {
            // Get collision result from handler
            const collisionResult = this.collisionHandler.onBallCollision(staticBall);

            const dist = Math.sqrt(distSq);
            // Avoid division by zero
            if (dist > 0 && !collisionResult.stopCurrentBall) {
              const newDist = 2 * minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              // Reflect position
              this.currentBall.x = staticBall.x + nx * newDist;
              this.currentBall.y = staticBall.y + ny * newDist;

              // Reflect direction
              const alpha = Math.atan2(ny, nx);
              const tangentAngle = alpha + Math.PI / 2;
              this.currentBall.angle = normalizeRadian(2 * tangentAngle - this.currentBall.angle);
            }

            // Apply counter decrement from handler
            staticBall.counter -= collisionResult.counterDecrement;
            if (staticBall.counter < 0) staticBall.counter = 0;
            if (staticBall.counter === 0) {
              this.staticBalls.splice(j, 1);
              if (collisionResult.scoreOnDestroy) {
                updateState.score++;
              }
            }

            // If handler says to stop, remove ball immediately without growth
            if (collisionResult.stopCurrentBall) {
              this.currentBall.stop();
              this.internalReset();
              return updateState;
            }
          }
        }

        if (this.currentBall.y < this.currentBall.radius && normalizeRadian(this.currentBall.angle) > Math.PI) {
          this.currentBall.stop();
          updateState.gameover = true;
          this.internalReset();
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
          this.internalReset();
          break;
        }
        loopLastUpdateTime = loopCurrentUpdateTime;
      }
    }

    return updateState;
  }
}
