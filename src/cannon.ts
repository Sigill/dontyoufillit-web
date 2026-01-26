import { CANON_ANGULAR_SPEED } from "./constants";
import { RK41DObject } from "./rk4-integrator";

/**
 * Represents the cannon that fires balls.
 * It oscillates back and forth within a specific angular range.
 */
export class Cannon {
  #integrator = new class extends RK41DObject {
    constructor() {
      super(0, CANON_ANGULAR_SPEED);
    }

    override acceleration() {
      return 0;
    }
  };

  /**
   * Resets the cannon's angle to 0.
   */
  reset() {
    this.#integrator.u = 0;
  }

  /**
   * Gets the current angle of the cannon.
   * @returns The angle in radians, adjusted by 90 degrees (PI/2).
   */
  getAngle(): number {
    return this.#integrator.u + Math.PI / 2;
  }

  /**
   * Updates the cannon's state (position and direction) based on time delta.
   * Handles the oscillation logic using sub-stepping to prevent overshooting.
   * @param t - Current time (unused in calculation but required by interface).
   * @param dt - Time delta since last update.
   */
  update(t: number, dt: number) {
    while (dt > 0) {
      // Calculate time to reach the next boundary based on current direction
      let timeToBoundary: number;
      if (this.#integrator.v >= 0) {
        // Moving towards +PI/2
        timeToBoundary = (Math.PI / 2 - this.#integrator.u) / this.#integrator.v;
      } else {
        // Moving towards -PI/2
        timeToBoundary = (-Math.PI / 2 - this.#integrator.u) / this.#integrator.v;
      }

      // If timeToBoundary is extremely small (e.g. floating point error), force a tiny step or just flip
      // But robustly: step by min(dt, timeToBoundary)
      // Use a small epsilon to ensure we actually hit/cross constraints if they are super close
      const timeStep = Math.min(dt, Math.max(0, timeToBoundary));

      this.#integrator.integrate(t, timeStep);
      dt -= timeStep;

      // Check if we hit a boundary
      if (Math.abs(this.#integrator.u) >= Math.PI / 2 - 1e-9) { // Use epsilon for "close enough"
        // Clamp to boundary to prevent drift
        this.#integrator.u = Math.sign(this.#integrator.u) * Math.PI / 2;
        // Flip direction
        this.#integrator.v *= -1;
      }

      // If we still have dt but v is 0 (shouldn't happen with constant speed), break to avoid infinite loop
      if (this.#integrator.v === 0 && dt > 0) {
        break;
      }
    }
  }
}
