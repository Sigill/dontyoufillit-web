import { BallEngine } from "./ball-engine";
import { Cannon } from "./cannon";
import * as Constants from './constants';
import { Observable } from "./observable";

export class GameHandler {
  static readonly PAUSED = 1;
  static readonly RUNNING = 2;
  static readonly GAMEOVER = 3;

  observable = new Observable<{
    beginStep: [];
    endStep: [];
    gameover: [number];
  }>();

  #state = GameHandler.PAUSED;

  #lastUpdateTime?: number = undefined;

  highscore = 0;
  score = 0;
  lives = 0;

  #cannon: Cannon;
  #ballEngine: BallEngine;

  #snapshot = { score: 0 };

  constructor({cannon, ballEngine}: {cannon: Cannon; ballEngine: BallEngine}) {
    this.#cannon = cannon;
    this.#ballEngine = ballEngine;
  }

  get state() {
    return this.#state;
  }

  get currentBall() {
    return this.#ballEngine.currentBall;
  }

  get staticBalls() {
    return this.#ballEngine.staticBalls;
  }

  #update(t: number) {
    const lastUpdateTime = this.#lastUpdateTime ?? t;

    this.#cannon.update(lastUpdateTime / 1000, (t - lastUpdateTime) / 1000);
    const updatestate = this.#ballEngine.update(t, lastUpdateTime);

    this.score += updatestate.score;
    this.highscore = Math.max(this.score, this.highscore);

    if (updatestate.gameover) {
      this.#state = GameHandler.GAMEOVER;
      this.lives -= 1;
      this.observable.dispatchEvent('gameover', this.score);
    }

    this.#lastUpdateTime = t;
  }

  step(t: number) {
    this.observable.dispatchEvent('beginStep');

    this.#update(t);

    this.observable.dispatchEvent('endStep');

    if (this.#state === GameHandler.RUNNING) {
      window.requestAnimationFrame((t) => this.step(t));
    } else if (this.#state === GameHandler.GAMEOVER) {
      this.observable.dispatchEvent('gameover', this.score);
    }
  }

  pause() {
    this.#state = GameHandler.PAUSED;
    // cancelAnimationFrame?
  }

  resume() {
    this.#lastUpdateTime = undefined;
    this.#state = GameHandler.RUNNING;
    window.requestAnimationFrame((t) => this.step(t));
  }

  reset() {
    this.#ballEngine.reset();
    this.#cannon.state.u = 0;
    this.score = 0;
    this.resume();
  }

  fire() {
    this.#takeSnapshot();

    this.#ballEngine.fire({
      nr: Constants.DEFAULT_BALL_RADIUS,
      angle: this.#cannon.getAngle(),
      nx: 0.5 + Math.cos(this.#cannon.getAngle()) * Constants.CANNON_LENGTH,
      ny: Constants.CANNON_Y_POSITION + Constants.CANNON_BASE_HEIGHT + Math.sin(this.#cannon.getAngle()) * Constants.CANNON_LENGTH,
    });
  }

  #takeSnapshot() {
    this.#snapshot.score = this.score;
  }

  restoreSnapshot() {
    this.score = this.#snapshot.score;
    this.#ballEngine.restoreSnapshot();
  }

  canUseLife() {
    return this.lives > 0;
  }

  useLife() {
    if (!this.canUseLife()) {
      throw new Error('Out of lives.');
    }

    this.restoreSnapshot();

    this.resume();
  }
}
