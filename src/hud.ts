import {
  addTouchOrClickEvent,
  lazySetInnerText,
  lazyAssign,
  selectElement,
} from "./utils";

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
    lazySetInnerText(this.highscoreSpan, highscore.toString());
    lazySetInnerText(this.scoreSpan, score.toString());
    lazyAssign(this.livesSpan.dataset, lives.toString(), 'counter');
  }
}

customElements.define('dontyoufillit-hud', HUD);
