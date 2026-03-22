import { MovingBall } from "../ball";
import { solveQuadratic } from "../utils";
import { Collision, WallObstacle, findImminentCollisions } from "./collision-utils";

export interface Wall {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface WallSide extends Wall {
  sigma: 1 | -1;
}

export function computeCollisionWithWallSide(
  { x, y, angle, velocity, acceleration, radius }: MovingBall,
  { x0, y0, x1, y1, sigma }: WallSide,
  t0: number, tMax: number,
  {
    cosAngle = Math.cos(angle),
    sinAngle = Math.sin(angle),
    epsilon = 1e-5
  }: { cosAngle?: number, sinAngle?: number, epsilon?: number } = {}
): number | undefined {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const alpha = Math.atan2(dy, dx);

  const sinAlpha = Math.sin(alpha);
  const cosAlpha = Math.cos(alpha);
  // sin(a - b) = sin(a)cos(b) - cos(a)sin(b)
  const sinAlphaBeta = sinAlpha * cosAngle - cosAlpha * sinAngle;
  if (Math.abs(sinAlphaBeta) <= epsilon) {
    // Parallel lines.
    // TODO It might always collide, return t:undefined?
    return;
  }

  const c0 = (x - x0) * sinAlpha - (y - y0) * cosAlpha;

  const collisions = solveQuadratic(0.5 * acceleration * sinAlphaBeta, velocity * sinAlphaBeta, c0 - sigma * radius, epsilon);

  let minT = undefined;
  for (let i = 0; i < collisions.length; i++) {
    const t = collisions[i];
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
  { x0, y0, x1, y1 }: Wall,
  t0: number, tMax: number,
  { epsilon = 1e-5 }: { epsilon?: number; } = {}
): { t: number; sigma: 1 | -1; } | undefined {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const alpha = Math.atan2(dy, dx);

  const sinAlphaBeta = Math.sin(alpha - beta);
  if (Math.abs(sinAlphaBeta) <= epsilon) {
    // Parallel lines.
    // TODO It might always collide, return t:undefined?
    return;
  }

  const sinAlpha = Math.sin(alpha);
  const cosAlpha = Math.cos(alpha);
  const c0 = (x - x0) * sinAlpha - (y - y0) * cosAlpha;

  let minT = undefined;
  let minSigma: 1 | -1 = 1;

  for (const sigma of [-1, 1] as const) {
    const roots = solveQuadratic(0.5 * acceleration * sinAlphaBeta, velocity * sinAlphaBeta, c0 - sigma * radius, epsilon);
    for (let i = 0; i < roots.length; i++) {
      const t = roots[i];
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
  {
    cosAngle = Math.cos(ball.angle),
    sinAngle = Math.sin(ball.angle),
    epsilon = 1e-5
  }: { cosAngle?: number, sinAngle?: number, epsilon?: number } = {}
): Array<Collision<WallObstacle<W>>> {
  const tMax = -ball.velocity / ball.acceleration;

  const collisions: Array<Collision<WallObstacle<W>>> = [];
  for (let i = 0; i < walls.length; i++) {
    const wall = walls[i];
    const collision = computeCollisionWithWallSide(ball, wall, epsilon, tMax, { cosAngle, sinAngle, epsilon });

    if (collision !== undefined) {
      collisions.push({ t: collision, obstacle: { type: 'wall' as const, value: wall } });
    }
  }

  return findImminentCollisions(collisions, { epsilon });
}
