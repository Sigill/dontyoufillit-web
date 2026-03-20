import { StaticBall, makeCannonBall } from "./ball";
import { computeFixedPoints, computeNextStaticBalls } from "./collision-solver/fixed-points";
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
  const { score, hits, gameover, out, finalX, finalY, staticBalls: remainingBalls }
    = computeFixedPoints(ball, staticBalls, {
      epsilon: 1e-10,
      includeFixedPoints: false,
    });

  let nextStaticBalls: Array<StaticBall> | undefined = undefined;
  if (steps.length > 0 && !gameover && !out) {
    nextStaticBalls = computeNextStaticBalls({ x: finalX, y: finalY, out }, remainingBalls);
  }

  let reward = criteria === 'hits' ? hits : score;

  if (gameover) {
    reward -= 100000; // Less heavy penalty for gameover
  } else if (out) {
    reward -= 1000000; // Heavy penalty for out
  } else {
    if (steps.length > 0 && nextStaticBalls) {
      const result = findBestMove(nextStaticBalls, { steps, criteria, stats });
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
): Array<{ angle: number; reward: number; staticBalls?: Array<StaticBall> }> {
  const moves: Array<{ angle: number; reward: number; staticBalls?: Array<StaticBall> }> = [];

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
  const bestMove = best.item;

  if (bestMove.staticBalls === undefined) {
    // Re-compute static balls for the best move if it was skipped during search.
    const ball = makeCannonBall({ angle: bestMove.angle });
    const { finalX, finalY, out, staticBalls: remainingBalls } = computeFixedPoints(ball, staticBalls, { epsilon: 1e-10, includeFixedPoints: false });
    bestMove.staticBalls = computeNextStaticBalls({ x: finalX, y: finalY, out }, remainingBalls);
  }

  return bestMove as { angle: number; reward: number; staticBalls: Array<StaticBall> };
}
