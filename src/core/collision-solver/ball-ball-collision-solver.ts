import { BallGeometry, MovingBall } from "../ball";
import { solveQuadraticInPlace } from "../utils";
import { Collision, BallObstacle } from "./collision-utils";


const ROOTS1 = new Float64Array(2);
const ROOTS2 = new Float64Array(2);

export function computeCollisionWithBall(
  ball: MovingBall,
  staticBall: BallGeometry,
  t0: number, tMax: number,
  { epsilon = 1e-5 }: { epsilon?: number } = {}
): number | undefined {
  const dx = ball.x - staticBall.x;
  const dy = ball.y - staticBall.y;
  const k = dx * ball.angle.cos + dy * ball.angle.sin;
  const sumRadii = ball.radius + staticBall.radius;

  // (-dx, -dy) is the vector from the moving ball to the static ball.
  // -k is the projection of this vector on the moving ball's trajectory vector.
  // If -k is negative, the static ball is behind the moving ball, so it cannot be hit.
  if (-k <= 0) {
    return undefined;
  }

  // l is the projection on a vector perpendicular to the trajectory (only the amplitude matters, not the direction).
  // If |l| is greater than the sum of the radii, the ball are too far apart to hit each other.
  const l = Math.abs(dx * -ball.angle.sin + dy * ball.angle.cos);
  if (l > sumRadii) {
    return undefined;
  }

  const count1 = solveQuadraticInPlace(1, 2 * k, (dx * dx + dy * dy) - sumRadii ** 2, ROOTS1, epsilon);

  let minT = undefined;
  for (let i = 0; i < count1; i++) {
    const root1 = ROOTS1[i];
    const count2 = solveQuadraticInPlace(0.5 * ball.acceleration, ball.velocity, -root1, ROOTS2, epsilon);
    for (let j = 0; j < count2; j++) {
      const t = ROOTS2[j];
      if (t >= t0 && t <= tMax) {
        if (minT === undefined || t < minT) {
          minT = t;
        }
      }
    }
  }

  return minT;
}

export function computeCollisionsWithBalls<B extends BallGeometry>(
  ball: MovingBall,
  otherBalls: Array<B>,
  { epsilon = 1e-5 }: { epsilon?: number } = {}
): Array<Collision<BallObstacle<B>>> {
  const tMax = -ball.velocity / ball.acceleration;

  const collisions = [];
  for (let i = 0; i < otherBalls.length; i++) {
    const otherBall = otherBalls[i];
    const t = computeCollisionWithBall(ball, otherBall, epsilon, tMax, { epsilon });
    if (t !== undefined) {
      collisions.push({ t, obstacle: { type: 'ball' as const, value: otherBall } });
    }
  }

  return collisions;
}
