import { BallEngine } from "../ball-engine";
import { WallSide } from "../collision-solver/ball-wall-collision-solver";
import { computeExpandedRadius } from "../static-ball";
import { BallGeometry, BallState, MovingBall, StaticBall } from "../ball";
import { directionalArrow, ppAngle } from "../utils";
import { GameWalls } from "./walls";
import { computeFixedPoints, Obstacle } from "../collision-solver/fixed-points";

/**
 * Pretty prints a wall obstacle.
 *
 * @param params The wall and sigma value.
 * @returns A string representation of the wall obstacle.
 */
function ppWallObstacle({ x0, y0, x1, y1, sigma}: WallSide) {
  return `wall x0:${x0.toFixed(3)} y0:${y0.toFixed(3)} x1:${x1.toFixed(3)} y1:${y1.toFixed(3)} sigma:${sigma}`;
}

/**
 * Pretty prints a ball obstacle.
 *
 * @param ball The static ball to represent.
 * @returns A string representation of the ball obstacle.
 */
function ppBallObstacle({ x, y, counter }: StaticBall) {
  return `ball x:${x.toFixed(3)} y:${y.toFixed(3)} counter:${counter}`;
}

/**
 * Pretty prints an obstacle.
 *
 * @param o The obstacle to represent.
 * @returns A string representation of the obstacle.
 */
export function ppObstacle(o: Obstacle) {
  return o.type === 'wall'
    ? ppWallObstacle(o.value)
    : ppBallObstacle(o.value);
}

class MathBall implements BallGeometry {
  radius: number;
  x: number;
  y: number;

  firedAt?: number = undefined;

  constructor(r: number, x: number, y: number, readonly fixedPoints: Array<BallState & { obstacles: Obstacle[]; }>) {
    this.radius = r;
    this.x = x;
    this.y = y;
  }
}

/**
 * An implementation of the BallEngine that computes the exact trajectory of the ball
 * by solving the equations of motion.
 *
 * This implementation is more precise than the temporal discretization implementation, but
 * it is also more complex (and still not totally exact because of floating point arithmetic).
 */
export class BallEngineMath extends BallEngine {
  staticBalls: Array<StaticBall> = [];
  currentBall: MathBall | null = null;

  #epsilon: number;

  constructor(
    {
      withSnapshots,
      verbose,
      epsilon = 1e-5,
    }: {
      withSnapshots?: boolean;
      verbose?: boolean;
      epsilon?: number;
    } = {}
  ) {
    super({ withSnapshots, verbose });
    this.#epsilon = epsilon;
  }

  /**
   * Fires the ball and pre-computes all its future collisions and path.
   *
   * @param ball The initial state of the ball being fired
   */
  internalFire(ball: MovingBall): void {
    const { fixedPoints } = computeFixedPoints(ball, this.staticBalls, { epsilon: this.#epsilon, includeFixedPoints: true });

    if (this.verbose) {
      console.group('Fixed points');
      for (const {t, x, y, angle, velocity, obstacles: obstacles} of fixedPoints!) {
        for (const obstacle of obstacles) {
          console.debug(`Collision with ${ppObstacle(obstacle)}`);
        }
        console.debug(`Δt:${t.toFixed(3)} ${directionalArrow(Math.cos(angle) * velocity, Math.sin(angle) * velocity)} x:${x.toFixed(3)} y:${y.toFixed(3)} v:${velocity.toFixed(3)} angle:${ppAngle(angle)}`);
      }
      console.groupEnd();
    }

    this.currentBall = new MathBall(
      ball.radius,
      ball.x, ball.y,
      fixedPoints!,
    );
  }

  /**
   * Updates the game state based on the current time.
   * Unlike the temporal discretization engine, this one checks against the pre-calculated fixed points
   * to determine the ball's position and any events (scoring, game over).
   *
   * @param frameTime The current time of the frame
   * @returns The score gained in this frame and whether the game is over
   */
  update(frameTime: number, lastFrameTime: number): { score: number; gameover: boolean; } {
    const currentBall = this.currentBall;

    if (currentBall !== null) {
      const firedAt = currentBall.firedAt ??= lastFrameTime;

      const pastFixedPoints = currentBall.fixedPoints.filter(fp => firedAt + fp.t <= frameTime);

      let shouldGrow = true; // Track if ball should grow when stopped
      let stoppedByCollision = false; // Track if stopped by collision handler

      let score = 0;

      // Process fixed points, but stop at first ball collision if handler says to stop
      for (const fp of pastFixedPoints) {
        if (stoppedByCollision) break;

        for (const obstacle of fp.obstacles) {
          if (obstacle.type === 'ball') {
            const ball = obstacle.value;
            const collisionResult = this.collisionHandler.onBallCollision(ball);

            ball.counter -= collisionResult.counterDecrement;
            if (ball.counter < 0) ball.counter = 0;
            if (ball.counter === 0) {
              if (collisionResult.scoreOnDestroy) {
                score += 1;
              }
              this.staticBalls.splice(this.staticBalls.indexOf(ball), 1);
            }

            // If handler says to stop, mark for immediate removal and break
            if (collisionResult.stopCurrentBall) {
              shouldGrow = collisionResult.growOnStop;
              stoppedByCollision = true;
              break;
            }
          }
        }
      }

      // If stopped by collision handler, remove ball immediately
      if (stoppedByCollision) {
        this.internalReset();
        return { score, gameover: false };
      }

      const fp = pastFixedPoints.at(-1)!;

      if (this.verbose) {
        console.log(`Last fixed point t:${fp.t.toFixed(3)} x:${fp.x.toFixed(3)} y:${fp.y.toFixed(3)} ${directionalArrow(Math.cos(fp.angle), Math.sin(fp.angle))}`);
      }

      let hasHitBottomWall = fp.obstacles.some(({type, value}) => {
        return type === 'wall' && value === GameWalls.bottom;
      });

      // The last of the past fixed points is the one that will be used to compute the new position of the ball.
      // The ones before it have been consumed, let's discard them.
      currentBall.fixedPoints.splice(0, pastFixedPoints.length - 1);
      // The last one is kept as it might still be the fixed point for the next frame.
      // Discard its obstacles as the collisions have already been accounted for.
      pastFixedPoints.at(-1)!.obstacles.length = 0;

      currentBall.x = fp.x;
      currentBall.y = fp.y;

      if (fp !== currentBall.fixedPoints.at(-1)) {
        const timeSinceFixedPoint = frameTime - (fp.t + firedAt);
        currentBall.x += Math.cos(fp.angle) * fp.velocity * timeSinceFixedPoint + 1/2 * Math.cos(fp.angle) * fp.acceleration * timeSinceFixedPoint**2;
        currentBall.y += Math.sin(fp.angle) * fp.velocity * timeSinceFixedPoint + 1/2 * Math.sin(fp.angle) * fp.acceleration * timeSinceFixedPoint**2;
      } else { // This was the last fixed point, the ball has stopped.
        if (!hasHitBottomWall && currentBall.y >= 0 && shouldGrow) {
          const expandedRadius = computeExpandedRadius(currentBall, this.staticBalls);
          this.staticBalls.push({
            counter: 3,
            radius: expandedRadius,
            x: currentBall.x,
            y: currentBall.y,
          });
        }

        hasHitBottomWall = hasHitBottomWall || (currentBall.y < currentBall.radius && Math.sin(fp.angle) < 0);

        this.internalReset();
      }

      return { score, gameover: hasHitBottomWall };
    }

    return { score: 0, gameover: false };
  }
}
