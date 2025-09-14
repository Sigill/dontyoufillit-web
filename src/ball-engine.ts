import { StaticBall } from "./ball";

export abstract class BallEngine {
  abstract staticBalls: Array<StaticBall>;
  abstract currentBall: StaticBall | null;

  abstract takeSnapshot(): void;
  abstract restoreSnapshot(): void;

  abstract fire(ball: { nr: number; angle: number; nx: number; ny: number; }): void;

  abstract update(t1: number, t0: number): { score: number; gameover: boolean; };

  abstract reset(): void;
}
