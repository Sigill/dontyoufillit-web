import { StaticBall, makeCannonBall } from "../core/ball";
import { computeFixedPoints } from "../core/collision-solver/fixed-points";


export function findBestMove(
  staticBalls: Array<StaticBall>,
  {
    steps = [180],
    criteria = 'hits',
    stats,
  }: {
    steps?: Array<number>,
    criteria?: 'score' | 'hits';
    stats?: { value: number };
  } = {}
): { angle: number; reward: number } {
  let bestAngle = Math.PI / 2;
  let maxReward = -Infinity;

  // Scan angles from 0 to PI
  const numSteps = steps[0];
  const stepAngle = Math.PI / (numSteps - 1);

  for (let i = 0; i < numSteps; ++i) {
    if (stats) stats.value += 1;

    const angle = i * stepAngle;
    const ball = makeCannonBall({ angle });
    const { score: score, hits, gameover, out, staticBalls: nextStaticBalls }
      = computeFixedPoints(ball, staticBalls, { epsilon: 1e-10 });

    let reward = criteria === 'hits' ? hits : score;

    if (out) {
      reward -= 1000000; // Heavy penalty for out
    } else if (gameover) {
      reward -= 100000; // Less heavy penalty for gameover
    } else {
      if (steps.length > 1) {
        const result = findBestMove(nextStaticBalls, { steps: steps.slice(1), criteria, stats });
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
