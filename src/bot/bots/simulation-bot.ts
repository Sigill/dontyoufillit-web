import { makeCannonBall } from "../../core/ball";
import { BallEngineMath } from "../../core/ball-engine/ball-engine-math";
import { ManualCannon } from "../bot";
import { Bot } from "../bot-type";

export class SimulationBot implements Bot {
  name = "SimulationBot";
  depth = 2;

  constructor(depth?: number) {
    if (depth !== undefined) {
      this.depth = depth;
    }
  }

  act(ballEngine: BallEngineMath, cannon: ManualCannon): void {
    const { angle: bestAngle } = this.findBestMove(ballEngine, this.depth);
    cannon.angle = bestAngle;
  }

  private findBestMove(ballEngine: BallEngineMath, depth: number): { angle: number; score: number } {
    let bestAngle = Math.PI / 2;
    let maxScore = -Infinity;

    // Scan angles from 0.1 to PI - 0.1
    // Using a slightly coarser step for performance if depth > 1
    const step = depth > 1 ? 0.1 : 0.05;
    // const step = 0.1;

    for (let angle = 0.1; angle < Math.PI - 0.1; angle += step) {
      const { score, gameover, nextEngine } = this.simulateFire(ballEngine, angle);

      let currentTotalScore = 0;
      if (gameover) {
        currentTotalScore = -1000000; // Heavy penalty for gameover
      } else {
        currentTotalScore = score;
        if (depth > 1 && nextEngine) {
          const result = this.findBestMove(nextEngine, depth - 1);
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

  private simulateFire(ballEngine: BallEngineMath, angle: number): { score: number; gameover: boolean; nextEngine: BallEngineMath | null } {
    const simulationEngine = new BallEngineMath({ verbose: false });
    simulationEngine.staticBalls = ballEngine.staticBalls.map(b => ({ ...b }));

    const ball = makeCannonBall({ angle });
    simulationEngine.fire(ball);

    // update(3, 0) is enough to simulate the whole trajectory in BallEngineMath
    const { score, gameover } = simulationEngine.update(10, 0);

    return {
      score,
      gameover,
      nextEngine: gameover ? null : simulationEngine
    };
  }
}
