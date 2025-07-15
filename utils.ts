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

export function getOrInsert<T, U>(map: Map<T, U>, key: T, factory: () => U) {
  const existingValue = map.get(key);
  const finalValue = existingValue ?? factory();
  if (existingValue === undefined) {
    map.set(key, finalValue);
  }
  return { value: finalValue, inserted: existingValue === undefined };
}

export function lazyAttrAssign(element: HTMLElement | DOMStringMap, txt: string, attr = 'innerText') {
  if (element[attr] !== txt) {
    element[attr] = txt;
  }
}
