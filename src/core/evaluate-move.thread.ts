// message_worker.js
import { parentPort, workerData } from 'worker_threads';
import type { StaticBall } from "./ball";
import { evaluateMove } from "./evaluate-move";

const { name } = workerData as { name: string };

interface Data {
  staticBalls: Array<StaticBall>;
  angles: number[];
  params: { steps: number[], criteria: 'score' | 'hits' };
};

parentPort!.on('message', (data: Data) => {
  const { staticBalls, angles, params } = data;
  const title = `[${name}] evaluating ${angles.length} angles`;
  console.time(title);
  const results = angles.map((angle: number) => evaluateMove(staticBalls, angle, params).reward);
  console.timeEnd(title);
  parentPort!.postMessage(results);
});
