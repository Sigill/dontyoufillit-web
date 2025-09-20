import { RK41DObject } from "./rk4-integrator.js";

export class Cannon extends RK41DObject {
  constructor() {
    super();
    this.state.u = 0;
    this.state.v = Math.PI / 3;
  }

  override acceleration(): number {
    return 0;
  }

  getAngle(): number {
    return this.state.u + Math.PI / 2;
  }

  update(t: number, dt: number) {
    this.integrate(t, dt);

    if (Math.abs(this.state.u) >= Math.PI / 2) {
      this.state.u = ((Math.PI / 2) - Math.abs(Math.PI / 2 - Math.abs(this.state.u))) * Math.sign(this.state.u);
      this.state.v *= -1;
    }
  }
}
