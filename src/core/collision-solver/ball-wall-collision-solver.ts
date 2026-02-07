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
  { x, y, angle: beta, velocity, acceleration, radius }: MovingBall,
  { x0, y0, x1, y1, sigma }: WallSide,
  t0: number, tMax: number,
  { epsilon = 1e-5 }: { epsilon?: number; } = {}
): number | undefined {
  const alpha = Math.atan2(y1 - y0, x1 - x0);

  if (Math.abs(Math.sin(alpha - beta)) <= epsilon) {
    // Parallel lines.
    // TODO It might always collide, return t:undefined?
    return;
  }

  const Delta = Math.sin(alpha - beta);
  const c0 = (x - x0) * Math.sin(alpha) - (y - y0) * Math.cos(alpha);

  function* gen() {
    for (const t of solveQuadratic(1 / 2 * acceleration * Delta, velocity * Delta, c0 - sigma * radius, epsilon)) {
      if (t >= t0 && t <= tMax) {
        yield t;
      }
    }
  }

  const collisions = [...gen()];
  if (collisions.length > 0) {
    return Math.min(...collisions);
  }
}

export function computeCollisionWithWall(
  { x, y, angle: beta, velocity, acceleration, radius }: MovingBall,
  { x0, y0, x1, y1 }: Wall,
  t0: number, tMax: number,
  { epsilon = 1e-5 }: { epsilon?: number; } = {}
): { t: number; sigma: 1 | -1; } | undefined {
  const alpha = Math.atan2(y1 - y0, x1 - x0);

  if (Math.abs(Math.sin(alpha - beta)) <= epsilon) {
    // Parallel lines.
    // TODO It might always collide, return t:undefined?
    return;
  }

  const Delta = Math.sin(alpha - beta);
  const c0 = (x - x0) * Math.sin(alpha) - (y - y0) * Math.cos(alpha);

  function* gen() {
    for (const sigma of [-1, 1] as const) {
      for (const t of solveQuadratic(1 / 2 * acceleration * Delta, velocity * Delta, c0 - sigma * radius, epsilon)) {
        if (t >= t0 && t <= tMax) {
          yield { t, sigma };
        }
      }
    }
  }

  const collisions = [...gen()];
  if (collisions.length > 0) {
    return collisions.reduce((a, b) => a.t < b.t ? a : b);
  }
}export function computeCollisionsWithWalls<W extends WallSide>(
  ball: MovingBall,
  walls: Array<W>,
  { epsilon = 1e-5 }: { epsilon?: number; } = {}
): Array<Collision<WallObstacle<W>>> {
  function* gen() {
    const tMax = -ball.velocity / ball.acceleration;

    for (const wall of walls) {
      const collision = computeCollisionWithWallSide(ball, wall, epsilon, tMax, { epsilon });

      if (collision !== undefined) {
        yield { t: collision, obstacle: { type: 'wall' as const, value: wall } };
      }
    }
  }

  return findImminentCollisions([...gen()], { epsilon });
}
