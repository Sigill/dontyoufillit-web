import { makeCannonBall } from "../../core/ball";
import { BallEngineMath } from "../../core/ball-engine/ball-engine-math";
import { ManualCannon } from "../bot";
import { Bot } from "../bot-type";

export class AimingBot implements Bot {
  name = "AimingBot";

  act(ballEngine: BallEngineMath, cannon: ManualCannon): void {
    let bestAngle = cannon.getAngle();
    let maxHits = -1;
    let isBestSafe = false;

    // Scan angles from 0.1 to PI - 0.1
    for (let angle = 0.1; angle < Math.PI - 0.1; angle += 0.05) {
      const simulationEngine = new BallEngineMath();
      simulationEngine.staticBalls = ballEngine.staticBalls.map(b => ({ ...b }));

      const ball = makeCannonBall({ angle });
      simulationEngine.fire(ball);
      const { score: hits, gameover } = simulationEngine.update(3, 0);
      const isSafe = !gameover;

      if (isSafe && !isBestSafe) {
        // Found first safe angle
        maxHits = hits;
        bestAngle = angle;
        isBestSafe = true;
      } else if (isSafe === isBestSafe) {
        // Both safe or both unsafe, pick the one with more hits
        if (hits > maxHits) {
          maxHits = hits;
          bestAngle = angle;
        }
      }
    }

    cannon.angle = bestAngle;
  }
}
