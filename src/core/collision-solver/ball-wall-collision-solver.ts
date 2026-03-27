import { MovingBall } from "../ball";
import { Angle, solveQuadraticInPlace } from "../utils";
import { Collision, WallObstacle, findImminentCollisions } from "./collision-utils";

export interface Wall {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  angle: Angle;
}

export interface WallSide extends Wall {
  sigma: 1 | -1;
}

const ROOTS = new Float64Array(2);

export function computeCollisionWithWallSide(
  { x, y, angle, velocity, acceleration, radius }: MovingBall,
  { x0, y0, sigma, angle: alpha }: WallSide,
  t0: number, tMax: number,
  { epsilon = 1e-5 }: { epsilon?: number } = {}
): number | undefined {
  const sinAlphaBeta = Math.sin(alpha.value - angle);
  if (Math.abs(sinAlphaBeta) <= epsilon) {
    // Parallel lines.
    // TODO It might always collide, return t:undefined?
    return;
  }

  const c0 = (x - x0) * alpha.sin - (y - y0) * alpha.cos;

  const count = solveQuadraticInPlace(0.5 * acceleration * sinAlphaBeta, velocity * sinAlphaBeta, c0 - sigma * radius, ROOTS, epsilon);

  let minT = undefined;
  for (let i = 0; i < count; i++) {
    const t = ROOTS[i];
    if (t >= t0 && t <= tMax) {
      if (minT === undefined || t < minT) {
        minT = t;
      }
    }
  }
  return minT;
}

export function computeCollisionWithWall(
  { x, y, angle: beta, velocity, acceleration, radius }: MovingBall,
  { x0, y0, angle: alpha }: Wall,
  t0: number, tMax: number,
  { epsilon = 1e-5 }: { epsilon?: number; } = {}
): { t: number; sigma: 1 | -1; } | undefined {
  const sinAlphaBeta = Math.sin(alpha.value - beta);
  if (Math.abs(sinAlphaBeta) <= epsilon) {
    // Parallel lines.
    // TODO It might always collide, return t:undefined?
    return;
  }

  const c0 = (x - x0) * alpha.sin - (y - y0) * alpha.cos;

  let minT = undefined;
  let minSigma: 1 | -1 = 1;

  for (const sigma of [-1, 1] as const) {
    const count = solveQuadraticInPlace(0.5 * acceleration * sinAlphaBeta, velocity * sinAlphaBeta, c0 - sigma * radius, ROOTS, epsilon);
    for (let i = 0; i < count; i++) {
      const t = ROOTS[i];
      if (t >= t0 && t <= tMax) {
        if (minT === undefined || t < minT) {
          minT = t;
          minSigma = sigma;
        }
      }
    }
  }

  if (minT !== undefined) {
    return { t: minT, sigma: minSigma };
  }
}

export function computeCollisionsWithWalls<W extends WallSide>(
  ball: MovingBall,
  walls: Array<W>,
  { epsilon = 1e-5 }: { epsilon?: number } = {}
): Array<Collision<WallObstacle<W>>> {
  const tMax = -ball.velocity / ball.acceleration;

  const collisions: Array<Collision<WallObstacle<W>>> = [];
  for (let i = 0; i < walls.length; i++) {
    const wall = walls[i];
    const collision = computeCollisionWithWallSide(ball, wall, epsilon, tMax, { epsilon });

    if (collision !== undefined) {
      collisions.push({ t: collision, obstacle: { type: 'wall' as const, value: wall } });
    }
  }

  return findImminentCollisions(collisions, { epsilon });
}
