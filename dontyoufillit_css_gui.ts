import { Ball, StaticBall } from "./ball";
import { DontYouFillItGame } from "./dontyoufillit";
import { Observable } from "./observable";
import { makeBallDom } from "./renderer";
import { addTouchOrClickEvent, getOrInsert, lazyAttrAssign, px, selectElement } from "./utils";

export class DontYouFillItCssGui {
  static readonly MENU = 1;
  static readonly GAME = 2;

  state: number;
  game: DontYouFillItGame;
  observable = new Observable<{
    beginStep: [];
    endStep: [];
    gameover: [number];
    pause: [];
  }>();
  highscore: number;

  private readonly container = selectElement('#Game');
  private readonly board = selectElement('#Board');
  private readonly staticBallLayer = selectElement('#StaticBallLayer');
  private readonly liveBallLayer = selectElement('#LiveBallLayer');
  private readonly LiveBall: HTMLElement;
  private readonly Turret = selectElement('#Turret');
  private readonly highscoreSpan = selectElement('#Board #highscore');
  private readonly scoreSpan = selectElement('#Board #score');
  private readonly livesSpan = selectElement('#Board #lives');

  private lastClickDate = 0;
  private ballsDom = new Map<Ball, HTMLDivElement>();

  private SCALE: number;
  private GAME_WIDTH: number;
  private GAME_HEIGHT: number;
  private V_OFFSET: number;
  private H_OFFSET: number;
  private BOTTOM_BORDER: number;
  private TOP_BORDER: number;
  private LEFT_BORDER: number;
  private RIGHT_BORDER: number;

  private redrawStaticBalls = true;
  private liveBallUpscaleRatio: number | undefined = undefined;

  constructor(game: DontYouFillItGame, highscore: number) {
    this.state = DontYouFillItCssGui.MENU;
    this.game = game;
    this.highscore = highscore;

    this.LiveBall = makeBallDom();
    this.LiveBall.setAttribute('id', 'LiveBall');
    this.LiveBall.style.display = 'none';
    this.liveBallLayer.appendChild(this.LiveBall);

    window.addEventListener('resize', () => this.resizeCanvas(), false);

    addTouchOrClickEvent('PauseButton', (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (this.isGhostEvent(evt)) return;
      this.pauseGame();
    });

    addTouchOrClickEvent(this.container, (evt) => {
      evt.preventDefault();
      if (this.isGhostEvent(evt)) return;
      if ((this.game.currentBall === null) && (this.game.state === DontYouFillItGame.RUNNING)) {
        // TODO Get updated cannon angle.
        this.game.fire();
      }
    });

    document.addEventListener('visibilitychange', () => this.handleVisibilityChange(), false);

    this.resizeCanvas();
    window.requestAnimationFrame((time) => this.step(time));
  }

  private drawCannon() {
    this.Turret.style.transform = `rotate(-${this.game.cannon.getAngle()}rad)`;
  }

  static readonly #minimumBallSize = 16;

  private computeBallUpscaleRatio(ballRadiusInPx: number) {
    if (ballRadiusInPx < DontYouFillItCssGui.#minimumBallSize)
      return DontYouFillItCssGui.#minimumBallSize / ballRadiusInPx;
    else
      return undefined;
  }

  private transformBall(b: StaticBall, s: CSSStyleDeclaration, r: number | undefined) {
    let size = b.nr * (this.SCALE - 2);

    if (r !== undefined)
      size = DontYouFillItCssGui.#minimumBallSize;

    const dx = b.nx * (this.SCALE - 2) - size;
    const dy = (1 - b.ny) * (this.SCALE - 2) - size;

    let transform = `translate(${dx}px, ${dy}px)`;
    if (r !== undefined)
      transform += ` scale(${1 / r})`;
    s.transform = transform;
  }

  private drawCurrentBall() {
    if (this.game.currentBall) {
      this.transformBall(this.game.currentBall, this.LiveBall.style, this.liveBallUpscaleRatio);
      this.LiveBall.style.display = 'block';
    } else {
      this.LiveBall.style.display = 'none';
    }
  }

  private drawStaticBalls() {
    const actualBalls = new Set(this.game.staticBalls);
    for (const [ball, dom] of this.ballsDom.entries()) {
      if (ball.counter === 0 || !actualBalls.has(ball)) {
        this.ballsDom.delete(ball);
        dom.remove();
      }
    }

    for (let i = 0; i < this.game.staticBalls.length; ++i) {
      const ball = this.game.staticBalls[i];

      const {inserted: isNewBall, value: dom} = getOrInsert(this.ballsDom, ball, makeBallDom);

      dom.dataset.counter = ball.counter.toString();

      if (this.redrawStaticBalls || isNewBall) {
        const upscaleRatio = this.computeBallUpscaleRatio(ball.nr * (this.SCALE - 2));

        this.transformBall(ball, dom.style, upscaleRatio);

        let ballDiameterInPercent = 200 * ball.nr;
        if (upscaleRatio !== undefined) {
          ballDiameterInPercent *= upscaleRatio;
        }

        dom.style.width = dom.style.height = ballDiameterInPercent + '%';
        dom.style.display = 'block';
      }

      if (isNewBall) {
        this.staticBallLayer.appendChild(dom);
        // (ball as any).dom = dom; // For debug.
      }
    }

    this.redrawStaticBalls = false;
  }

  private draw() {
    if (this.state === DontYouFillItCssGui.GAME) {
      lazyAttrAssign(this.highscoreSpan, this.highscore.toString());
      lazyAttrAssign(this.scoreSpan, this.game.score.toString());
      lazyAttrAssign(this.livesSpan.dataset, this.game.lives.toString(), 'counter');

      this.drawStaticBalls();
      this.drawCannon();
      this.drawCurrentBall();
    }
  }

  private step(time: number) {
    this.observable.dispatchEvent('beginStep');

    if (this.game.state === DontYouFillItGame.RUNNING) {
      this.game.update(time);
    }

    this.draw();

    this.observable.dispatchEvent('endStep');

    if (this.game.state === DontYouFillItGame.RUNNING) {
      window.requestAnimationFrame((t) => this.step(t));
    } else if (this.game.state === DontYouFillItGame.GAMEOVER) {
      this.highscore = Math.max(this.game.score, this.highscore);

      this.observable.dispatchEvent('gameover', this.game.score);
    }
  }

  private pauseGame() {
    if (this.game.state === DontYouFillItGame.RUNNING) {
      this.game.pause();
      this.observable.dispatchEvent('pause');
    }
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      this.pauseGame();
    }
  }

