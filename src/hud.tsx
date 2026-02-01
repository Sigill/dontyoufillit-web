import {
  addTouchOrClickEvent,
  lazySetInnerText,
  lazyAssign,
  selectElement,
} from "./utils";
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { h, Fragment } from "./jsx";

export function makeHudDom() {
  return (
    <>
      <div className="left-col">
        <div className="label">Highscore</div><div className="value highscore"></div>
        <div className="label">Score</div><div className="value score"></div>
      </div>

      <div className="right-col">
        <span className="lives"></span>

        <div className="pause">
          <div className="pause-bar"></div>
          <div className="pause-bar"></div>
        </div>
      </div>
    </>
  );
}

export class HUD extends HTMLElement {
  private readonly highscoreSpan: HTMLSpanElement;
  private readonly scoreSpan: HTMLSpanElement;
  private readonly livesSpan: HTMLSpanElement;

  onPause?: (ev: MouseEvent | TouchEvent) => void;

  constructor() {
    super();

    this.appendChild(makeHudDom());

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
