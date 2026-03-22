import { MovingBall, StaticBall, BallState } from "../ball";
import { GameWalls } from "../ball-engine/walls";
import { normalizeRadian, Simplify } from "../utils";
import { computeCollisionsWithBalls } from "./ball-ball-collision-solver";
import { computeCollisionsWithWalls } from "./ball-wall-collision-solver";
import { BallObstacle, Collision, findImminentCollisions, WallObstacle } from "./collision-utils";

export type Obstacle = WallObstacle | BallObstacle<StaticBall>;

const CANDIDATE_WALLS_DEFAULT = [GameWalls.top, GameWalls.right, GameWalls.left];
const CANDIDATE_WALLS_WITH_BOTTOM = [GameWalls.top, GameWalls.right, GameWalls.left, GameWalls.bottom];

function computeCollisionsWithGameWalls(
  ball: {
    radius: number;
    x: number;
    y: number;
    angle: number;
    velocity: number;
    acceleration: number;
  },
  {
    cosAngle = Math.cos(ball.angle),
    sinAngle = Math.sin(ball.angle),
    epsilon = 1e-5
  }: { cosAngle?: number, sinAngle?: number, epsilon?: number } = {}
): Array<Collision<WallObstacle>> {
  // Only consider the bottom border if above it.
  const candidateWalls = ball.y > ball.radius ? CANDIDATE_WALLS_WITH_BOTTOM : CANDIDATE_WALLS_DEFAULT;

  return computeCollisionsWithWalls(ball, candidateWalls, { cosAngle, sinAngle, epsilon });
}

export interface FixedPoints {
  fixedPoints?: Array<Simplify<BallState & { obstacles: Array<Obstacle>; }>>;
  hits: number;
  score: number;
  gameover: boolean;
  out: boolean;
  finalX: number;
  finalY: number;
  staticBalls: Array<StaticBall>;
}

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
  {
    epsilon = 1e-5,
    includeFixedPoints = true,
  }: {
    epsilon?: number;
    includeFixedPoints?: boolean;
  } = {},
): FixedPoints {
  let { x, y, velocity, angle } = ball;

  let t0 = 0;
  const tMax = -ball.velocity / ball.acceleration;

  const fixedPoints: FixedPoints['fixedPoints'] = includeFixedPoints
    ? [{ t: t0, x, y, velocity, angle, acceleration: ball.acceleration, obstacles: [] }]
    : undefined;
  let hits = 0;
  let score = 0;
  let gameover = false;
  let out = false;

  const shadowStaticBalls = staticBalls.map<StaticBall & { sourceBall: StaticBall }>(
    b => ({ ...b, sourceBall: b })
  );

  while (true) {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    const ballState = { x, y, angle, velocity, acceleration: ball.acceleration, radius: ball.radius };
    const wallCollisions = computeCollisionsWithGameWalls(ballState, { cosAngle, sinAngle, epsilon });
    const ballCollisions = shadowStaticBalls.length === 0 ? [] : computeCollisionsWithBalls(ballState, shadowStaticBalls, { epsilon });
    const collisions = findImminentCollisions<WallObstacle | BallObstacle<StaticBall & { sourceBall: StaticBall; }>>(
      [ ...wallCollisions, ...ballCollisions ],
      {epsilon}
    );

    if (collisions.length > 1) { // TODO handle collision against multiple objects.
      console.error("Collision against multiple objects", { ball, staticBalls });
      throw new Error('Collision against multiple objects');
    }

    for (const collision of collisions) {
      collision.t += t0;
    }

    const collision = collisions.at(0);

    const t1 = collision?.t ?? tMax;
    const deltaT = t1 - t0;

    const movement = 0.5 * ball.acceleration * deltaT ** 2 + velocity * deltaT;
    x += cosAngle * movement;
    y += sinAngle * movement;
    velocity = collision === undefined
      ? 0 // Avoid rounding errors.
      : velocity + ball.acceleration * deltaT;

    const obstacles = [];

    if (collision !== undefined) {
      if (collision.obstacle.type === 'wall') {
        const wall = collision.obstacle.value;
        const wallAngle = Math.atan2(wall.y1 - wall.y0, wall.x1 - wall.x0);

        angle = 2 * wallAngle - angle;

        obstacles.push(collision.obstacle);
      } else {
        const ball = collision.obstacle.value;

        ball.counter -= 1;
        hits += 1;
        if (ball.counter === 0) {
          shadowStaticBalls.splice(shadowStaticBalls.indexOf(ball), 1);
          score += 1;
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

    fixedPoints?.push({ t: t1, x, y, angle, velocity, acceleration: ball.acceleration, obstacles });

    // Stop if:
    if (
      // There was no collision, which means the ball has stopped.
      collision === undefined
      ||
      // The ball has collided with the bottom wall.
      (collision.obstacle.type === 'wall' && collision.obstacle.value === GameWalls.bottom)
      ||
      // The ball has hit a ball while touching with the bottom wall.
      (collision.obstacle.type === 'ball' && y < ball.radius && Math.sin(angle) < 0)
    ) {
      gameover = collision !== undefined;
      out = collision === undefined && y <= 0;
      break;
    }

    t0 = t1;
  }

  return {
    fixedPoints,
    hits,
    score,
    gameover,
    out,
    finalX: x,
    finalY: y,
    // This let the sourceBalls property  exposed.
    // It would be nice not to expose it, but setting it to undefined or event deleting it from the object seems very slow.
    staticBalls: shadowStaticBalls,
  };
}
