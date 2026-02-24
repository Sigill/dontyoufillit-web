import { StaticBall } from "../../core/ball";
import { ManualCannon } from "../../core/cannon";
import { Bot } from "../bot-type";
import { findBestMove } from "../simulation";

/**
 * A bot that uses recursive simulation to look multiple turns ahead.
 *
 * It evaluates possible angles by simulating the ball's trajectory and the resulting board state.
 * For each angle, it recursively calculates the best possible score in subsequent turns
 * up to a specified depth.
 *
 * The bot's primary goals are:
 * 1. Avoid any sequence of moves that leads to a "game over" state.
 * 2. Maximize the total points scored across all simulated turns.
 */
export class AimingBotLookAhead implements Bot {
  name = "AimingBotLookAhead";
  depth: number;
  criteria: 'score' | 'hits';

  constructor({depth = 2, criteria = 'score' }: {depth?: number; criteria?: 'score' | 'hits'} = {}) {
    this.depth = depth;
    this.criteria = criteria;
  }

  act(staticBalls: Array<StaticBall>, cannon: ManualCannon): void {
    const stats = { value: 0 };
    const { angle: bestAngle }
      = findBestMove(staticBalls, { depth: this.depth, criteria: this.criteria, stats });
    console.log(`${this.name}: ${stats.value} simulations`);
    cannon.angle = bestAngle;
  }
}
