export interface RK41DObject_State {
  u: number;
  s: number;
}

export interface RK41DObject_Derivative {
  du: number;
  ds: number;
}

export abstract class RK41DObject {
  state: RK41DObject_State = { u: 0, s: 0 };

  abstract acceleration(state: RK41DObject_State, t: number): number;

  private evaluate(
    initialState: RK41DObject_State,
    t: number,
    dt: number,
    derivative: RK41DObject_Derivative
  ): RK41DObject_Derivative {
    const state: RK41DObject_State = {
      u: initialState.u + derivative.du * dt,
      s: initialState.s + derivative.ds * dt,
    };

    return {
      du: state.s,
      ds: this.acceleration(state, t + dt),
    };
  }

  integrate(t: number, dt: number): void {
    const a = this.evaluate(this.state, t, 0, {du: 0, ds: 0});
    const b = this.evaluate(this.state, t, dt * 0.5, a);
    const c = this.evaluate(this.state, t, dt * 0.5, b);
    const d = this.evaluate(this.state, t, dt, c);

    const dxdt = 1 / 6 * (a.du + 2 * (b.du + c.du) + d.du);
    const dvdt = 1 / 6 * (a.ds + 2 * (b.ds + c.ds) + d.ds);

    this.state.u = this.state.u + dxdt * dt;
    this.state.s = this.state.s + dvdt * dt;
  }
}