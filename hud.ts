import { addTouchOrClickEvent, selectElement } from "./utils";

export class HUD extends HTMLElement {
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
  }
}

customElements.define('dontyoufillit-hud', HUD);
