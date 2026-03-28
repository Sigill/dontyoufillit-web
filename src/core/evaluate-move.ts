import { StaticBall, makeCannonBall } from "./ball";
import { computeFixedPoints } from "./collision-solver/fixed-points";
import { CANNON_BASE_HEIGHT, CANNON_LENGTH, CANNON_Y_POSITION, DEFAULT_BALL_ACCELERATION, DEFAULT_BALL_RADIUS, DEFAULT_BALL_VELOCITY } from "./constants";
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

export const OUT_PENALITY = -1000000; // Heavy penalty for out
export const GAMEOVER_PENALITY = -100000;  // Less heavy penalty for gameover

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
    includeState,
  }: {
    steps?: Array<number>,
    criteria?: 'score' | 'hits';
    stats?: { value: number };
    includeState?: boolean;
  } = {}
): EvaluatedMove {
  if (stats) stats.value += 1;

  const ball = makeCannonBall({ angle });
  const result = computeFixedPoints(ball, staticBalls, {
    epsilon: 1e-10,
    includeFixedPoints: false,
    includeState: includeState || steps.length > 0,
  });

  const { score, hits, gameover, out, state } = result;

  let nextStaticBalls: Array<StaticBall> | undefined = undefined;

  let reward = criteria === 'hits' ? hits : score;

  if (gameover) {
    reward += GAMEOVER_PENALITY;
  } else if (out) {
    reward += OUT_PENALITY;
  } else {
    if (steps.length > 0) {
      const { finalX, finalY, remainingStaticBalls } = state!;
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

const TIME_OF_FLIGHT = -DEFAULT_BALL_VELOCITY / DEFAULT_BALL_ACCELERATION; // 2.5s
const DISTANCE_TRAVELLED = 0.5 * DEFAULT_BALL_ACCELERATION * TIME_OF_FLIGHT ** 2 + DEFAULT_BALL_VELOCITY * TIME_OF_FLIGHT; // 1.25

// y0 = CANNON_Y_POSITION + CANNON_BASE_HEIGHT + sin(angle) * CANNON_LENGTH
// dy = DISTANCE_TRAVELLED * sin(angle)
// Ball will stop at y=0 when y0 + dy = 0
// DISTANCE_TRAVELLED * sin(angle) = - (CANNON_Y_POSITION + CANNON_BASE_HEIGHT + sin(angle) * CANNON_LENGTH)
// DISTANCE_TRAVELLED * sin(angle) = - CANNON_Y_POSITION - CANNON_BASE_HEIGHT - sin(angle) * CANNON_LENGTH
// DISTANCE_TRAVELLED * sin(angle) + sin(angle) * CANNON_LENGTH = - CANNON_Y_POSITION - CANNON_BASE_HEIGHT
// sin(angle) * (DISTANCE_TRAVELLED + CANNON_LENGTH) = - (CANNON_Y_POSITION + CANNON_BASE_HEIGHT)
// sin(angle) = - (CANNON_Y_POSITION + CANNON_BASE_HEIGHT) / (DISTANCE_TRAVELLED + CANNON_LENGTH)
// const MIN_ANGLE = Math.asin(
//   -(CANNON_Y_POSITION + CANNON_BASE_HEIGHT) /
//   (CANNON_LENGTH + DISTANCE_TRAVELLED)
// );

// Ball will stop at y=DEFAULT_BALL_RADIUS when y0 + dy = -DEFAULT_BALL_RADIUS
// DISTANCE_TRAVELLED * sin(angle) = - (CANNON_Y_POSITION + CANNON_BASE_HEIGHT + sin(angle) * CANNON_LENGTH) - DEFAULT_BALL_RADIUS
// DISTANCE_TRAVELLED * sin(angle) = - CANNON_Y_POSITION - CANNON_BASE_HEIGHT - sin(angle) * CANNON_LENGTH - DEFAULT_BALL_RADIUS
// DISTANCE_TRAVELLED * sin(angle) + sin(angle) * CANNON_LENGTH = - CANNON_Y_POSITION - CANNON_BASE_HEIGHT - DEFAULT_BALL_RADIUS
// sin(angle) * (DISTANCE_TRAVELLED + CANNON_LENGTH) = - (CANNON_Y_POSITION + CANNON_BASE_HEIGHT + DEFAULT_BALL_RADIUS)
// sin(angle) = - (CANNON_Y_POSITION + CANNON_BASE_HEIGHT + DEFAULT_BALL_RADIUS) / (DISTANCE_TRAVELLED + CANNON_LENGTH)
export const MIN_SAFE_ANGLE = Math.asin(
  -(CANNON_Y_POSITION + CANNON_BASE_HEIGHT + DEFAULT_BALL_RADIUS) /
  (CANNON_LENGTH + DISTANCE_TRAVELLED)
);

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

  const params = { steps: steps.slice(1), criteria, stats };

  // Scan angles from 0 to PI
  const numSteps = steps[0];
  const stepAngle = Math.PI / (numSteps - 1);

  const minSafeStep = Math.ceil(MIN_SAFE_ANGLE / stepAngle);
  const maxSafeStep = numSteps - 1 - minSafeStep;

  let i = 0;
  for (; i < minSafeStep; ++i) {
    rewards.push(OUT_PENALITY);
  }

  for (; i <= maxSafeStep; ++i) {
    const angle = i * stepAngle;
    const move = evaluateMove(staticBalls, angle, params);
    rewards.push(move.reward);
  }

  for (; i < numSteps; ++i) {
    rewards.push(OUT_PENALITY);
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
    includeState,
  }: {
    steps?: Array<number>,
    criteria?: 'score' | 'hits';
    stats?: { value: number };
    includeState?: boolean;
  } = {}
): { angle: number; move: EvaluatedMove } {
  const params = { steps: steps.slice(1), criteria, stats, includeState };

  let bestAngle = 0;
  let bestMove = { reward: -Infinity };

  // Scan angles from 0 to PI
  const numSteps = steps[0];
  const stepAngle = Math.PI / (numSteps - 1);

  const minSafeStep = Math.ceil(MIN_SAFE_ANGLE / stepAngle);
  const maxSafeStep = numSteps - 1 - minSafeStep;

  for (let i = minSafeStep; i <= maxSafeStep; ++i) {
    const angle = i * stepAngle;
    const move = evaluateMove(staticBalls, angle, params);

    if (move.reward > bestMove.reward) {
      bestAngle = angle;
      bestMove = move;
    }
  }

  return { angle: bestAngle, move: bestMove };
}
