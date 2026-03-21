import { StaticBall, makeCannonBall } from "./ball";
import { computeFixedPoints, computeNextStaticBalls } from "./collision-solver/fixed-points";
import { maxBy, Simplify } from "./utils";

export interface EvaluatedMove {
  reward: number;
  finalX: number;
  finalY: number;
  remainingBalls: StaticBall[];
  nextStaticBalls?: StaticBall[];
}

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
): EvaluatedMove {
  if (stats) stats.value += 1;

  const ball = makeCannonBall({ angle });
  const { score, hits, gameover, out, finalX, finalY, staticBalls: remainingBalls }
    = computeFixedPoints(ball, staticBalls, {
      epsilon: 1e-10,
      includeFixedPoints: false,
    });

  let nextStaticBalls: Array<StaticBall> | undefined = undefined;

  let reward = criteria === 'hits' ? hits : score;

  if (gameover) {
    reward -= 100000; // Less heavy penalty for gameover
  } else if (out) {
    reward -= 1000000; // Heavy penalty for out
  } else {
    if (steps.length > 0) {
      nextStaticBalls = computeNextStaticBalls({ x: finalX, y: finalY, out }, remainingBalls);

      const result = findBestMove(nextStaticBalls, { steps, criteria, stats });
      reward += result.reward;
    }
  }

  return { reward, finalX, finalY, remainingBalls, nextStaticBalls };
}

export type EvaluatedMoveWithAngle = Simplify<{ angle: number; } & EvaluatedMove>;

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
): Array<EvaluatedMoveWithAngle> {
  const moves: Array<EvaluatedMoveWithAngle> = [];

  // Scan angles from 0 to PI
  const numSteps = steps[0];
  const stepAngle = Math.PI / (numSteps - 1);

  for (let i = 0; i < numSteps; ++i) {
    const angle = i * stepAngle;
    const result = {
      angle,
      ...evaluateMove(staticBalls, angle, { steps: steps.slice(1), criteria, stats }),
    };

    moves.push(result);
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
): EvaluatedMoveWithAngle {
  const moves = evaluateMoves(staticBalls, { steps, criteria, stats });

  const best = maxBy(moves, m => m.reward);
  return best.item;
}
