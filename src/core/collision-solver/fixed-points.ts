import { MovingBall, StaticBall, BallState } from "../ball";
import { GameWalls } from "../ball-engine/walls";
import { computeExpandedRadius } from "../static-ball";
import { normalizeRadian } from "../utils";
import { computeCollisionsWithBalls } from "./ball-ball-collision-solver";
import { computeCollisionsWithWalls } from "./ball-wall-collision-solver";
import { BallObstacle, Collision, findImminentCollisions, WallObstacle } from "./collision-utils";

export type Obstacle = WallObstacle | BallObstacle<StaticBall>;

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
  const candidateWalls = [GameWalls.top, GameWalls.right, GameWalls.left];

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
 * @param staticBalls The list of static balls (obstacles) in the game.
 * @param options Configuration options.
 * @param options.epsilon The precision for collision detection.
 * @returns A generator that yields the state of the ball at each significant event (collision or stop).
 */
export function computeFixedPoints(
  ball: MovingBall,
  staticBalls: Array<StaticBall>,
  { epsilon = 1e-5 }: { epsilon?: number } = {},
): {
  fixedPoints: Array<BallState & { obstacles: Array<Obstacle>; }>;
  hits: number;
  score: number;
  gameover: boolean;
  out: boolean;
  staticBalls: Array<StaticBall>;
} {
  let { x, y, velocity, angle} = ball;

  let t0 = 0;
  const tMax = -ball.velocity / ball.acceleration;

  const fixedPoints: Array<BallState & { obstacles: Array<Obstacle>; }> = [
    { t: t0, x, y, velocity, angle, acceleration: ball.acceleration, obstacles: [] }
  ];
  let hits = 0;
  let score = 0;
  let gameover = false;
  let out = false;

  const shadowStaticBalls = staticBalls.map<StaticBall & { sourceBall: StaticBall }>(
    b => ({ ...b, sourceBall: b })
  );

  while (true) {
    const ballState = { x, y, angle, velocity, acceleration: ball.acceleration, radius: ball.radius };
    const wallCollisions = computeCollisionsWithGameWalls(ballState, { epsilon });
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

    x += 1/2 * Math.cos(angle) * ball.acceleration * deltaT**2 + Math.cos(angle) * velocity * deltaT;
    y += 1/2 * Math.sin(angle) * ball.acceleration * deltaT**2 + Math.sin(angle) * velocity * deltaT;
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

    fixedPoints.push({ t: t1, x, y, angle, velocity, acceleration: ball.acceleration, obstacles });

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

  const nextStaticBalls = shadowStaticBalls.map(({ x, y, radius, counter }) => ({ x, y, radius, counter }));

  if (!out) {
    nextStaticBalls.push({
      counter: 3,
      radius: computeExpandedRadius({ x, y }, shadowStaticBalls),
      x, y,
    });
  }

  return {
    fixedPoints,
    hits,
    score: score,
    gameover,
    out,
    staticBalls: nextStaticBalls,
  };
}
