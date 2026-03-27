import { WallSide } from "../collision-solver/ball-wall-collision-solver";
import { precomputeAngle } from "../utils";

export function makeWall({ x0, y0, x1, y1, sigma }: { x0: number, y0: number, x1: number, y1: number, sigma: 1 | -1 }): WallSide {
  const angle = Math.atan2(y1 - y0, x1 - x0);
  return { x0, y0, x1, y1, sigma, angle: precomputeAngle(angle) };
}

export const GameWalls = {
  top: makeWall({ x0: 0, y0: 1, x1: 1, y1: 1, sigma: 1 }),
  right: makeWall({ x0: 1, y0: 1, x1: 1, y1: 0, sigma: 1 }),
  bottom: makeWall({ x0: 1, y0: 0, x1: 0, y1: 0, sigma: 1 }),
  left: makeWall({ x0: 0, y0: 0, x1: 0, y1: 1, sigma: 1 }),
} satisfies { [ k: string ]: WallSide };
