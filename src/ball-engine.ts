import { BallGeometry, StaticBall } from "./static-ball";

/**
 * A BallEngine is meant to implement the game physics.
 *
 * This involves computing the ball position according to the way it bounces
 * against the walls and the other balls.
 *
 * Because there are multiple ways to implement this, actual implementations must
 * inherit from this class and implement the {@link BallEngine.update | update}
 * and {@link BallEngine.internalFire | internalFire} methods.
 *
 * It additionally provides a snapshot capability to allow saving and restoring
 * the game in the state it was before a new ball is fired.
 */
export abstract class BallEngine {
  staticBalls: Array<StaticBall>;
  abstract currentBall: BallGeometry | null;

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

    console.groupCollapsed('snapshot');
    console.log(ball);
    console.log(this.#snapshot.map(([, ball]) => ball));
    console.groupEnd();

    this.internalFire(ball);
  }

  abstract internalFire(ball: { radius: number; angle: number; x: number; y: number; }): void;

  abstract update(frameTime: number, lastFrameTime: number): { score: number; gameover: boolean; };

  reset() {
    this.staticBalls = [];
    this.internalReset();
  }

  /**
   * Resets the engine by clearing the current ball.
   */
  internalReset() {
    this.currentBall = null;
  }
}
