import { computeExpandedRadius, StaticBall } from "./ball";
import { Cannon } from "./cannon";
import { BallEngineRK4 } from "./ball-engine-rk4";

export class DontYouFillItGame {
  static readonly PAUSED = 1;
  static readonly RUNNING = 2;
  static readonly GAMEOVER = 3;

  static readonly DEFAULT_BALL_RADIUS = 1 / 40.0;
  static readonly CANNON_Y_POSITION = -1 / 6.0;
  static readonly CANNON_BASE_HEIGHT = 1 / 15.0;
  static readonly CANNON_LENGTH = 1 / 15.0;

  state = DontYouFillItGame.PAUSED;
  cannon = new Cannon();
  lastUpdateTime?: number = undefined;
  score = 0;
  lives = 0;

  snapshot = { score: 0, staticBalls: new Array<[StaticBall, StaticBall]>() };

  engine = new BallEngineRK4();

  get currentBall() {
    return this.engine.currentBall;
  }

  get staticBalls() {
    return this.engine.staticBalls;
  }

  /*
   * Position of the current ball is important, so it will be calculated 1000 times per second.
   * Position of the cannon isn't, so it will be calculated only once every frame.
   */
  update(time: number) {
    const lastUpdateTime = this.lastUpdateTime ?? time;
    const updatestate = this.engine.update(lastUpdateTime ?? time, time);

    if (this.currentBall !== null && this.currentBall.state.s === 0) {
      const expandedRadius = computeExpandedRadius(this.currentBall, this.staticBalls);

    }

    this.score += updatestate.score;
    if (updatestate.gameover) {
      this.state = DontYouFillItGame.GAMEOVER;
    }

    this.cannon.update(lastUpdateTime / 1000, (time - lastUpdateTime) / 1000);

    this.lastUpdateTime = time;
  }

  pause() {
    this.state = DontYouFillItGame.PAUSED;
  }

  resume() {
    this.lastUpdateTime = undefined;
    this.state = DontYouFillItGame.RUNNING;
  }

  reset() {
    this.engine.reset();
    this.cannon.state.u = 0;
    this.score = 0;
    this.resume();
  }

  fire() {
    this.takeSnapshot();

    this.engine.fire({
      nr: DontYouFillItGame.DEFAULT_BALL_RADIUS,
      angle: this.cannon.getAngle(),
      nx: 0.5 + Math.cos(this.cannon.getAngle()) * DontYouFillItGame.CANNON_LENGTH,
      ny: DontYouFillItGame.CANNON_Y_POSITION + DontYouFillItGame.CANNON_BASE_HEIGHT + Math.sin(this.cannon.getAngle()) * DontYouFillItGame.CANNON_LENGTH,
    });
  }

  private takeSnapshot() {
    this.snapshot.score = this.score;
    this.snapshot.staticBalls = this.staticBalls.map<[StaticBall, StaticBall]>(b => [b, structuredClone(b)]);
  }

  restoreSnapshot() {
    this.score = this.snapshot.score;
    this.engine.restoreSnapshot(this.snapshot.staticBalls);
  }

  canUseLife() {
    return this.lives > 0;
  }

  useLife() {
    if (!this.canUseLife()) {
      throw new Error('Out of lives.');
    }

    this.restoreSnapshot();

    this.lastUpdateTime = performance.now ? performance.now() : Date.now();
    this.state = DontYouFillItGame.RUNNING;
  }
}
