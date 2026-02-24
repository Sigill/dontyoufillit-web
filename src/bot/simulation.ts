import { StaticBall, makeCannonBall } from "../core/ball";
import { computeFixedPoints } from "../core/collision-solver/fixed-points";


export function findBestMove(
  staticBalls: Array<StaticBall>,
  {
    depth = 1,
    criteria = 'hits',
    stats = { value: 0 },
  }: {
    depth?: number;
    criteria?: 'score' | 'hits';
    stats?: { value: number };
  } = {}
): { angle: number; reward: number } {
  let bestAngle = Math.PI / 2;
  let maxReward = -Infinity;

  // Scan angles from 0.1 to PI - 0.1
  // Using a slightly coarser step for performance if depth > 1
  const step = depth > 1 ? 0.1 : 0.05;
  // const step = 0.1;

  for (let angle = 0.1; angle < Math.PI - 0.1; angle += step) {
    stats.value += 1;
    const ball = makeCannonBall({ angle });
    const { score: score, hits, gameover, out, staticBalls: nextStaticBalls }
      = computeFixedPoints(ball, staticBalls, { epsilon: 1e-10 });

    let reward = criteria === 'hits' ? hits : score;

    if (out) {
      reward -= 1000000; // Heavy penalty for out
    } else if (gameover) {
      reward -= 100000; // Less heavy penalty for gameover
    } else {
      if (depth > 1 && nextStaticBalls) {
        const result = findBestMove(nextStaticBalls, { depth: depth - 1, criteria, stats });
        reward += result.reward;
      }
    }

    if (reward > maxReward) {
      maxReward = reward;
      bestAngle = angle;
    }
  }

  return { angle: bestAngle, reward: maxReward };
}
