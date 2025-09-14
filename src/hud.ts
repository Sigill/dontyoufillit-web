import { addTouchOrClickEvent, lazyAttrAssign, selectElement } from "./utils";

export class HUD extends HTMLElement {
  private readonly highscoreSpan: HTMLSpanElement;
  private readonly scoreSpan: HTMLSpanElement;
  private readonly livesSpan: HTMLSpanElement;

  onPause?: (ev: MouseEvent | TouchEvent) => void;

  constructor() {
    super();

    const fragment = selectElement<HTMLTemplateElement>('#hud-template')
      .content.cloneNode(true);

    // const shadowRoot = this.attachShadow({ mode: "open" });
    // shadowRoot.appendChild(fragment);

    this.appendChild(fragment);

    addTouchOrClickEvent(
      this.querySelector<HTMLDivElement>('.pause')!,
      ev => this.onPause?.(ev)
    );


    this.highscoreSpan = selectElement('.highscore', this);
    this.scoreSpan = selectElement('.score', this);
    this.livesSpan = selectElement('.lives', this);
  }

  render({score, highscore, lives}: { score: number; highscore: number; lives: number; }) {
    lazyAttrAssign(this.highscoreSpan, highscore.toString());
    lazyAttrAssign(this.scoreSpan, score.toString());
    lazyAttrAssign(this.livesSpan.dataset, lives.toString(), 'counter');
  }
}

customElements.define('dontyoufillit-hud', HUD);
