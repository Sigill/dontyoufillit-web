import { BallGeometry } from "../ball";
import { WallSide } from "./ball-wall-collision-solver";

/**
 * Represents a wall obstacle.
 *
 * @template W The type of wall.
 * @property type Discriminator for the obstacle type.
 * @property value The wall and the side on which the collision occurs.
 * @property value.sigma Indicates on which side of the wall (modeled as a line) the collision occurs.
 */
export interface WallObstacle<W extends WallSide = WallSide> {
  type: 'wall';
  value: W;
}

/**
 * Represents a ball obstacle.
 *
 * @template B The type of ball.
 * @property type Discriminator for the obstacle type.
 * @property value The ball obstacle.
 */
export interface BallObstacle<B extends BallGeometry = BallGeometry> {
  type: 'ball';
  value: B;
}

export interface Collision<O> {
  t: number;
  obstacle: O;
}

export function findImminentCollisions<O>(
  collisions: Array<Collision<O>>,
  { epsilon = 1e-5 }: { epsilon?: number; } = {}
): Array<Collision<O>> {
  if (collisions.length <= 1) {
    return collisions;
  }

  return collisions
    .sort((a, b) => a.t - b.t)
    .filter(({ t }, _, [first]) => t <= first.t + epsilon);
}
