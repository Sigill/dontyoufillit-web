import { RK41DObject } from "./rk4-integrator";

export class Cannon {
  #integrator = new class extends RK41DObject {
    constructor() {
      super(0, Math.PI / 3);
    }

    override acceleration() {
      return 0;
    }
  };

  reset() {
    this.#integrator.u = 0;
  }

  getAngle(): number {
    return this.#integrator.u + Math.PI / 2;
  }

  update(t: number, dt: number) {
    this.#integrator.integrate(t, dt);

    if (Math.abs(this.#integrator.u) >= Math.PI / 2) {
      this.#integrator.u = ((Math.PI / 2) - Math.abs(Math.PI / 2 - Math.abs(this.#integrator.u))) * Math.sign(this.#integrator.u);
      this.#integrator.v *= -1;
    }
  }
}
