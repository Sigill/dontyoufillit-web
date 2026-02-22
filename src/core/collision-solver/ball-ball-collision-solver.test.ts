import { assert } from 'chai';
import {
  computeCollisionsWithBalls,
  computeCollisionWithBall,
} from './ball-ball-collision-solver';

const centerBall = {x: 0.5, y: 0.5, angle: 0, velocity: 1, acceleration: -0.4, radius: 0.1};
const tMax = 2.5;

describe('computeCollisionWithBall', () => {
  it('should return undefined if balls are not on a collision path', () => {
    const collision = computeCollisionWithBall(centerBall, { x: 1, y: 0, radius: 0.1 }, 0, tMax);
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

    const xc = 1 / 2 * -0.4 * collision ** 2 + 1 * collision + 0.5; // x location of ball at collision.
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
    assert.sameDeepMembers(collisions, [
      {
        t: 0.31350133629027443,
        obstacle: { type: "ball", value: ball1 },
      },
      {
        t: 0.32055052822966335,
        obstacle: { type: "ball", value: ball2 },
      }
    ]);
  });

  it("should return all the balls it collides with in case of multiple collisions", () => {
    const collisions = computeCollisionsWithBalls(centerBall, [ball1, ball3]);
    assert.sameDeepMembers(collisions, [
      {
        t: 0.31350133629027443,
        obstacle: { type: "ball", value: ball1 },
      },
      {
        t: 0.31350133629027443,
        obstacle: { type: "ball", value: ball3 },
      },
    ]);
  });
});
