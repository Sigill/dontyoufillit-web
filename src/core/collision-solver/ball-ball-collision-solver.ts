import { BallGeometry, MovingBall } from "../ball";
import { solveQuadratic } from "../utils";
import { Collision, BallObstacle, findImminentCollisions } from "./collision-utils";


export function computeCollisionWithBall(
  ball: MovingBall,
  otherBall: BallGeometry,
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

export function computeCollisionsWithBalls<B extends BallGeometry>(
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
