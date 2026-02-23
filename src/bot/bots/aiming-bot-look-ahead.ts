import { makeCannonBall, StaticBall } from "../../core/ball";
import { ManualCannon } from "../../core/cannon";
import { computeFixedPoints } from "../../core/collision-solver/fixed-points";
import { Bot } from "../bot-type";

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
  #simulationCount: number = 0;
  optimize: string;

  constructor({depth = 2, criteria = 'score' }: {depth?: number; criteria?: 'score' | 'hits'} = {}) {
    this.depth = depth;
    this.optimize = criteria;
  }

  act(staticBalls: Array<StaticBall>, cannon: ManualCannon): void {
    this.#simulationCount = 0;
    const { angle: bestAngle } = this.findBestMove(staticBalls, this.depth);
    console.log(`${this.name}: ${this.#simulationCount} simulations`);
    cannon.angle = bestAngle;
  }

  private findBestMove(staticBalls: Array<StaticBall>, depth: number): { angle: number; score: number } {
    let bestAngle = Math.PI / 2;
    let maxScore = -Infinity;

    // Scan angles from 0.1 to PI - 0.1
    // Using a slightly coarser step for performance if depth > 1
    const step = depth > 1 ? 0.1 : 0.05;
    // const step = 0.1;

    for (let angle = 0.1; angle < Math.PI - 0.1; angle += step) {
      const { score, hits, gameover, staticBalls: nextStaticBalls } = this.simulateFire(staticBalls, angle);

      let currentTotalScore = 0;
      if (gameover) {
        currentTotalScore = -1000000; // Heavy penalty for gameover
      } else {
        const criteria = this.optimize === 'hits' ? hits : score;
        currentTotalScore = criteria;
        if (depth > 1 && nextStaticBalls) {
          const result = this.findBestMove(nextStaticBalls, depth - 1);
          currentTotalScore += result.score;
        }
      }

      if (currentTotalScore > maxScore) {
        maxScore = currentTotalScore;
        bestAngle = angle;
      }
    }

    return { angle: bestAngle, score: maxScore };
  }

  private simulateFire(
    staticBalls: Array<StaticBall>,
    angle: number,
  ): { score: number; hits: number; gameover: boolean; staticBalls: Array<StaticBall> | null } {
    this.#simulationCount += 1;

    const ball = makeCannonBall({ angle });
    const { score, hits, gameover, staticBalls: nextStaticBalls } = computeFixedPoints(ball, staticBalls, { epsilon: 1e-10 });

    return {
      score,
      hits,
      gameover,
      staticBalls: gameover ? null : nextStaticBalls
    };
  }
}
