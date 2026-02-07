import { WallSide } from "../collision-solver/ball-wall-collision-solver";

export const GameWalls = {
  top: { x0: 0, y0: 1, x1: 1, y1: 1, sigma: 1 },
  right: { x0: 1, y0: 1, x1: 1, y1: 0, sigma: 1 },
  bottom: { x0: 1, y0: 0, x1: 0, y1: 0, sigma: 1 },
  left: { x0: 0, y0: 0, x1: 0, y1: 1, sigma: 1 },
} satisfies { [ k: string ]: WallSide };
