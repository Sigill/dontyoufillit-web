import { BallGeometry } from "./ball";
import { vectorLength } from "./utils";

export function computeExpandedRadius(
  { x, y }: { x: number; y: number; },
  staticBalls: Array<BallGeometry>,
) {
  let minRadius = Number.MAX_VALUE, available: number, o: BallGeometry;

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
