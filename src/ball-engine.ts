import { StaticBall } from "./ball";

export abstract class BallEngine {
  staticBalls: Array<StaticBall>;
  abstract currentBall: Omit<StaticBall, 'counter'> | null;

  #snapshot = new Array<[StaticBall, StaticBall]>();

  constructor() {
    this.staticBalls = [];
  }

  takeSnapshot(): void {
    this.#snapshot = this.staticBalls.map<[StaticBall, StaticBall]>(b => [b, structuredClone(b)]);
  }

  restoreSnapshot() {
    this.staticBalls = this.#snapshot.map(([ball, snapshot]) => {
      ball.counter = snapshot.counter;
      ball.radius = snapshot.radius;
      ball.x = snapshot.x;
      ball.y = snapshot.y;
      return ball;
    });
  }

  fire(ball: { radius: number; angle: number; x: number; y: number; }) {
    this.takeSnapshot();
    this.internalFire(ball);
  }

  abstract internalFire(ball: { radius: number; angle: number; x: number; y: number; }): void;

  abstract update(t1: number, t0: number): { score: number; gameover: boolean; };

  reset() {
    this.staticBalls = [];
    this.internalReset();
  }

  abstract internalReset(): void;
}
