import { Ball, DontYouFillItGame } from "./dontyoufillit";
import { Observable, Observer } from "./observable";

function px(v: number) {
  return v + 'px';
}

type HTMLBallDecoration = {
  dom: HTMLDivElement;
  was?: number;
};

type HTMLBall = Ball & HTMLBallDecoration;

type DontYouFillItHTMLGame = Omit<DontYouFillItGame, 'staticBalls'> & { staticBalls: Array<HTMLBall> };

export class DontYouFillItCssGui {
  static MENU = 1;
  static GAME = 2;

  state: number;
  game: DontYouFillItHTMLGame;
  observable: Observable;
  highscore: number;

  private readonly container = document.getElementById('Game')!;
  private readonly board = document.getElementById('Board')!;
  private readonly staticBallLayer = document.getElementById('StaticBallLayer')!;
  private readonly liveBallLayer = document.getElementById('LiveBallLayer')!;
  private readonly DefaultBall = document.getElementById('DefaultBall')!;
  private readonly LiveBall: HTMLElement;
  private readonly Turret = document.getElementById('Turret')!;
  private readonly Highscore = document.getElementById('highscore')!;
  private readonly Score = document.getElementById('score')!;

  private lastClickDate = 0;
  private gameState?: {
    previousBalls: DontYouFillItHTMLGame['staticBalls'];
    score: number;
  } = undefined;

  private SCALE: number;
  private GAME_WIDTH: number;
  private GAME_HEIGHT: number;
  private V_OFFSET: number;
  private H_OFFSET: number;
  private BOTTOM_BORDER: number;
  private TOP_BORDER: number;
  private LEFT_BORDER: number;
  private RIGHT_BORDER: number;

  private redrawUponResize = true;
  private liveBallUpscaleRatio: number | undefined = undefined;

