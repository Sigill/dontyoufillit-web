import { StaticBall } from "../core/ball";
import { Cannon } from "../core/cannon";


export interface Bot {
  name: string;
  act(staticBalls: Array<StaticBall>, cannon: Cannon): void;
}
