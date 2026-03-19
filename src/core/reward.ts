import { CANNON_BASE_HEIGHT, CANNON_Y_POSITION } from './constants';

/**
 * Normalizes rewards between 0 and 1.
 */
export function normalizeRewards(moves: { reward: number }[]): Float32Array {
  const scores = new Float32Array(moves.length);

  // First, mark explicit out-moves (very bad) as zero and collect valid rewards
  const rewards: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < moves.length; i++) {
    const r = moves[i].reward;
    if (r < -100000) {
      scores[i] = 0; // out moves
    } else {
      rewards.push(r);
      indices.push(i);
    }
  }

  if (rewards.length === 0) return scores;

  // Determine sign composition of the remaining rewards
  let hasNonNegative = false;
  let hasNegative = false;
  for (const r of rewards) {
    if (r < 0) hasNegative = true;
    else hasNonNegative = true; // includes zero
  }

  // Helper: linear map from [lb, ub] -> [0.2, 1]
  const mapRange = (v: number, lb: number, ub: number) => {
    if (ub === lb) return 1; // degenerate range -> top score
    return 0.2 + ((v - lb) / (ub - lb)) * 0.8;
  };

  // Case A: all values have the same sign (all non-negative or all negative)
  if ((hasNonNegative && !hasNegative) || (hasNegative && !hasNonNegative)) {
    const minR = Math.min(...rewards);
    const maxR = Math.max(...rewards);
    for (let k = 0; k < rewards.length; k++) {
      const idx = indices[k];
      const r = rewards[k];
      scores[idx] = mapRange(r, minR, maxR);
    }
    return scores;
  }

  // Case B: mixed signs -> negatives are zero, non-negative values normalized to [0.2,1]
  let minPos = Infinity;
  let maxPos = -Infinity;
  for (const r of rewards) {
    if (r >= 0) {
      if (r < minPos) minPos = r;
      if (r > maxPos) maxPos = r;
    }
  }

  for (let k = 0; k < rewards.length; k++) {
    const idx = indices[k];
    const r = rewards[k];
    if (r < 0) {
      scores[idx] = 0;
    } else {
      scores[idx] = mapRange(r, minPos, maxPos);
    }
  }

  return scores;
}

/**
 * Computes the SVG path data for the reward visualization arc.
 */
export function computeRewardPath(targets: Float32Array | number[]): string {
  const centerX = 0.5;
  const centerY = 1 - (CANNON_Y_POSITION + CANNON_BASE_HEIGHT);
  const baseRadius = 0.05;
  const maxRadius = 0.3;

  const numActions = targets.length;
  let path = "";
  for (let i = 0; i < numActions; i++) {
    const angle = (i / (numActions - 1)) * Math.PI;
    const reward = targets[i] || 0;
    const r = baseRadius + reward * (maxRadius - baseRadius);
    const x = centerX + Math.cos(angle) * r;
    const y = centerY - Math.sin(angle) * r;

    if (i === 0) path += `M ${x} ${y}`;
    else path += ` L ${x} ${y}`;
  }
  path += " Z";
  return path;
}
