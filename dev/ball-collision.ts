import { type Tab } from 'bootstrap';
import * as Constants from "../src/constants";
import { computeCollisionWithBall } from "../src/collision-solver";
import { selectElement } from '../src/utils';

declare function getTab(element: string | Element): Tab;

const tabs = selectElement('#v-pills-tab')!;

interface Ball {
  radius: number;
  x: number;
  y: number;
}

const cases: Array<[string, { position: { x: number; y: number; }; direction: { x: number; y: number; }; ball: Ball; }]> = [
  ['90 top', {position: {x: 0.5, y: 0.5}, direction: {x: 0.5, y: 1}, ball: {x: 0.5, y: 1, radius: 2 * Constants.DEFAULT_BALL_RADIUS}}],
  ['90 bottom', {position: {x: 0.5, y: 0.5}, direction: {x: 0.5, y: 0}, ball: {x: 0.5, y: 0, radius: 2 * Constants.DEFAULT_BALL_RADIUS}}],
  ['90 left', {position: {x: 0.5, y: 0.5}, direction: {x: 0, y: 0.5}, ball: {x: 0, y: 0.5, radius: 2 * Constants.DEFAULT_BALL_RADIUS}}],
  ['90 right', {position: {x: 0.5, y: 0.5}, direction: {x: 1, y: 0.5}, ball: {x: 1, y: 0.5, radius: 2 * Constants.DEFAULT_BALL_RADIUS}}],
];

for (const [title, config] of cases) {
  const btn = document.createElement('button');
  btn.classList = 'nav-link';
  btn.dataset.bsToggle = 'pill';
  btn.type = 'button';
  btn.role = 'tab';
  btn.innerText = title;

  btn.addEventListener('show.bs.tab', () => {
    const mainContainer = document.querySelector('#main-container')!;
    mainContainer.replaceChildren();

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 500;
    const ctx = canvas.getContext('2d')!;
    mainContainer.append(canvas);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    ctx.translate(50, 50);
    ctx.scale(400, 400);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1 / 400;

    function line(x0: number, y0: number, x1: number, y1: number) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    function circle(x: number, y: number, r: number) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    const angle = direction(config.position.x, config.position.y, config.direction.x, config.direction.y);

    const ballState = {
      t: 0,
      ...config.position,
      angle,
      velocity: Constants.DEFAULT_BALL_VELOCITY,
      acceleration: Constants.DEFAULT_BALL_ACCELERATION,
      radius: Constants.DEFAULT_BALL_RADIUS,
    };

    circle(config.ball.x, config.ball.y, config.ball.radius);

    circle(ballState.x, ballState.y, ballState.radius);
    line(ballState.x, ballState.y, config.direction.x, config.direction.y);

    const plotContainer = document.createElement('div');
    mainContainer.append(plotContainer);

    const t = computeCollisionWithBall(ballState, config.ball, 1e-5, -ballState.velocity / ballState.acceleration, { epsilon: 1e-5 });
    if (t !== undefined) {
      const c = {
        x: 1/2 * ballState.acceleration * Math.cos(angle) * t**2 + ballState.velocity * Math.cos(angle) * t + ballState.x,
        y: 1/2 * ballState.acceleration * Math.sin(angle) * t**2 + ballState.velocity * Math.sin(angle) * t + ballState.y,
      };
      circle(
        c.x, c.y,
        ballState.radius,
      );
    }
  });

  tabs?.append(btn);

  getTab(btn);
}

getTab(tabs.querySelectorAll('button')[0]).show();

function direction(x0: number, y0: number, x1: number, y1: number) {
  return Math.atan2(y1 - y0, x1 - x0);
}
