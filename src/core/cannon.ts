import { CANON_ANGULAR_SPEED } from "./constants";

export abstract class Cannon {
  /**
   * Gets the current angle of the cannon.
   * @returns The angle in radians, adjusted by 90 degrees (PI/2).
   */
  abstract getAngle(): number;
}

/**
 * Represents the cannon that fires balls.
 * It oscillates back and forth within a specific angular range.
 */
export class MovingCannon extends Cannon {
  #angle = 0;
  #angularVelocity = CANON_ANGULAR_SPEED;

  /**
   * Resets the cannon's angle to 0.
   */
  reset() {
    this.#angle = 0;
    this.#angularVelocity = CANON_ANGULAR_SPEED;
  }

  getAngle(): number {
    return this.#angle + Math.PI / 2;
  }

  /**
   * Updates the cannon's state (position and direction) based on time delta.
   * Handles the oscillation logic using sub-stepping to prevent overshooting.
   * @param frameTime The current frame time in seconds.
   * @param lastFrameTime The last frame time in seconds.
   */
  update(frameTime: number, lastFrameTime: number) {
    let dt = frameTime - lastFrameTime;
    const limit = Math.PI / 2;

    while (dt > 0) {
      // Distance to the boundary we are moving towards
      let distToBoundary = 0;
      if (this.#angularVelocity > 0) {
        distToBoundary = limit - this.#angle;
      } else {
        distToBoundary = this.#angle - (-limit);
      }

      // Time to hit boundary
      // Avoid division by zero if velocity is 0 (shouldn't happen per constants but safe to check)
      const timeToBoundary = this.#angularVelocity !== 0 ? Math.abs(distToBoundary / this.#angularVelocity) : Infinity;

      if (dt < timeToBoundary) {
        // No bounce
        this.#angle += this.#angularVelocity * dt;
        dt = 0;
      } else {
        // Move to boundary
        this.#angle += this.#angularVelocity * timeToBoundary;
        // Flip direction
        this.#angularVelocity = -this.#angularVelocity;
        // Reduce dt and continue
        dt -= timeToBoundary;

        // Safety break for extremely small dt to prevent infinite loops due to precision
        if (dt < 1e-9) dt = 0;
      }
    }

    // Clamp at the end just in case of float drift
    if (this.#angle > limit) this.#angle = limit;
    if (this.#angle < -limit) this.#angle = -limit;
  }
}

export class ManualCannon implements Cannon {
  angle = Math.PI / 2;

  getAngle(): number {
    return this.angle;
  }
}
