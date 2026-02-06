import { assert } from 'chai';
import {
  computeCollisionsWithBalls,
  computeCollisionsWithWalls,
  computeCollisionWithBall,
  computeCollisionWithWall,
  Wall,
} from './collision-solver';

const Walls = {
  horizontalY0: { x0: 0, y0: 0, x1: 1, y1: 0 },
  horizontalY1: { x0: 0, y0: 1, x1: 1, y1: 1 },
  verticalX0: { x0: 0, y0: 0, x1: 0, y1: 1 },
  verticalX1: { x0: 1, y0: 0, x1: 1, y1: 1 },
} satisfies { [ k: string ]: Wall };

function reverseWall({x0: x1, y0: y1, x1: x0, y1: y0}: Wall): Wall {
  return {x0, y0, x1, y1};
}

const centerBall = {x: 0.5, y: 0.5, angle: 0, velocity: 1, acceleration: -0.4, radius: 0.1};
const tMax = 2.5;

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

  it('should detect collision on clockwise wall', () => {
    const collision = computeCollisionWithWall(centerBall, Walls.verticalX1, 0, tMax);
    assert.exists(collision);
    // 1/2*a*t² + v*t + 0.5 = 1 - 0.1
    // 1/2*a*t² + v*t -0.4 = 0
    // -0.2*t² + x -0.4 = 0
    // delta = 1² - 4 * 1/2 * -0.4 * -0.4 = 0.68
    // t1 = (-1 - sqrt(delta)) / -0.4 = 0.43844718719116993
    // t2 = (-1 + sqrt(delta)) / -0.4 = 4.56155281280883
    assert.closeTo(collision.t, 0.43844718719116993, 1e-5);
    assert.equal(collision.sigma, -1);
  });

  it('should detect collision on counterclockwise wall', () => {
    // same as above, but wall is reversed.
    const collision = computeCollisionWithWall(centerBall, reverseWall(Walls.verticalX1), 0, tMax);
    assert.exists(collision);
    assert.closeTo(collision.t, 0.43844718719116993, 1e-5);
    assert.equal(collision.sigma, 1);
  });
});

describe('computeCollisionWithWalls', () => {
  it("should return an empty array if the ball does not collide with any wall", () => {
    const collisions = computeCollisionsWithWalls(centerBall, [Walls.horizontalY0, Walls.horizontalY1], { epsilon: 1e-5 });
    assert.isEmpty(collisions);
  });

  it("should return the first wall it collides with", () => {
    // 45° NE, ball located slightly below the trajectory to (1, 1) in order to hide the x=1 wall first.
    const b = { ...centerBall, angle: Math.PI / 4, y: 0.4 };
    const collision1 = computeCollisionWithWall(b, Walls.verticalX1, 0, tMax);
    const collision2 = computeCollisionWithWall(b, Walls.horizontalY1, 0, tMax);
    assert.exists(collision1);
    assert.exists(collision2);
    assert.isBelow(collision1.t, collision2.t);

    const collisions = computeCollisionsWithWalls(b, [Walls.verticalX1, Walls.horizontalY1]);
    assert.sameDeepMembers(collisions, [{
      t: 0.6502505912276093,
      obstacle: {
        type: "wall",
        value: {
          wall: Walls.verticalX1,
          sigma: collision1.sigma,
        },
      },
    }]);
  });

  it("should return all the walls it collides with in case of multiple collisions", () => {
    const b = { ...centerBall, angle: Math.PI / 4 }; // 45° NE.
    const collisions = computeCollisionsWithWalls(b, [Walls.verticalX1, Walls.horizontalY1]);
    assert.sameDeepMembers(collisions, [
      {
        t: 0.6502505912276093,
        obstacle: {
          type: "wall",
          value: {
            wall: Walls.verticalX1,
            sigma: -1,
          },
        },
      },
      {
        t: 0.6502505912276093,
        obstacle: {
          type: "wall",
          value: {
            wall: Walls.horizontalY1,
            sigma: 1,
          },
        },
      },
    ]);
  });
});

describe('computeCollisionWithBall', () => {
  it('should return undefined if balls are not on a collision path', () => {
    const collision = computeCollisionWithBall(centerBall, { x: 1, y: 0, radius: 0.1 }, 0, tMax);
    assert.notExists(collision);
  });

  it('should return undefined if balls graze each other', () => {
    const collision = computeCollisionWithBall(centerBall, { x: 1, y: 0.3, radius: 0.1 }, 0, tMax);
    assert.notExists(collision);
  });

  it('should return undefined if the ball stops before colliding', () => {
    const collision = computeCollisionWithBall(centerBall, { x: -10, y: 0.45, radius: 0.1 }, 0, tMax);
    assert.notExists(collision);
  });

  it('should return undefined if the ball already collided in the past', () => {
    const collision = computeCollisionWithBall(centerBall, { x: 10, y: 0.45, radius: 0.1 }, 0, tMax);
    assert.notExists(collision);
  });

  it('should detect collision', () => {
    const collision = computeCollisionWithBall(centerBall, { x: 1, y: 0.46, radius: 0.11 }, 0, tMax);
    assert.exists(collision);
    assert.closeTo(collision, 0.3135013362902747, 1e-5);

    const xc = 1 / 2 * -0.4 * collision! ** 2 + 1 * collision! + 0.5; // x location of ball at collision.
    // Balls radiuses are 0.1 and 0.11, at collision time the distance between balls centers shall therefore be 0.21.
    assert.closeTo(Math.hypot(1 - xc, 0.5 - 0.46), 0.21, 1e-5);
  });
});

describe('computeCollisionWithBalls', () => {
  const ball1 = { x: 1, y: 0.46, radius: 0.11 };
  const ball2 = { x: 1, y: 0.5, radius: 0.1 };
  const ball3 = { x: 1, y: 0.54, radius: 0.11 };

  it("should return an empty array if the ball does not collide with any ball", () => {
    const collisions = computeCollisionsWithBalls(centerBall, [{x: 1, y: 0, radius: 0.1}, {x: 1, y: 1, radius: 0.1}], { epsilon: 1e-5 });
    assert.isEmpty(collisions);
  });

  it("should return the first ball it collides with", () => {
    const collision1 = computeCollisionWithBall(centerBall, ball1, 0, tMax);
    const collision2 = computeCollisionWithBall(centerBall, ball2, 0, tMax);
    assert.exists(collision1);
    assert.exists(collision2);
    assert.isBelow(collision1, collision2);

    const collisions = computeCollisionsWithBalls(centerBall, [ball1, ball2]);
    assert.sameDeepMembers(collisions, [{
      t: 0.3135013362902747,
      obstacle: {
        type: "ball",
        value: ball1,
      },
    }]);
  });

  it("should return all the balls it collides with in case of multiple collisions", () => {
    const collisions = computeCollisionsWithBalls(centerBall, [ball1, ball3]);
    assert.sameDeepMembers(collisions, [
      {
        t: 0.3135013362902747,
        obstacle: {
          type: "ball",
          value: ball1,
        },
      },
      {
        t: 0.3135013362902747,
        obstacle: {
          type: "ball",
          value: ball3,
        },
      },
    ]);
  });
});
