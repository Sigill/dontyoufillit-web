import { vectorLength } from "./utils";

export interface StaticBall {
  counter: number;
  radius: number;
  x: number;
  y: number;
}

export function computeExpandedRadius(
  { x, y }: { x: number; y: number; },
  staticBalls: Array<{ radius: number; x: number; y: number; }>,
) {
  let minRadius = Number.MAX_VALUE, available: number, o: { radius: number; x: number; y: number; };

  for (let i = 0; i < staticBalls.length; ++i) {
    o = staticBalls[i];
    available = vectorLength(x - o.x, y - o.y) - o.radius;
    if (minRadius > available) minRadius = available;
  }

  available = x;
  if (minRadius > available) minRadius = available;

  available = 1 - x;
  if (minRadius > available) minRadius = available;

  available = Math.abs(y);
  if (minRadius > available) minRadius = available;

  available = Math.abs(1 - y);
  if (minRadius > available) minRadius = available;

  return Math.abs(minRadius);
}
