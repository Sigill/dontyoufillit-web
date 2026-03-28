import { MovingBall, StaticBall, BallState } from "../ball";
import { GameWalls } from "../ball-engine/walls";
import { Angle, normalizeRadian, Simplify, updateAngle } from "../utils";
import { computeCollisionWithBall } from "./ball-ball-collision-solver";
import { computeCollisionWithWallSide, WallSide } from "./ball-wall-collision-solver";
import { BallObstacle, WallObstacle } from "./collision-utils";

export type Obstacle = WallObstacle | BallObstacle<StaticBall>;


export interface FixedPointsOptions {
  epsilon?: number;
  includeFixedPoints?: boolean;
}

interface FinalState {
  finalX: number;
  finalY: number;
  remainingStaticBalls: Array<StaticBall>;
}

export interface FixedPoints {
  fixedPoints?: Array<Simplify<BallState & { obstacles: Array<Obstacle>; }>>;
  hits: number;
  score: number;
  gameover: boolean;
  out: boolean;
  state?: FinalState;
};

/**
 * Computes the key points in the ball's trajectory (collisions, start, end).
 *
 * @param ball The initial state of the ball.
 * @param staticBalls The list of static balls (obstacles) in the game.
 * @param options Configuration options.
 * @param options.epsilon The precision for collision detection.
 * @returns A generator that yields the state of the ball at each significant event (collision or stop).
 */
