import { BallGeometry, MovingBall } from "../ball";
import { solveQuadratic } from "../utils";
import { Collision, BallObstacle } from "./collision-utils";


export function computeCollisionWithBall(
  ball: MovingBall,
  otherBall: BallGeometry,
  t0: number, tMax: number,
  {
    cosAngle = Math.cos(ball.angle),
    sinAngle = Math.sin(ball.angle),
    epsilon = 1e-5
  }: { cosAngle?: number, sinAngle?: number, epsilon?: number } = {}
): number | undefined {
  const dx = ball.x - otherBall.x;
  const dy = ball.y - otherBall.y;
  const k = dx * cosAngle + dy * sinAngle;

  const roots1 = solveQuadratic(1, 2 * k, dx * dx + dy * dy - (ball.radius + otherBall.radius) ** 2);

  let minT = undefined;
  for (let i = 0; i < roots1.length; i++) {
    const root1 = roots1[i];
    const roots2 = solveQuadratic(0.5 * ball.acceleration, ball.velocity, -root1, epsilon);
    for (let j = 0; j < roots2.length; j++) {
      const t = roots2[j];
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
  {
    cosAngle = Math.cos(ball.angle),
    sinAngle = Math.sin(ball.angle),
    epsilon = 1e-5
  }: { cosAngle?: number, sinAngle?: number, epsilon?: number } = {}
): Array<Collision<BallObstacle<B>>> {
  const tMax = -ball.velocity / ball.acceleration;

  const collisions = [];
  for (let i = 0; i < otherBalls.length; i++) {
    const otherBall = otherBalls[i];
    const t = computeCollisionWithBall(ball, otherBall, epsilon, tMax, { cosAngle, sinAngle, epsilon });
    if (t !== undefined) {
      collisions.push({ t, obstacle: { type: 'ball' as const, value: otherBall } });
    }
  }

  return collisions;
}
