export interface RK41DObject_State {
  u: number;
  v: number;
}

export interface RK41DObject_Derivative {
  du: number;
  dv: number;
}

export abstract class RK41DObject {
  state: RK41DObject_State = { u: 0, v: 0 };

  abstract acceleration(state: RK41DObject_State, t: number): number;

  private evaluate(
    initialState: RK41DObject_State,
    t: number,
    dt: number,
    derivative: RK41DObject_Derivative
  ): RK41DObject_Derivative {
    const state: RK41DObject_State = {
      u: initialState.u + derivative.du * dt,
      v: initialState.v + derivative.dv * dt,
    };

    return {
      du: state.v,
      dv: this.acceleration(state, t + dt),
    };
  }

  integrate(t: number, dt: number): void {
    const a = this.evaluate(this.state, t, 0, {du: 0, dv: 0});
    const b = this.evaluate(this.state, t, dt * 0.5, a);
    const c = this.evaluate(this.state, t, dt * 0.5, b);
    const d = this.evaluate(this.state, t, dt, c);

    const dudt = 1 / 6 * (a.du + 2 * (b.du + c.du) + d.du);
    const dvdt = 1 / 6 * (a.dv + 2 * (b.dv + c.dv) + d.dv);

    this.state.u = this.state.u + dudt * dt;
    this.state.v = this.state.v + dvdt * dt;
  }
}
