import { BallGeometry, StaticBall } from "./static-ball";
import { BallEngine } from "./ball-engine";
import { Cannon } from "./cannon";
import { getOrInsert, selectElement } from "./utils";
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { h, Fragment } from "./jsx";
import * as Constants from './constants';

export function makeBallDom(): HTMLDivElement {
  return (
    <div className="ball">
      <div className="disk"></div>
      <div className="num"></div>
      <div className="bar bar-1"></div>
      <div className="bar bar-2"></div>
    </div>
  );
}

export function makeCssBoardDom() {
  return (
    <>
      <div id="StaticBallLayer"></div>
      <div className="Cannon">
        <div className="In">
          <div id="Turret" className="Turret"></div>
          <div className="Base"></div>
          <div className="Dome"></div>
        </div>
      </div>
      <div id="LiveBallLayer"></div>
    </>
  );
}


export class CssBoard extends HTMLElement {
  private ballsDom = new Map<StaticBall, HTMLDivElement>();

  private staticBallLayer: HTMLElement;
  private liveBallLayer: HTMLElement;
  private Turret: HTMLElement;
  private LiveBall: HTMLDivElement;

  constructor() {
    super();

    this.appendChild(makeCssBoardDom());

    this.staticBallLayer = selectElement('#StaticBallLayer', this);
    this.liveBallLayer = selectElement('#LiveBallLayer', this);
    this.Turret = selectElement('#Turret', this);

    this.LiveBall = makeBallDom();
    this.LiveBall.setAttribute('id', 'LiveBall');
    this.LiveBall.style.width = this.LiveBall.style.height = 200 * Constants.DEFAULT_BALL_RADIUS + '%';

    this.LiveBall.style.display = 'none';
    this.liveBallLayer.appendChild(this.LiveBall);
  }

  render(game: BallEngine, cannon: Cannon) {
    this.drawCannon(cannon);
    this.drawStaticBalls(game);
    this.drawCurrentBall(game);
  }

  private drawStaticBalls(game: BallEngine) {
    const actualBalls = new Set(game.staticBalls);
    for (const [ball, dom] of this.ballsDom.entries()) {
      if (ball.counter === 0 || !actualBalls.has(ball)) {
        this.ballsDom.delete(ball);
        dom.remove();
      }
    }

    for (let i = 0; i < game.staticBalls.length; ++i) {
      const ball = game.staticBalls[i];

      const {inserted: isNewBall, value: dom} = getOrInsert(this.ballsDom, ball, makeBallDom);

      dom.dataset.counter = ball.counter.toString();

      if (isNewBall) {
        dom.style.width = dom.style.height = 200 * ball.radius + '%';
        dom.style.display = 'block';

        this.transformBall(ball, dom);
      }

      if (isNewBall) {
        this.staticBallLayer.appendChild(dom);
        // (ball as any).dom = dom; // For debug.
      }
    }
  }

  private transformBall(b: BallGeometry, dom: HTMLDivElement) {
    dom.style.left = (b.x - b.radius) * 100 + '%';
    dom.style.bottom = (b.y - b.radius) * 100 + '%';
  }

  private drawCurrentBall(game: BallEngine) {
    if (game.currentBall) {
      this.transformBall(game.currentBall, this.LiveBall);
      this.LiveBall.style.display = 'block';
    } else {
      this.LiveBall.style.display = 'none';
    }
  }

  private drawCannon(cannon: Cannon) {
    this.Turret.style.transform = `rotate(-${cannon.getAngle()}rad)`;
  }
}

customElements.define('dontyoufillit-css-board', CssBoard);
