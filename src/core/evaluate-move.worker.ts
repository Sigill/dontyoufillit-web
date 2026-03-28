import type { StaticBall } from "./ball";
import { evaluateMove } from "./evaluate-move";

onmessage = (e: MessageEvent) => {
  const { staticBalls, angles, params } = e.data as {
    staticBalls: Array<StaticBall>;
    angles: number[];
    params: { steps: number[], criteria: 'score' | 'hits' };
  };
  const title = `[${self.name}] evaluating ${angles.length} angles`;
  console.time(title);
  const results = angles.map((angle: number) => evaluateMove(staticBalls, angle, params).reward);
  console.timeEnd(title);
  postMessage(results);
};
