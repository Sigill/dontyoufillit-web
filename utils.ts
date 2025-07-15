export function vectorLength(x: number, y: number) {
  return Math.sqrt(x * x + y * y);
}

// TODO Improve this
export function normalizeRadian(a: number) {
  while (a > 2 * Math.PI) {
    a -= 2 * Math.PI;
  }

  while (a < 0) {
    a += 2 * Math.PI;
  }

  return a;
}

export function now(): number {
  // Browsers supporting high resolution timestamps will use them in requestAnimationFrame
  return performance.now ? performance.now() : Date.now();
}

export function px(v: number) {
  return v + 'px';
}

export function addTouchOrClickEvent(element: string | HTMLElement, callback: (this: HTMLElement, ev: MouseEvent | TouchEvent) => any) {
  const e = (typeof element === 'string') ? document.getElementById(element)! : element;
  e.addEventListener('click', callback);
  e.addEventListener('touchstart', callback, { passive: false });
}

export function selectElement<T extends Element = HTMLElement>(selector: string, parent: ParentNode = document): T {
  const element = parent.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Could not find an element matching the '${selector}' selector.`);
  }
  return element;
}
