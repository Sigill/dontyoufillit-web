import { StaticBall } from "../core/ball";
import { ManualCannon } from "../core/cannon";


export interface Bot {
  name: string;
  act(staticBalls: Array<StaticBall>, cannon: ManualCannon): void;
}
