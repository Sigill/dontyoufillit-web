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
   * Handles the oscillation logic, reversing direction when limits are reached.
   * @param t - Current time (unused in calculation but required by interface).
   * @param dt - Time delta since last update.
   */
  update(t: number, dt: number) {
    this.#integrator.integrate(t, dt);

    if (Math.abs(this.#integrator.u) >= Math.PI / 2) {
      this.#integrator.u = ((Math.PI / 2) - Math.abs(Math.PI / 2 - Math.abs(this.#integrator.u))) * Math.sign(this.#integrator.u);
      this.#integrator.v *= -1;
    }
  }
}
