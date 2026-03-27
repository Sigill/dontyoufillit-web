import { assert } from 'chai';
import {
  computeCollisionWithWall,
  computeCollisionWithWallSide
} from "./ball-wall-collision-solver";
import { Wall, WallSide } from "./ball-wall-collision-solver";
import { computeCollisionsWithWalls } from "./ball-wall-collision-solver";
import { GameWalls } from '../ball-engine/walls';
import { normalizeRadian, precomputeAngle } from '../utils';

const Walls = {
  horizontalY0: GameWalls.bottom,
  horizontalY1: GameWalls.top,
  verticalX0: GameWalls.left,
  verticalX1: GameWalls.right,
} satisfies { [ k: string ]: WallSide };

const centerBall = {x: 0.5, y: 0.5, angle: precomputeAngle(0), velocity: 1, acceleration: -0.4, radius: 0.1};
const tMax = 2.5;

function reverseWall<W extends Wall>(wall: W): W {
  return { ...wall, x0: wall.x1, y0: wall.y1, x1: wall.x0, y1: wall.y0, angle: precomputeAngle(normalizeRadian(wall.angle.value + Math.PI))};
}

describe('computeCollisionWithWallSide', () => {
  it("should return undefined if the ball trajectory is parallel to the wall but the ball doesn't touch", () => {
    const collision = computeCollisionWithWallSide(centerBall, Walls.horizontalY0, 0, tMax);
    assert.notExists(collision);
  });

  it("should return undefined if the ball trajectory is parallel to the wall and the ball just touches the wall", () => {
    const collision = computeCollisionWithWallSide({ ...centerBall, y: 0.1 }, Walls.horizontalY0, 0, tMax);
    assert.notExists(collision);
  });

  it("should return undefined if the ball trajectory is parallel to the wall and the ball is inside the wall", () => {
    const collision = computeCollisionWithWallSide({ ...centerBall, y: 0.05 }, Walls.horizontalY0, 0, tMax);
    assert.notExists(collision);
  });

  it('should return undefined if ball already collided with the wall in the past', () => {
    const collision = computeCollisionWithWallSide(centerBall, Walls.verticalX0, 0, tMax);
    assert.notExists(collision);
  });

  it('should return undefined if ball stops before colliding with the wall', () => {
    const collision = computeCollisionWithWallSide({ ...centerBall, x: -10 }, Walls.verticalX1, 0, tMax);
    assert.notExists(collision);
  });

  it('should detect collision on clockwise wall', () => {
    const collision = computeCollisionWithWallSide(centerBall, Walls.verticalX1, 0, tMax);
    assert.exists(collision);
    // 1/2*a*t² + v*t + 0.5 = 1 - 0.1
    // 1/2*a*t² + v*t -0.4 = 0
    // -0.2*t² + x -0.4 = 0
    // delta = 1² - 4 * 1/2 * -0.4 * -0.4 = 0.68
    // t1 = (-1 - sqrt(delta)) / -0.4 = 0.43844718719116993
    // t2 = (-1 + sqrt(delta)) / -0.4 = 4.56155281280883
    assert.closeTo(collision, 0.43844718719116993, 1e-5);
  });

  it('should detect collision on counterclockwise wall', () => {
    // same as above, but wall is reversed.
    const collision = computeCollisionWithWallSide(centerBall, reverseWall(Walls.verticalX1), 0, tMax);
    assert.exists(collision);
    assert.closeTo(collision, 4.56155281280883, 1e+5);
  });
});

describe('computeCollisionWithWall', () => {
  it("should return undefined if the ball trajectory is parallel to the wall but the ball doesn't touch", () => {
    const collision = computeCollisionWithWall(centerBall, Walls.horizontalY0, 0, tMax);
    assert.notExists(collision);
  });

  it("should return undefined if the ball trajectory is parallel to the wall and the ball just touches the wall", () => {
    const collision = computeCollisionWithWall({ ...centerBall, y: 0.1 }, Walls.horizontalY0, 0, tMax);
    assert.notExists(collision);
  });

  it("should return undefined if the ball trajectory is parallel to the wall and the ball is inside the wall", () => {
    const collision = computeCollisionWithWall({ ...centerBall, y: 0.05 }, Walls.horizontalY0, 0, tMax);
    assert.notExists(collision);
  });

  it('should return undefined if ball already collided with the wall in the past', () => {
    const collision = computeCollisionWithWall(centerBall, Walls.verticalX0, 0, tMax);
    assert.notExists(collision);
  });

  it('should return undefined if ball stops before colliding with the wall', () => {
    const collision = computeCollisionWithWall({ ...centerBall, x: -10 }, Walls.verticalX1, 0, tMax);
    assert.notExists(collision);
  });

  it('should detect collision on counterlockwise wall', () => {
    const collision = computeCollisionWithWall(centerBall, Walls.verticalX1, 0, tMax);
    assert.exists(collision);
    // 1/2*a*t² + v*t + 0.5 = 1 - 0.1
    // 1/2*a*t² + v*t -0.4 = 0
    // -0.2*t² + x -0.4 = 0
    // delta = 1² - 4 * 1/2 * -0.4 * -0.4 = 0.68
    // t1 = (-1 - sqrt(delta)) / -0.4 = 0.43844718719116993
    // t2 = (-1 + sqrt(delta)) / -0.4 = 4.56155281280883
    assert.closeTo(collision.t, 0.43844718719116993, 1e-5);
    assert.equal(collision.sigma, 1);
  });

  it('should detect collision on clockwise wall', () => {
    // same as above, but wall is reversed.
    const collision = computeCollisionWithWall(centerBall, reverseWall(Walls.verticalX1), 0, tMax);
    assert.exists(collision);
    assert.closeTo(collision.t, 0.43844718719116993, 1e-5);
    assert.equal(collision.sigma, -1);
  });
});

describe('computeCollisionWithWalls', () => {
  it("should return an empty array if the ball does not collide with any wall", () => {
    const collisions = computeCollisionsWithWalls(centerBall, [Walls.horizontalY0, Walls.horizontalY1], { epsilon: 1e-5 });
    assert.isEmpty(collisions);
  });

  it("should return the first wall it collides with", () => {
    // 45° NE, ball located slightly below the trajectory to (1, 1) in order to hide the x=1 wall first.
    const b = { ...centerBall, angle: precomputeAngle(Math.PI / 4), y: 0.4 };
    const collision1 = computeCollisionWithWallSide(b, Walls.verticalX1, 0, tMax);
    const collision2 = computeCollisionWithWallSide(b, Walls.horizontalY1, 0, tMax);
    assert.exists(collision1);
    assert.exists(collision2);
    assert.isBelow(collision1, collision2);

    const collisions = computeCollisionsWithWalls(b, [Walls.verticalX1, Walls.horizontalY1]);
    assert.sameDeepMembers(collisions, [{
      t: 0.6502505912276092,
      obstacle: {
        type: "wall",
        value: Walls.verticalX1,
      },
    }]);
  });

  it("should return all the walls it collides with in case of multiple collisions", () => {
    const b = { ...centerBall, angle: precomputeAngle(Math.PI / 4) }; // 45° NE.
    const collisions = computeCollisionsWithWalls(b, [Walls.verticalX1, Walls.horizontalY1]);
    assert.sameDeepMembers(collisions, [
      {
        t: 0.6502505912276092,
        obstacle: {
          type: "wall",
          value: Walls.verticalX1,
        },
      },
      {
        t: 0.6502505912276093,
        obstacle: {
          type: "wall",
          value: Walls.horizontalY1,
        },
      },
    ]);
  });
});
