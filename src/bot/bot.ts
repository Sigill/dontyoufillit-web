import { BallEngineMath } from "../core/ball-engine/ball-engine-math";
import { Cannon } from "../core/cannon";
import { CssBoard } from "../ui/css-board";
import { HUD } from "../ui/hud";
import { selectElement } from "../core/utils";
import { makeCannonBall } from "../core/ball";

enum GameState {
  PAUSED = 1,
  RUNNING = 2,
  GAMEOVER = 3,
}

interface Bot {
  name: string;
  act(ballEngine: BallEngineMath, cannon: Cannon): void;
}

class StaticBot implements Bot {
  name = "StaticBot";
  act(): void {
    // Does nothing, just keeps the default angle.
  }
}

class AimingBot implements Bot {
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

const BOTS: Record<string, Bot> = {
  StaticBot: new StaticBot(),
  AimingBot: new AimingBot(),
};

class ManualCannon implements Cannon {
  angle = Math.PI / 2;

  getAngle(): number {
    return this.angle;
  }
}

const queryParams = new URLSearchParams(window.location.search);
const botName = queryParams.get('bot') || 'AimingBot';
const activeBot = BOTS[botName] || BOTS.AimingBot;

const cannon = new ManualCannon();
const ballEngine = (window as any).ballEngine = new BallEngineMath();

const hud = new HUD();
selectElement<HTMLDivElement>('.hud').appendChild(hud);

const renderer = new CssBoard();
selectElement<HTMLDivElement>('.game').appendChild(renderer);

let score = 0;
let state = GameState.RUNNING;

function render() {
  hud.render({score, highscore: 0, lives: 0});
  renderer.render(ballEngine, cannon);
}

function step(frameTime: number, lastFrameTime: number) {
  const updateState = ballEngine.update(frameTime / 1000, lastFrameTime / 1000);
  score += updateState.score;

  if (updateState.gameover) {
    state = GameState.GAMEOVER;
  }

  render();

  requestAnimationFrame(nextFrameTime => step(nextFrameTime, frameTime));
}

// Start Loop
requestAnimationFrame((frameTime: number) => {
  render();
  requestAnimationFrame(nextFrameTime => step(nextFrameTime, frameTime));
});

activeBot.act(ballEngine, cannon);
ballEngine.fire(makeCannonBall({angle: cannon.getAngle()}));

setInterval(() => {
  if (state === GameState.RUNNING && ballEngine.currentBall === null) {
    // bot action
    activeBot.act(ballEngine, cannon);

    // fire
    const angle = cannon.getAngle();
    ballEngine.fire(makeCannonBall({angle}));
  }
}, 200);
