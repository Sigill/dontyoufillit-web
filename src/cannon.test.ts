import * as chai from 'chai';
import { Cannon } from './cannon';
import { CANON_ANGULAR_SPEED } from './constants';

const { assert } = chai;

describe('Cannon', () => {
  let cannon: Cannon;

  beforeEach(() => {
    cannon = new Cannon();
  });

  it('should start at angle 0 (internal u=0)', () => {
    // defined as u + PI/2
    assert.closeTo(cannon.getAngle(), Math.PI / 2, 0.0001);
  });

  it('should move linearly with small dt', () => {
    // Speed is CANON_ANGULAR_SPEED (positive initially)
    const dt = 0.1;
    cannon.update(dt, 0);
    // Expected change: speed * dt
    const expectedAngle = Math.PI / 2 + CANON_ANGULAR_SPEED * dt;
    assert.closeTo(cannon.getAngle(), expectedAngle, 0.0001);
  });

  it('should bounce when hitting the upper limit (PI/2 internal)', () => {
    // We start at 0. Upper limit is PI/2.
    // Distance to limit is PI/2.
    // Time to reach limit = (PI/2) / speed
    const timeToLimit = (Math.PI / 2) / CANON_ANGULAR_SPEED;

    // Step exactly to the limit
    cannon.update(timeToLimit, 0);
    assert.closeTo(cannon.getAngle(), Math.PI, 0.0001); // PI/2 + PI/2

    // Step a bit more, should bounce back
    const dt = 0.1;
    cannon.update(timeToLimit + dt, timeToLimit);

    // Should be at: limit - (speed * dt)
    // internal u should be: (PI/2) - (speed * dt)
    // getAngle should be: PI/2 + (PI/2 - speed * dt) = PI - speed * dt
    const expectedAngle = Math.PI - CANON_ANGULAR_SPEED * dt;
    assert.closeTo(cannon.getAngle(), expectedAngle, 0.0001);
  });

  it('should handle large dt properly (multiple bounces)', () => {
    // Current logic fails this.
    // Let's simulate a huge dt that would bounce multiple times.
    // Total range is -PI/2 to PI/2 (length PI).
    // Let's say we want to bounce 3 times.
    // Start at 0. moving positive.
    // 1. To PI/2 (dist PI/2)
    // 2. To -PI/2 (dist PI)
    // 3. To PI/2 (dist PI)
    // 4. Back to 0 (dist PI/2)
    // Total distance = 3 * PI
    const totalDist = 3 * Math.PI;
    const dt = totalDist / CANON_ANGULAR_SPEED;

    cannon.update(dt, 0);

    // Should end up back at 0 (internal u=0) -> getAngle() = PI/2
    assert.closeTo(cannon.getAngle(), Math.PI / 2, 0.0001);
  });
});