  private resizeCanvas() {
    this.computeGameDimensions();

    this.board.style.width = px(this.GAME_WIDTH);
    this.board.style.height = px(this.GAME_HEIGHT);
    this.board.style.left = px(this.H_OFFSET);
    this.board.style.top = px(this.V_OFFSET);

    this.staticBallLayer.style.width = this.staticBallLayer.style.height = px(this.SCALE);
    this.liveBallLayer.style.width = this.liveBallLayer.style.height = px(this.SCALE);
    this.staticBallLayer.style.top = this.liveBallLayer.style.top = px(this.TOP_BORDER);

    let liveBallDiameterInPercent = 200 * DontYouFillItGame.DEFAULT_BALL_RADIUS;
    if (this.liveBallUpscaleRatio !== undefined)
      liveBallDiameterInPercent *= this.liveBallUpscaleRatio;
    this.LiveBall.style.width = this.LiveBall.style.height = liveBallDiameterInPercent + '%';

    this.redrawStaticBalls = true;

    if (this.game.state !== DontYouFillItGame.RUNNING)
      window.requestAnimationFrame((t) => this.step(t));
  }

  private computeGameDimensions() {
    const w = this.container.clientWidth, h = this.container.clientHeight;

    if (w / h < 3 / 4) {
      this.SCALE = w;
    } else {
      this.SCALE = Math.floor(3 / 4 * h);
    }

    this.GAME_WIDTH = this.SCALE;
    this.GAME_HEIGHT = Math.floor(4 / 3 * this.SCALE);
    this.V_OFFSET = Math.floor((h - this.GAME_HEIGHT) / 2);
    this.H_OFFSET = Math.floor((w - this.GAME_WIDTH) / 2);
    this.TOP_BORDER = Math.floor(this.SCALE / 6);
    this.BOTTOM_BORDER = this.TOP_BORDER + this.SCALE;
    this.LEFT_BORDER = 0;
    this.RIGHT_BORDER = this.LEFT_BORDER + this.SCALE;

    this.liveBallUpscaleRatio = this.computeBallUpscaleRatio(DontYouFillItGame.DEFAULT_BALL_RADIUS * (this.SCALE - 2));

    selectElement('#Board #header').style.font = this.SCALE / 12 + 'px/1 Arial';
  }

  private isGhostEvent(evt: MouseEvent | TouchEvent) {
    if (evt.timeStamp - this.lastClickDate < 500) return true;
    this.lastClickDate = evt.timeStamp;
    return false;
  }

  resume() {
    this.game.resume();
    this.state = DontYouFillItCssGui.GAME;

    window.requestAnimationFrame((t) => this.step(t));
  }

  reset() {
    // Even if the cleanup loop at the start of drawStaticBalls() takes care of discarding old balls' dom,
    // remove them all to avoid a blink where they are visible before the next step().
    this.staticBallLayer.replaceChildren();

    this.game.reset();
    this.state = DontYouFillItCssGui.GAME;

    window.requestAnimationFrame((t) => this.step(t));
  }
}
