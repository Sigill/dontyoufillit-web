import { Ball } from "./ball";
import { BallEngine } from "./ball-engine";
import { makeBallDom } from "./renderer";
import { selectElement } from "./utils";

export class CssBoard extends HTMLElement {
  private ballsDom = new Map<Ball, HTMLDivElement>();

  private staticBallLayer: HTMLElement;
  private liveBallLayer: HTMLElement;
  private Turret: HTMLElement;
  private LiveBall: HTMLDivElement;

  constructor() {
    super();

    const fragment = selectElement<HTMLTemplateElement>('#css-board-template')
      .content.cloneNode(true);

    // const shadowRoot = this.attachShadow({ mode: "open" });
    // shadowRoot.appendChild(fragment);

    this.appendChild(fragment);

    this.staticBallLayer = selectElement('#StaticBallLayer', this);
    this.liveBallLayer = selectElement('#LiveBallLayer', this);
    this.Turret = selectElement('#Turret', this);

    this.LiveBall = makeBallDom();
    this.LiveBall.setAttribute('id', 'LiveBall');
    this.LiveBall.style.display = 'none';
    this.liveBallLayer.appendChild(this.LiveBall);
  }

  render(game: BallEngine) {

  }
}

customElements.define('dontyoufillit-css-board', CssBoard);
