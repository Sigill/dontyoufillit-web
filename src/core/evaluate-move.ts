import { StaticBall, makeCannonBall } from "./ball";
import { computeFixedPoints } from "./collision-solver/fixed-points";
import { computeExpandedRadius } from "./static-ball";

export interface EvaluatedMove {
  reward: number;
  state?: {
    finalX: number;
    finalY: number;
    remainingStaticBalls: StaticBall[];
  } | {
    nextStaticBalls?: StaticBall[];
  };
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
  const result = computeFixedPoints(ball, staticBalls, {
    epsilon: 1e-10,
    includeFixedPoints: false,
    includeState: steps.length > 0,
  });

  const { score, hits, gameover, out, state } = result;

  let nextStaticBalls: Array<StaticBall> | undefined = undefined;

  let reward = criteria === 'hits' ? hits : score;

  if (gameover) {
    reward -= 100000; // Less heavy penalty for gameover
  } else if (out) {
    reward -= 1000000; // Heavy penalty for out
  } else {
    if (state !== undefined) {
      const { finalX, finalY, remainingStaticBalls } = state;
      nextStaticBalls = remainingStaticBalls;
      nextStaticBalls.push({
        counter: 3,
        radius: computeExpandedRadius({ x: finalX, y: finalY }, nextStaticBalls),
        x: finalX, y: finalY,
      });

      const best = findBestMove(nextStaticBalls, { steps, criteria, stats });
      reward += best.move.reward;
    }
  }

  return {
    reward,
    state: state === undefined
      ? undefined
      : nextStaticBalls === undefined
        ? state
        : { nextStaticBalls }
  };
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
): Array<number> {
  const rewards: Array<number> = [];

  // Scan angles from 0 to PI
  const numSteps = steps[0];
  const stepAngle = Math.PI / (numSteps - 1);

  const params = { steps: steps.slice(1), criteria, stats };

  for (let i = 0; i < numSteps; ++i) {
    const angle = i * stepAngle;
    const move = evaluateMove(staticBalls, angle, params);
    rewards.push(move.reward);
  }

  return rewards;
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
): { angle: number; move: EvaluatedMove } {
  // Scan angles from 0 to PI
  const numSteps = steps[0];
  const stepAngle = Math.PI / (numSteps - 1);

  const params = { steps: steps.slice(1), criteria, stats };

  let best: { angle: number; move: EvaluatedMove } | undefined = undefined;

  for (let i = 0; i < numSteps; ++i) {
    const angle = i * stepAngle;
    const move = evaluateMove(staticBalls, angle, params);

    if (best === undefined || move.reward > best.move.reward) {
      best = { angle, move };
    }
  }

  return best!;
}
