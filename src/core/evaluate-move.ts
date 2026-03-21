import { StaticBall, makeCannonBall } from "./ball";
import { computeFixedPoints } from "./collision-solver/fixed-points";
import { maxBy } from "./utils";

/**
 * Evaluates a single move at a given angle.
 */
export function evaluateMove(
  staticBalls: Array<StaticBall>,
  angle: number,
  {
    steps = [180],
    criteria = 'hits',
    stats,
  }: {
    steps?: Array<number>,
    criteria?: 'score' | 'hits';
    stats?: { value: number };
  } = {}
) {
  if (stats) stats.value += 1;

  const ball = makeCannonBall({ angle });
  const { score, hits, gameover, out, staticBalls: nextStaticBalls }
    = computeFixedPoints(ball, staticBalls, { epsilon: 1e-10 });

  let reward = criteria === 'hits' ? hits : score;

  if (gameover) {
    reward -= 100000; // Less heavy penalty for gameover
  } else if (out) {
    reward -= 1000000; // Heavy penalty for out
  } else {
    if (steps.length > 1) {
      const result = findBestMove(nextStaticBalls, { steps: steps.slice(1), criteria, stats });
      reward += result.reward;
    }
  }

  return { reward, staticBalls: nextStaticBalls };
}

/**
 * Evaluates all possible moves for a given board state.
 */
export function evaluateMoves(
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
): Array<{ angle: number; reward: number; staticBalls: Array<StaticBall> }> {
  const moves: Array<{ angle: number; reward: number; staticBalls: Array<StaticBall> }> = [];

  // Scan angles from 0 to PI
  const numSteps = steps[0];
  const stepAngle = Math.PI / (numSteps - 1);

  for (let i = 0; i < numSteps; ++i) {
    const angle = i * stepAngle;
    const { reward, staticBalls: nextStaticBalls } =
      evaluateMove(staticBalls, angle, { steps: steps.slice(1), criteria, stats });

    moves.push({ angle, reward, staticBalls: nextStaticBalls });
  }

  return moves;
}

/**
 * Finds the best move for a given board state.
 */
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
): { angle: number; reward: number; staticBalls: Array<StaticBall> } {
  const moves = evaluateMoves(staticBalls, { steps, criteria, stats });

  const best = maxBy(moves, m => m.reward);
  return best.item;
}
