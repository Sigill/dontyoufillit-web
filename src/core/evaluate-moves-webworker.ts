import pLimit from "p-limit";
import { StaticBall } from "./ball";
import { MIN_SAFE_ANGLE, OUT_PENALITY } from "./evaluate-move";
import { splitIntoChunks } from "./utils";

const NUM_WORKERS = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
const workerPool: Worker[] = [];
export function getWorkerPool() {
  if (workerPool.length === 0 && typeof Worker !== 'undefined') {
    for (let i = 0; i < NUM_WORKERS; i++) {
      // Path relative to play.html in dist/www/
      workerPool.push(new Worker('evaluate-move.worker.js', { type: 'module', name: `worker-${i}` }));
    }
  }
  return workerPool;
}

const poolScheduler = pLimit(NUM_WORKERS);

/**
 * Evaluates a single range of moves in a worker.
 */
async function evaluateRangeInWorker(
  staticBalls: Array<StaticBall>,
  angles: number[],
  params: { steps: number[]; criteria: 'score' | 'hits'; }): Promise<number[]> {
  return poolScheduler(async () => {
    const pool = getWorkerPool();
    const worker = pool.pop()!;

    return new Promise<Array<number>>((resolve) => {
      const handler = (e: MessageEvent) => {
        worker.removeEventListener('message', handler);
        resolve(e.data as Array<number>);
      };
      worker.addEventListener('message', handler);
      worker.postMessage({ staticBalls, angles, params });
    }).finally(() => {
      pool.push(worker);
    });
  });
}

/**
 * Evaluates all possible moves for a given board state using a worker pool.
 */
export async function evaluateMovesParallel(
  staticBalls: Array<StaticBall>,
  {
    steps = [180], criteria = 'hits',
  }: {
    steps?: Array<number>;
    criteria?: 'score' | 'hits';
  } = {}
): Promise<Array<number>> {
  const rewards: Array<number> = [];
  const params = { steps: steps.slice(1), criteria };

  // Scan angles from 0 to PI
  const numSteps = steps[0];
  const stepAngle = Math.PI / (numSteps - 1);

  const minSafeStep = Math.ceil(MIN_SAFE_ANGLE / stepAngle);
  const maxSafeStep = numSteps - 1 - minSafeStep;

  let i = 0;
  for (; i < minSafeStep; ++i) {
    rewards.push(OUT_PENALITY);
  }

  const safeRangeSize = maxSafeStep - minSafeStep + 1;
  // const numWorkersToUse = Math.min(NUM_WORKERS, safeRangeSize);
  // const chunkSize = Math.ceil(safeRangeSize / numWorkersToUse);
  const angles = new Array<number>(safeRangeSize);
  for (let j = 0; j < safeRangeSize; j++) {
    angles[j] = (minSafeStep + j) * stepAngle;
  }

  const results = await Promise.all(splitIntoChunks(angles, 10).map((chunk) => {
    return evaluateRangeInWorker(staticBalls, chunk, params);
  })).then((results) => results.flat());

  rewards.push(...results);

  i = rewards.length;
  for (; i < numSteps; ++i) {
    rewards.push(OUT_PENALITY);
  }

  return rewards;
}
