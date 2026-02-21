import { makeCannonBall, StaticBall } from "../../core/ball";
import { computeFixedPoints } from "../../core/ball-engine/ball-engine-math";
import { ManualCannon } from "../../core/cannon";
import { Bot } from "../bot-type";

/**
 * A greedy bot that evaluates the best angle based on the immediate next turn.
 *
 * It scans a wide range of firing angles and simulates a single trajectory for each.
 * The bot's decision logic follows a strict hierarchy:
 * 1. Prefer any "safe" angle (one that doesn't result in a game over) over an "unsafe" one.
 * 2. Between two angles of equal safety, choose the one that maximizes the number of ball hits.
 *
 * Unlike the LookAheadAimingBot, this bot does not consider the long-term consequences
 * of how its current shot will set up the board for subsequent turns.
 */
export class AimingBot implements Bot {
  name = "AimingBot";

  act(staticBalls: Array<StaticBall>, cannon: ManualCannon): void {
    let bestAngle = cannon.getAngle();
    let maxScore = -1;
    let isBestSafe = false;

    // Scan angles from 0.1 to PI - 0.1
    for (let angle = 0.1; angle < Math.PI - 0.1; angle += 0.05) {
      const ball = makeCannonBall({ angle });
      const { score, gameover } = computeFixedPoints(ball, staticBalls);
      const isSafe = !gameover;

      if (isSafe && !isBestSafe) {
        // Found first safe angle
        maxScore = score;
        bestAngle = angle;
        isBestSafe = true;
      } else if (isSafe === isBestSafe) {
        // Both safe or both unsafe, pick the one with more hits
        if (score > maxScore) {
          maxScore = score;
          bestAngle = angle;
        }
      }
    }

    cannon.angle = bestAngle;
  }
}
