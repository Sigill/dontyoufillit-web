import { BallEngineMath } from "../core/ball-engine/ball-engine-math";
import { Cannon } from "../core/cannon";
import { CssBoard } from "../ui/css-board";
import { HUD } from "../ui/hud";
import { selectElement } from "../core/utils";
import { makeCannonBall } from "../core/ball";
import { AimingBot } from "./bots/aiming-bot";
import { AimingBotLookAhead } from "./bots/aiming-bot-look-ahead";
import { Bot } from "./bot-type";
import { DEFAULT_BALL_ACCELERATION, DEFAULT_BALL_VELOCITY } from "../core/constants";

enum GameState {
  PAUSED = 1,
  RUNNING = 2,
  GAMEOVER = 3,
}

const queryParams = new URLSearchParams(window.location.search);
const depth = parseInt(queryParams.get('depth') || '2', 10);

const BOTS: Record<string, Bot> = {
  [AimingBot.name]: new AimingBot(),
  [AimingBotLookAhead.name]: new AimingBotLookAhead({depth}),
};

export class ManualCannon implements Cannon {
  angle = Math.PI / 2;

  getAngle(): number {
    return this.angle;
  }
}

const botName = queryParams.get('bot') || AimingBot.name;
const activeBot = BOTS[botName] || BOTS[AimingBot.name];

const cannon = new ManualCannon();
const ballEngine = (window as any).ballEngine = new BallEngineMath({withSnapshots: false});

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

const speedup = 8;
const velocity = DEFAULT_BALL_VELOCITY * speedup;
const acceleration = DEFAULT_BALL_ACCELERATION * speedup * speedup;

activeBot.act(ballEngine.staticBalls, cannon);
ballEngine.fire(makeCannonBall({angle: cannon.getAngle(), velocity, acceleration}));

const botStats = {totalThinkingTime: 0, totalShots: 0};

setInterval(() => {
  if (state === GameState.RUNNING && ballEngine.currentBall === null) {
    // bot action
    const start = performance.now();
    activeBot.act(ballEngine.staticBalls, cannon);
    const end = performance.now();
    botStats.totalThinkingTime += end - start;
    botStats.totalShots++;
    console.log(`Bot thinking time: ${(end - start).toFixed(1)}ms, average: ${(botStats.totalThinkingTime / botStats.totalShots).toFixed(1)}ms`);

    // fire
    const angle = cannon.getAngle();
    ballEngine.fire(makeCannonBall({angle, velocity, acceleration}));
  }
}, 50);
