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

  #timeCorrection = 0;
  #pausedAt?: number;

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

  #update(frameTime: number, lastFrameTime: number) {
    this.#cannon.update(lastFrameTime, frameTime - lastFrameTime);
    const updatestate = this.#ballEngine.update(frameTime, lastFrameTime);

    this.score += updatestate.score;
    this.highscore = Math.max(this.score, this.highscore);

    if (updatestate.gameover) {
      this.#state = GameHandler.GAMEOVER;
      this.lives -= 1;
      this.observable.dispatchEvent('gameover', this.score);
    }
  }

  step(frameTime: number, lastFrametime: number) {
    if (this.#state === GameHandler.PAUSED) {
      this.#pausedAt = lastFrametime;
    } else if (this.#state === GameHandler.RUNNING) {
      this.observable.dispatchEvent('beginStep');

      this.#update(frameTime - this.#timeCorrection, lastFrametime - this.#timeCorrection);

      this.observable.dispatchEvent('endStep');

      window.requestAnimationFrame(nextFrameTime => this.step(nextFrameTime / 1000, frameTime));
    }

    if (this.#state === GameHandler.GAMEOVER) {
      this.observable.dispatchEvent('gameover', this.score);
    }
  }

  start(frameTime: number) {
    this.observable.dispatchEvent('beginStep');

    if (this.#pausedAt !== undefined) {
      this.#timeCorrection += frameTime - this.#pausedAt;
      this.#pausedAt = undefined;
    }

    this.observable.dispatchEvent('endStep');

    window.requestAnimationFrame(nextFrameTime => this.step(nextFrameTime / 1000, frameTime));
  }

  pause() {
    this.#state = GameHandler.PAUSED;
    // cancelAnimationFrame?
  }

  resume() {
    this.#state = GameHandler.RUNNING;
    window.requestAnimationFrame(nextFrameTime => this.start(nextFrameTime / 1000));
  }

  reset() {
    this.#ballEngine.reset();
    this.#cannon.reset();
    this.score = 0;
    this.resume();
  }

  fire() {
    this.#takeSnapshot();

    this.#ballEngine.fire({
      radius: Constants.DEFAULT_BALL_RADIUS,
      angle: this.#cannon.getAngle(),
      x: 0.5 + Math.cos(this.#cannon.getAngle()) * Constants.CANNON_LENGTH,
      y: Constants.CANNON_Y_POSITION + Constants.CANNON_BASE_HEIGHT + Math.sin(this.#cannon.getAngle()) * Constants.CANNON_LENGTH,
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
