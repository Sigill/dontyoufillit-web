import { Ball, StaticBall } from "./ball";
import { Cannon } from "./cannon";
import { normalizeRadian } from "./utils";

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
  staticBalls: Array<Ball> = [];
  currentBall: Ball | null = null;
  lastUpdateTime?: number = undefined;
  score = 0;
  lives = 0;

  snapshot = { score: 0, staticBalls: new Array<[Ball, StaticBall]>()};

  /*
   * Position of the current ball is important, so it will be calculated 1000 times per second.
   * Position of the cannon isn't, so it will be calculated only once every frame.
   */
  update(time: number) {
    const lastUpdateTime = this.lastUpdateTime ?? time;

    if (this.currentBall) {
      let loopLastUpdateTime = lastUpdateTime;
      const steps = Math.floor(time - lastUpdateTime);

      for (let i = 1; i <= steps && this.state === DontYouFillItGame.RUNNING; ++i) {
        const loopCurrentUpdateTime = (lastUpdateTime * (steps - i) + time * i) / steps;
        this.currentBall.update(loopLastUpdateTime / 1000, (loopCurrentUpdateTime - loopLastUpdateTime) / 1000, this.staticBalls);

        for (let j = this.staticBalls.length - 1; j >= 0; --j) {
          if (this.staticBalls[j].counter === 0) {
            ++this.score;
            this.staticBalls.splice(j, 1);
          }
        }

        if (this.currentBall.ny < this.currentBall.nr && normalizeRadian(this.currentBall.direction) > Math.PI) {
          this.currentBall.state.s = 0;
          this.state = DontYouFillItGame.GAMEOVER;
          this.lives -= 1;

        } else if (this.currentBall.state.s < 0.001) {
          if (this.currentBall.ny >= 0) {
            this.currentBall.grow(this.staticBalls);
            this.staticBalls.push(this.currentBall);
          }
          this.currentBall = null;
          break;
        }
        loopLastUpdateTime = loopCurrentUpdateTime;
      }
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
    this.currentBall = null;
    this.staticBalls = [];
    this.cannon.state.u = 0;
    this.score = 0;
    this.resume();
  }

  fire() {
    this.takeSnapshot();

    this.currentBall = new Ball(
      DontYouFillItGame.DEFAULT_BALL_RADIUS,
      0.5 + Math.cos(this.cannon.getAngle()) * DontYouFillItGame.CANNON_LENGTH,
      DontYouFillItGame.CANNON_Y_POSITION + DontYouFillItGame.CANNON_BASE_HEIGHT + Math.sin(this.cannon.getAngle()) * DontYouFillItGame.CANNON_LENGTH,
      this.cannon.getAngle()
    );
  }

  private takeSnapshot() {
    this.snapshot.score = this.score;
    this.snapshot.staticBalls = this.staticBalls.map<[Ball, StaticBall]>(b => [b, b.staticSnapshot()]);
  }

  restoreSnapshot() {
    this.score = this.snapshot.score;
    this.staticBalls = this.snapshot.staticBalls.map(([ball, snapshot]) => {
      ball.counter = snapshot.counter;
      ball.nr = snapshot.nr;
      ball.nx = snapshot.nx;
      ball.ny = snapshot.ny;
      return ball;
    });
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
    this.currentBall = null;
  }
}
