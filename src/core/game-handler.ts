import { BallEngine } from "./ball-engine";
import { makeCannonBall } from "./ball";
import { MovingCannon as Cannon } from "./cannon";
import { CollisionHandler, DefaultCollisionHandler } from "./collision-handler";
import { Observable } from "./observable";
import { ORACLE_BONUS_COST } from "./constants";

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
  #lastFrameTime?: number;
  #animationFrameId?: number;

  highscore = 0;
  score = 0;
  lives = 0;
  oracleActive = false;

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
    this.#cannon.update(frameTime, lastFrameTime);
    const updatestate = this.#ballEngine.update(frameTime, lastFrameTime);

    this.score += updatestate.score;
    this.highscore = Math.max(this.score, this.highscore);

    if (updatestate.gameover) {
      this.#state = GameHandler.GAMEOVER;
      this.lives -= 1;
      this.observable.dispatchEvent('gameover', this.score);
    }
  }

  #step(frameTime: number, lastFrametime: number) {
    this.#lastFrameTime = frameTime;

    if (this.#state === GameHandler.RUNNING) {
      this.observable.dispatchEvent('beginStep');

      this.#update((frameTime - this.#timeCorrection) / 1000, (lastFrametime - this.#timeCorrection) / 1000);

      this.observable.dispatchEvent('endStep');

      if (this.#state === GameHandler.RUNNING) {
        this.#animationFrameId = window.requestAnimationFrame(nextFrameTime => this.#step(nextFrameTime, frameTime));
      }
    }
  }

  #startOrResume(frameTime: number) {
    this.observable.dispatchEvent('beginStep');

    if (this.#lastFrameTime !== undefined) {
      this.#timeCorrection += frameTime - this.#lastFrameTime;
      this.#lastFrameTime = undefined;
    }

    // Causes the initial frame to be rendered.
    this.observable.dispatchEvent('endStep');

    this.#animationFrameId = window.requestAnimationFrame(nextFrameTime => this.#step(nextFrameTime, frameTime));
  }

  pause() {
    this.#state = GameHandler.PAUSED;

    if (this.#animationFrameId !== undefined) {
      window.cancelAnimationFrame(this.#animationFrameId);
      this.#animationFrameId = undefined;
    }
  }

  resume() {
    this.#state = GameHandler.RUNNING;
    window.requestAnimationFrame(nextFrameTime => this.#startOrResume(nextFrameTime));
  }

  reset() {
    this.#ballEngine.reset();
    this.#cannon.reset();
    this.score = 0;
    this.oracleActive = false;
    this.resume();
  }

  fire() {
    this.#takeSnapshot();

    this.score -= this.activeCollisionHandler.cost ?? 0;
    this.oracleActive = false;

    this.#ballEngine.fire(makeCannonBall({ angle: this.#cannon.getAngle() }));
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
    this.oracleActive = false;

    this.resume();
  }

  /**
   * Returns true if the player can afford to enable the specified collision handler.
   */
  canEnableCollisionHandler(handler: CollisionHandler) {
    if (this.oracleActive) {
      return false;
    }
    return handler.cost === undefined || this.score >= handler.cost;
  }

  /**
   * Toggles a collision handler for the next ball.
   * If another collision handler was active, it will be replaced.
   */
  toggleCollisionHandler(handler: CollisionHandler) {
    if (this.#ballEngine.collisionHandler === handler) {
      this.#ballEngine.collisionHandler = DefaultCollisionHandler;
    } else {
      this.#ballEngine.collisionHandler = handler;
    }
  }

  /**
   * Applies the Oracle bonus.
   */
  applyOracleBonus() {
    if (this.score >= ORACLE_BONUS_COST) {
      this.score -= ORACLE_BONUS_COST;
      this.oracleActive = true;
      // Exclusivity: Disable Lazer bonus if active
      this.#ballEngine.collisionHandler = DefaultCollisionHandler;
    }
  }

  /**
   * Returns the currently active collision handler.
   */
  get activeCollisionHandler(): CollisionHandler {
    return this.#ballEngine.collisionHandler;
  }
}
