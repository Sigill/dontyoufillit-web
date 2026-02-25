import { StaticBall } from "../../core/ball";
import { ManualCannon } from "../../core/cannon";
import { Bot } from "../bot-type";
import { findBestMove } from "../simulation";

/**
 * A bot that uses recursive simulation to look multiple turns ahead.
 *
 * It evaluates possible angles by simulating the ball's trajectory and the resulting board state.
 * For each angle, it recursively calculates the best possible reward in subsequent turns
 * up to a specified number or turns and number of steps per turn.
 */
export class AimingBot implements Bot {
  name = "AimingBot";
  steps: number[];
  criteria: 'score' | 'hits';

  constructor({steps = [120, 120], criteria = 'hits' }: {steps?: number[]; criteria?: 'score' | 'hits'} = {}) {
    this.steps = steps;
    this.criteria = criteria;
  }

  act(staticBalls: Array<StaticBall>, cannon: ManualCannon): void {
    const stats = { value: 0 };
    const { angle: bestAngle }
      = findBestMove(staticBalls, { steps: this.steps, criteria: this.criteria, stats });
    console.log(`${this.name}: ${stats.value} simulations`);
    cannon.angle = bestAngle;
  }
}
