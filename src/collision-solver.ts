import { solveQuadratic } from "./utils";


export interface Wall {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface StaticBall {
  radius: number;
  x: number;
  y: number;
}

export interface MovingBall extends StaticBall {
  angle: number;
  velocity: number;
  acceleration: number;
}

export interface WallObstacle<W extends Wall = Wall> {
  type: 'wall';
  value: { wall: W; sigma: number };
}

export interface BallObstacle<B extends StaticBall = StaticBall> {
  type: 'ball';
  value: B;
};

export interface Collision<O> {
  t: number;
  obstacle: O;
}

export function computeCollisionWithWall(
  {x0: x0, y0: y0, x1, y1}: Wall,
  {x, y, angle: beta, velocity, acceleration, radius}: MovingBall,
  t0: number, tMax: number,
  { epsilon = 1e-5 }: { epsilon?: number } = {}
): { t: number; sigma: number; } | undefined {
  const alpha = Math.atan2(y1 - y0, x1 - x0);

  if (Math.abs(Math.sin(alpha - beta)) <= epsilon) {
    // Parallel lines.
    // TODO It might always collide, return t:undefined?
    return;
  }

  const Delta = Math.sin(alpha - beta);
  const c0 = (x - x0) * Math.sin(alpha) - (y - y0) * Math.cos(alpha);

  function* gen() {
    for (const sigma of [-1, 1]) {
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
}

export function computeCollisionWithBall(
  ball: MovingBall,
  otherBall: StaticBall,
  t0: number, tMax: number,
  { epsilon = 1e-5 }: { epsilon?: number } = {}
): number | undefined {
  function* gen() {
    const k = (ball.x - otherBall.x) * Math.cos(ball.angle) + (ball.y - otherBall.y) * Math.sin(ball.angle);
    const roots1 = solveQuadratic(1, 2 * k, Math.hypot(ball.x - otherBall.x, ball.y - otherBall.y) ** 2 - (ball.radius + otherBall.radius) ** 2);
    for (const root1 of roots1) {
      for (const t of solveQuadratic(1 / 2 * ball.acceleration, ball.velocity, -root1, epsilon)) {
        if (t >= t0 && t <= tMax) {
          yield t;
        }
      }
    }
  }

  const collisions = [...gen()];
  if (collisions.length > 0) {
    return collisions.reduce((a, b) => a < b ? a : b);
  }
}

export function findImminentCollisions<O>(collisions: Array<Collision<O>>, { epsilon = 1e-5 }: { epsilon?: number } = {}): Array<Collision<O>> {
  if (collisions.length <= 1) {
    return collisions;
  }

  return collisions
    .sort((a, b) => a.t - b.t)
    .filter(({ t }, _, [first]) => t <= first.t + epsilon);
}

export function computeCollisionsWithWalls<W extends Wall>(
  ball: MovingBall,
  walls: Array<W>,
  { epsilon = 1e-5 }: { epsilon?: number } = {}
): Array<Collision<WallObstacle<W>>> {
  function* gen() {
    const tMax = -ball.velocity / ball.acceleration;

    for (const wall of walls) {
      const collision = computeCollisionWithWall(wall, ball, epsilon, tMax, { epsilon });

      if (collision !== undefined) {
        yield { t: collision.t, obstacle: { type: 'wall' as const, value: { wall, sigma: collision.sigma } } };
      }
    }
  }

  return findImminentCollisions([...gen()], { epsilon });
}

export function computeCollisionsWithBalls<B extends StaticBall>(
  ball: MovingBall,
  otherBalls: Array<B>,
  { epsilon = 1e-5 }: { epsilon?: number } = {}
): Array<Collision<BallObstacle<B>>> {
  const tMax = -ball.velocity / ball.acceleration;

  function* gen() {
    for (const otherBall of otherBalls) {
      const t = computeCollisionWithBall(ball, otherBall, epsilon, tMax, { epsilon });
      if (t !== undefined) {
        yield { t, obstacle: { type: 'ball' as const, value: otherBall } };
      }
    }
  }

  return findImminentCollisions([...gen()], { epsilon });
}
