import { BallEngineMath } from "../core/ball-engine/ball-engine-math";
import { Cannon } from "../core/cannon";
import { CssBoard } from "../ui/css-board";
import { HUD } from "../ui/hud";
import { selectElement } from "../core/utils";
import { makeCannonBall } from "../core/ball";
import { AimingBot } from "./bots/aiming-bot";
import { Bot } from "./bot-type";

enum GameState {
  PAUSED = 1,
  RUNNING = 2,
  GAMEOVER = 3,
}

const BOTS: Record<string, Bot> = {
  [AimingBot.name]: new AimingBot(),
};

export class ManualCannon implements Cannon {
  angle = Math.PI / 2;

  getAngle(): number {
    return this.angle;
  }
}

const queryParams = new URLSearchParams(window.location.search);
const botName = queryParams.get('bot') || AimingBot.name;
const activeBot = BOTS[botName] || BOTS[AimingBot.name];

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
