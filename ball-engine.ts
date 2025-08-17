import { StaticBall } from "./ball";

export abstract class BallEngine {
  staticBalls: Array<StaticBall>;
  currentBall: StaticBall | null;

  abstract fire(ball: { nr: number; angle: number; nx: number; ny: number; }): void;
}
