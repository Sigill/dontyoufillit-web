export function vectorLength(x: number, y: number) {
  return Math.sqrt(x * x + y * y);
}

export function squaredVectorLength(x: number, y: number) {
  return x * x + y * y;
}

export function normalizeRadian(angle: number) {
  return ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
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

export function lazyAssign(element: DOMStringMap, value: string, key: keyof DOMStringMap): void {
  if (element[key] !== value) {
    element[key] = value;
  }
}

// Can't figure-out how to specify the types to have a single lazyAssign function.
export function lazySetInnerText(element: HTMLElement, value: string): void {
  if (element.innerText !== value) {
    element.innerText = value;
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function asBool(v: boolean | string | null) {
  return v === true || v === 'true';
}

export function directionalArrow(vx: number, vy: number) {
  if (vx > 0) {
    if (vy > 0) {
      return "↗";
    } else if (vy < 0) {
      return "↘";
    } else {
      return "→";
    }
  } else if (vx < 0) {
    if (vy > 0) {
      return "↖";
    } else if (vy < 0) {
      return "↙";
    } else {
      return "←";
    }
  } else {
    if (vy > 0) {
      return '↑';
    } else if (vy < 0) {
      return "↓";
    } else {
      return "∅";
    }
  }
}

export function solveQuadratic(a: number, b: number, c: number, epsilon = 0): number[] {
  if (Math.abs(a) <= epsilon) {
    if (Math.abs(b) <= epsilon) return []; // No solution or infinite solutions
    return [-c / b];
  }

  const delta = b ** 2 - 4 * a * c;
  if (delta < -epsilon) return [];
  if (delta > epsilon) {
    const sqrtDelta = Math.sqrt(delta);
    const denom = 0.5 / a;
    return [
      (-b + sqrtDelta) * denom,
      (-b - sqrtDelta) * denom,
    ];
  }
  return [-b / (2 * a)];
}

export function solveQuadraticInPlace(a: number, b: number, c: number, roots: number[] | Float64Array, epsilon = 0): number {
  if (Math.abs(a) <= epsilon) {
    if (Math.abs(b) <= epsilon) return 0;
    roots[0] = -c / b;
    return 1;
  }

  const delta = b ** 2 - 4 * a * c;
  if (delta < -epsilon) return 0;
  if (delta > epsilon) {
    const sqrtDelta = Math.sqrt(delta);
    const denom = 0.5 / a;
    roots[0] = (-b + sqrtDelta) * denom;
    roots[1] = (-b - sqrtDelta) * denom;
    return 2;
  }
  roots[0] = -b / (2 * a);
  return 1;
}

export function toDeg(rad: number) {
  return rad * 180 / Math.PI;
}

export function ppAngle(a: number) {
  return `${a.toFixed(2)}rad/${toDeg(a).toFixed(1)}°`;
}

export function maxBy<T>(items: ArrayLike<T>, pred: (item: T) => number): { item: T, index: number, value: number } {
  const result = {
    item: items[0],
    value: pred(items[0]),
    index: 0,
  };

  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    const value = pred(item);
    if (value > result.value) {
      result.item = item;
      result.value = value;
      result.index = i;
    }
  }

  return result;
}

// https://alexitaylor.com/codebytes/simplify-ts/
export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

export interface Angle {
  value: number;
  cos: number;
  sin: number;
}

export function precomputeAngle(angle: number): Angle {
  return { value: angle, cos: Math.cos(angle), sin: Math.sin(angle) };
}