  constructor(game: DontYouFillItGame, highscore: number) {
    this.state = DontYouFillItCssGui.MENU;
    this.game = game as DontYouFillItHTMLGame;
    this.observable = new Observable();
    this.highscore = highscore;

    this.DefaultBall.removeAttribute('id');

    this.LiveBall = this.DefaultBall.cloneNode(true) as HTMLElement;
    this.LiveBall.setAttribute('id', 'LiveBall');
    this.LiveBall.classList.add('B3');
    this.LiveBall.style.display = 'none';
    this.liveBallLayer.appendChild(this.LiveBall);

    this.Turret = document.getElementById('Turret')!;
    this.Highscore = document.getElementById('highscore')!;
    this.Score = document.getElementById('score')!;

    window.addEventListener('resize', () => this.resizeCanvas(), false);

    this.addTouchOrClickEvent('PauseButton', (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (this.isGhostEvent(evt)) return;
      this.pauseGame();
    });

    this.addTouchOrClickEvent(this.container, (evt) => {
      evt.preventDefault();
      if (this.isGhostEvent(evt)) return;
      if ((this.game.currentBall == null) && (this.game.state == DontYouFillItGame.RUNNING)) {
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

  private minimumBallSize = 16;

  private computeBallUpscaleRatio(ballRadiusInPx: number) {
    if (ballRadiusInPx < this.minimumBallSize)
      return this.minimumBallSize / ballRadiusInPx;
    else
    return undefined;
  }

  private transformBall(b: Ball, s: CSSStyleDeclaration, r: number | undefined) {
    let size = b.nr * (this.SCALE - 2);

    if (r !== undefined)
      size = this.minimumBallSize;

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

  private decorateBall(b: Ball & Partial<HTMLBallDecoration>) {
    if (b.dom === undefined) {
      b.dom = this.DefaultBall.cloneNode(true) as HTMLDivElement;
      this.staticBallLayer.appendChild(b.dom);
    }
  }

  private drawStaticBalls() {
    if (this.gameState != undefined) {
      for (let i = 0; i < this.gameState.previousBalls.length; ++i) {
        const pb = this.gameState.previousBalls[i];
        if (pb.counter == 0) {
          if (pb.dom !== undefined) {
            pb.dom.remove();
          }
        }
      }
    }

    for (let i = 0; i < this.game.staticBalls.length; ++i) {
      const b = this.game.staticBalls[i];

      const newBall = b.dom === undefined;

      this.decorateBall(b);

      if ((b.was === undefined) || (b.was != b.counter)) {
        const klassList = b.dom.classList;
        if (b.was !== undefined) {
          klassList.remove('B' + b.was);
        }

        b.was = b.counter;
        klassList.add('B' + b.counter);
      }

      if (this.redrawUponResize || newBall) {
        const upscaleRatio = this.computeBallUpscaleRatio(b.nr * (this.SCALE - 2));

        this.transformBall(b, b.dom.style, upscaleRatio);

        let ballRadiusInPercent = 200 * b.nr;
        if (upscaleRatio !== undefined) {
          ballRadiusInPercent *= upscaleRatio;
        }

        b.dom.style.width = b.dom.style.height = ballRadiusInPercent + '%';
        b.dom.style.display = 'block';
      }
    }
  }

  private draw() {
    if (this.state == DontYouFillItCssGui.GAME) {
      if ((this.gameState === undefined) || (this.gameState.score != this.game.score)) {
        this.Highscore.innerHTML = this.highscore.toString();
        this.Score.innerHTML = this.game.score.toString();
      }

      this.drawStaticBalls();

      this.redrawUponResize = false;

      this.drawCannon();

      this.drawCurrentBall();

      this.gameState = {
        previousBalls: this.game.staticBalls.slice(),
        score: this.game.score
      };
    }
  }

  private step(time: number) {
    this.observable.notifyObservers('beginStep');

    if (this.game.state == DontYouFillItGame.RUNNING) {
      this.game.update(time);
    }

    this.draw();

    this.observable.notifyObservers('endStep');

    if (this.game.state == DontYouFillItGame.RUNNING) {
      window.requestAnimationFrame((t) => this.step(t));
    } else if (this.game.state == DontYouFillItGame.GAMEOVER) {
      this.highscore = Math.max(this.game.score, this.highscore);

      this.observable.notifyObservers('gameover', this.game.score);

      for (let i = 0; i < this.game.staticBalls.length; ++i) {
        const b = this.game.staticBalls[i];
        b.dom.remove()
      }
    }
  }

  private pauseGame() {
    if (this.game.state == DontYouFillItGame.RUNNING) {
      this.game.pause();
      this.observable.notifyObservers('pause');
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

    let liveBallSizeInPercent = 200 * this.game.DEFAULT_BALL_RADIUS;
    if (this.liveBallUpscaleRatio !== undefined)
      liveBallSizeInPercent *= this.liveBallUpscaleRatio;
    this.LiveBall.style.width = this.LiveBall.style.height = liveBallSizeInPercent + '%';

    this.redrawUponResize = true;

    if (this.game.state != DontYouFillItGame.RUNNING)
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

    this.liveBallUpscaleRatio = this.computeBallUpscaleRatio(this.game.DEFAULT_BALL_RADIUS * (this.SCALE - 2));

    document.getElementById('Score')!.style.font = this.SCALE / 12 + 'px/1 Arial';
  }

  private isGhostEvent(evt: MouseEvent | TouchEvent) {
    if (evt.timeStamp - this.lastClickDate < 500) return true;
    this.lastClickDate = evt.timeStamp;
    return false;
  }

  private addTouchOrClickEvent(element: string | HTMLElement, callback: (this: HTMLElement, ev: MouseEvent | TouchEvent) => any) {
    const e = (typeof element === 'string') ? document.getElementById(element)! : element;
    e.addEventListener('click', callback);
    e.addEventListener('touchstart', callback, { passive: false });
  }

  resume() {
    this.game.resume();
    this.state = DontYouFillItCssGui.GAME;
    window.requestAnimationFrame((t) => this.step(t));
  }

  reset() {
    this.gameState = undefined;
    this.game.reset();
    window.requestAnimationFrame((t) => this.step(t));
  }

  addObserver(o: Observer) {
    this.observable.addObserver(o);
  }

  removeObserver(o: Observer) {
    this.observable.removeObserver(o);
  }

  hasObserver(o: Observer) {
    return this.observable.hasObserver(o);
  }

  notifyObservers() {
    this.observable.notifyObservers();
  }
}