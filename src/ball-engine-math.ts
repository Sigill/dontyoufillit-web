import { BallEngine } from "./ball-engine";
import {
  BallObstacle,
  Collision,
  computeCollisionsWithBalls,
  computeCollisionsWithWalls,
  findImminentCollisions,
  Wall,
  WallObstacle,
} from "./collision-solver";
import * as Constants from "./constants";
import { computeExpandedRadius } from "./static-ball";
import { BallGeometry, BallState, MovingBall, StaticBall } from "./ball";
import { directionalArrow, normalizeRadian, ppAngle } from "./utils";

type Obstacle = WallObstacle | BallObstacle<StaticBall>;

/**
 * Pretty prints a wall obstacle.
 *
 * @param params The wall and sigma value.
 * @returns A string representation of the wall obstacle.
 */
function ppWallObstacle({ wall: w, sigma }: { wall: Wall; sigma: number }) {
  return `wall x0:${w.x0.toFixed(3)} y0:${w.y0.toFixed(3)} x1:${w.x1.toFixed(3)} y1:${w.y1.toFixed(3)} sigma:${sigma}`;
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

const GameWalls = {
  top: {x0: 0, y0: 1, x1: 1, y1: 1}, // top
  right: {x0: 1, y0: 1, x1: 1, y1: 0}, // right
  bottom: {x0: 1, y0: 0, x1: 0, y1: 0}, // bottom
  left: {x0: 0, y0: 0, x1: 0, y1: 1}, // left
};

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

function computeCollisionsWithGameWalls(
  ball: {
    radius: number;
    x: number;
    y: number;
    angle: number;
    velocity: number;
    acceleration: number;
  },
  { epsilon = 1e-5 }: { epsilon?: number } = {}
): Array<Collision<WallObstacle>> {
  // TODO IO: depending on direction of movement, only check the walls in that direction.
  const candidateWalls: Array<Wall> = [GameWalls.top, GameWalls.right, GameWalls.left];

  // Only consider the bottom border if above it.
  if (ball.y > ball.radius) {
    candidateWalls.push(GameWalls.bottom);
  }

  return computeCollisionsWithWalls(ball, candidateWalls, { epsilon });
}

/**
 * Computes the key points in the ball's trajectory (collisions, start, end).
 *
 * @param ball The initial state of the ball.
 * @param balls The list of static balls (obstacles) in the game.
 * @param options Configuration options.
 * @param options.epsilon The precision for collision detection.
 * @returns A generator that yields the state of the ball at each significant event (collision or stop).
 */
export function* computeFixedPoints(
  ball: MovingBall,
  balls: Array<StaticBall>,
  { epsilon = 1e-5 }: { epsilon?: number } = {},
): Generator<BallState & { obstacles: Array<Obstacle>; }> {
  let { x, y, velocity, angle} = ball;

  let t0 = 0;
  const tMax = -ball.velocity / ball.acceleration;

  yield { t: t0, x, y, velocity, angle, acceleration: ball.acceleration, obstacles: [] };

  const fixedBalls = balls.map<StaticBall & { sourceBall: StaticBall }>(b => {
    let originalCounter = b.counter;
    return {
      ...b,
      get counter() {
        return originalCounter;
      },
      set counter(value: number) {
        originalCounter = value;
      },
      sourceBall: b,
    };
  });

  while (true) {
    const ballState = { x, y, angle, velocity, acceleration: ball.acceleration, radius: ball.radius };
    const wallCollisions = computeCollisionsWithGameWalls(ballState, { epsilon });
    const ballCollisions = fixedBalls.length === 0 ? [] : computeCollisionsWithBalls(ballState, fixedBalls, { epsilon });
    const collisions = findImminentCollisions<WallObstacle | BallObstacle<StaticBall & { sourceBall: StaticBall; }>>(
      [ ...wallCollisions, ...ballCollisions ],
      {epsilon}
    );

    if (collisions.length > 1) { // TODO handle collision against multiple objects.
      throw new Error('Collision against multiple objects');
    }

    for (const collision of collisions) {
      collision.t += t0;
    }

    const collision = collisions.at(0);

    const t1 = collision?.t ?? tMax;
    const deltaT = t1 - t0;

    x += 1/2 * Math.cos(angle) * ball.acceleration * deltaT**2 + Math.cos(angle) * velocity * deltaT;
    y += 1/2 * Math.sin(angle) * ball.acceleration * deltaT**2 + Math.sin(angle) * velocity * deltaT;
    velocity = collision === undefined
      ? 0 // Avoid rounding errors.
      : velocity + ball.acceleration * deltaT;

    const obstacles = [];

    if (collision !== undefined) {
      if (collision.obstacle.type === 'wall') {
        const { wall } = collision.obstacle.value;
        const wallAngle = Math.atan2(wall.y1 - wall.y0, wall.x1 - wall.x0);

        angle = 2 * wallAngle - angle;

        obstacles.push(collision.obstacle);
      } else {
        const ball = collision.obstacle.value;

        ball.counter -= 1;
        if (ball.counter === 0) {
          fixedBalls.splice(fixedBalls.indexOf(ball), 1);
        }

        const theta = Math.atan2(y - ball.y, x - ball.x);
        angle = 2 * (theta + Math.PI / 2) - angle;

        obstacles.push({ type: 'ball' as const, value: collision.obstacle.value.sourceBall });

        // if (y < ball.radius) {
        //   velocity = 0;
        // }
      }

      angle = normalizeRadian(angle);
    }

    yield { t: t1, x, y, angle, velocity, acceleration: ball.acceleration, obstacles };

    // Stop if:
    if (
      // There was no collision, which means the ball has stopped.
      collision === undefined
      ||
      // The ball has collided with the bottom wall.
      (collision.obstacle.type === 'wall' && collision.obstacle.value.wall === GameWalls.bottom)
      ||
      // The ball has hit a ball while touching with the bottom wall.
      (collision.obstacle.type === 'ball' && y < ball.radius && Math.sin(angle) < 0)
    ) {
      break;
    }

    t0 = t1;
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

  /**
   * Fires the ball and pre-computes all its future collisions and path.
   *
   * @param ball The initial state of the ball being fired
   */
  internalFire(ball: MovingBall): void {
    const fixedPoints = [...computeFixedPoints(
      {...ball, velocity: Constants.DEFAULT_BALL_VELOCITY, acceleration: Constants.DEFAULT_BALL_ACCELERATION},
      this.staticBalls
    )];

    console.group('Fixed points');
    for (const {t, x, y, angle, velocity, obstacles: obstacles} of fixedPoints) {
      for (const obstacle of obstacles) {
        console.debug(`Collision with ${ppObstacle(obstacle)}`);
      }
      console.debug(`Δt:${t.toFixed(3)} ${directionalArrow(Math.cos(angle) * velocity, Math.sin(angle) * velocity)} x:${x.toFixed(3)} y:${y.toFixed(3)} v:${velocity.toFixed(3)} angle:${ppAngle(angle)}`);
    }
    console.groupEnd();

    this.currentBall = new MathBall(
      ball.radius,
      ball.x, ball.y,
      fixedPoints,
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
      console.log(`Last fixed point t:${fp.t.toFixed(3)} x:${fp.x.toFixed(3)} y:${fp.y.toFixed(3)} ${directionalArrow(Math.cos(fp.angle), Math.sin(fp.angle))}`);

      let hasHitBottomWall = fp.obstacles.some(({type, value}) => {
        return type === 'wall' && value.wall === GameWalls.bottom;
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
