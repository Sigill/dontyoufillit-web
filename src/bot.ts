import { BallEngineMath } from "./ball-engine-math";
import { Cannon } from "./cannon";
import { CssBoard } from "./css-board";
import { HUD } from "./hud";
import { selectElement } from "./utils";
import { makeCannonBall } from "./ball";

enum GameState {
  PAUSED = 1,
  RUNNING = 2,
  GAMEOVER = 3,
}

class ManualCannon implements Cannon {
  angle = Math.PI / 2;

  getAngle(): number {
    return this.angle;
  }
}

const queryParams = new URLSearchParams(window.location.search);

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

ballEngine.fire(makeCannonBall({angle: cannon.getAngle()}));

setInterval(() => {
  if (state === GameState.RUNNING && ballEngine.currentBall === null) {
    // fire
    const angle = cannon.getAngle();
    ballEngine.fire(makeCannonBall({angle}));
  }
}, 200);
