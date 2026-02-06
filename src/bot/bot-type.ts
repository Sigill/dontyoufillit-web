import { BallEngineMath } from "../core/ball-engine/ball-engine-math";
import { Cannon } from "../core/cannon";


export interface Bot {
  name: string;
  act(ballEngine: BallEngineMath, cannon: Cannon): void;
}