export function computeFixedPoints(
  ball: MovingBall,
  staticBalls: Array<StaticBall>,
  options?: FixedPointsOptions & { includeState?: false }
): Omit<FixedPoints, 'state'>;
export function computeFixedPoints(
  ball: MovingBall,
  staticBalls: Array<StaticBall>,
  options: FixedPointsOptions & { includeState?: boolean }
): FixedPoints;
export function computeFixedPoints(
  ball: MovingBall,
  staticBalls: Array<StaticBall>,
  {
    epsilon = 1e-5,
    includeFixedPoints = false,
    includeState = false,
  }: FixedPointsOptions & { includeState?: boolean } = {},
): FixedPoints {
  let { x, y, velocity } = ball;
  const angle: Angle = { ...ball.angle };

  let t0 = 0;
  const tMax = -ball.velocity / ball.acceleration;

  const fixedPoints: FixedPoints['fixedPoints'] = includeFixedPoints
    ? [{ t: t0, x, y, velocity, angle: { ...angle }, acceleration: ball.acceleration, obstacles: [] }]
    : undefined;
  let hits = 0;
  let score = 0;
  let gameover = false;
  let out = false;

  const counters = new Int32Array(staticBalls.length);
  for (let i = 0; i < staticBalls.length; i++) {
    counters[i] = staticBalls[i].counter;
  }

  const ballRadius = ball.radius;
  const ballAcceleration = ball.acceleration;

  while (true) {
    const ballState = { x, y, angle, velocity, acceleration: ballAcceleration, radius: ballRadius };

    let minT = tMax - t0;
    let winnerWall: WallSide | undefined = undefined;
    let winnerBallIndex: number = -1;
    let tie = false;
    const computeParams = { epsilon };

    // Walls
    if (angle.cos > 0) {
      const t = computeCollisionWithWallSide(ballState, GameWalls.right, epsilon, minT + epsilon, computeParams);
      if (t !== undefined) {
        if (t < minT - epsilon) {
          minT = t;
          winnerWall = GameWalls.right;
          tie = false;
        } else if (t <= minT + epsilon) {
          tie = true;
        }
      }
    } else if (angle.cos < 0) {
      const t = computeCollisionWithWallSide(ballState, GameWalls.left, epsilon, minT + epsilon, computeParams);
      if (t !== undefined) {
        if (t < minT - epsilon) {
          minT = t;
          winnerWall = GameWalls.left;
          tie = false;
        } else if (t <= minT + epsilon) {
          tie = true;
        }
      }
    }

    if (angle.sin > 0) {
      const t = computeCollisionWithWallSide(ballState, GameWalls.top, epsilon, minT + epsilon, computeParams);
      if (t !== undefined) {
        if (t < minT - epsilon) {
          minT = t;
          winnerWall = GameWalls.top;
          tie = false;
        } else if (t <= minT + epsilon) {
          tie = true;
        }
      }
    } else if (angle.sin < 0 && y > ballRadius) {
      const t = computeCollisionWithWallSide(ballState, GameWalls.bottom, epsilon, minT + epsilon, computeParams);
      if (t !== undefined) {
        if (t < minT - epsilon) {
          minT = t;
          winnerWall = GameWalls.bottom;
          tie = false;
        } else if (t <= minT + epsilon) {
          tie = true;
        }
      }
    }

    // Balls
    for (let i = 0; i < staticBalls.length; i++) {
      if (counters[i] <= 0) continue;
      const b = staticBalls[i];
      const t = computeCollisionWithBall(ballState, b, epsilon, minT + epsilon, computeParams);
      if (t !== undefined) {
        if (t < minT - epsilon) {
          minT = t;
          winnerBallIndex = i;
          winnerWall = undefined;
          tie = false;
        } else if (t <= minT + epsilon) {
          tie = true;
        }
      }
    }

    if (tie) {
      console.error("Collision against multiple objects", { ball, staticBalls });
      throw new Error('Collision against multiple objects');
    }

    const t1 = winnerWall === undefined && winnerBallIndex === -1 ? tMax : t0 + minT;
    const deltaT = t1 - t0;

    const movement = 0.5 * ballAcceleration * deltaT ** 2 + velocity * deltaT;
    x += angle.cos * movement;
    y += angle.sin * movement;
    velocity = (winnerWall === undefined && winnerBallIndex === -1)
      ? 0 // Avoid rounding errors.
      : velocity + ballAcceleration * deltaT;

    if (winnerWall !== undefined || winnerBallIndex !== -1) {
      if (winnerWall !== undefined) {
        updateAngle(angle, normalizeRadian(2 * winnerWall.angle.value - angle.value));
      } else if (winnerBallIndex !== -1) {
        counters[winnerBallIndex] -= 1;
        hits += 1;
        if (counters[winnerBallIndex] === 0) {
          score += 1;
        }

        const b = staticBalls[winnerBallIndex];
        const theta = Math.atan2(y - b.y, x - b.x);
        updateAngle(angle, normalizeRadian(2 * (theta + Math.PI / 2) - angle.value));
      }
    }

    if (fixedPoints) {
      const obstacles: Obstacle[] = [];
      if (winnerWall) obstacles.push({ type: 'wall', value: winnerWall });
      if (winnerBallIndex !== -1) obstacles.push({ type: 'ball', value: staticBalls[winnerBallIndex] });
      fixedPoints.push({ t: t1, x, y, angle: { ...angle }, velocity, acceleration: ballAcceleration, obstacles });
    }

    // Stop if:
    if (
      (winnerWall === undefined && winnerBallIndex === -1)
      ||
      (winnerWall !== undefined && winnerWall === GameWalls.bottom)
      ||
      (winnerBallIndex !== -1 && y < ballRadius && angle.sin < 0)
    ) {
      gameover = (winnerWall !== undefined || winnerBallIndex !== -1);
      out = (winnerWall === undefined && winnerBallIndex === -1) && y <= 0;
      break;
    }

    t0 = t1;
  }

  const result = {
    fixedPoints,
    hits,
    score,
    gameover,
    out,
  };

  if (includeState) {
    const remainingStaticBalls: StaticBall[] = [];
    for (let i = 0; i < staticBalls.length; i++) {
      if (counters[i] > 0) {
        remainingStaticBalls.push({ ...staticBalls[i], counter: counters[i] });
      }
    }
    return {
      ...result,
      state: {
        remainingStaticBalls,
        finalX: x,
        finalY: y,
      },
    };
  }

  return result;
}
