import { type Tab } from 'bootstrap';
import * as Constants from "../core/constants";
import { WallSide } from "../core/collision-solver/ball-wall-collision-solver";
import { computeCollisionsWithWalls } from "../core/collision-solver/ball-wall-collision-solver";
import { selectElement } from '../core/utils';
import { makeWall, GameWalls } from '../core/ball-engine/walls';

declare function getTab(element: string | Element): Tab;

const tabs = selectElement('#v-pills-tab');

const cases: Array<[string, { position: { x: number; y: number; }; direction: { x: number; y: number; }; walls: Array<WallSide>; }]> = [
  ['90 top', {position: {x: 0.5, y: 0.5}, direction: {x: 0.5, y: 1}, walls: [GameWalls.top]} ],
  ['90 right', {position: {x: 0.5, y: 0.5}, direction: {x: 0.5, y: 1}, walls: [GameWalls.right]} ],
  ['90 bottom', {position: {x: 0.5, y: 0.5}, direction: {x: 0.5, y: 1}, walls: [GameWalls.bottom]} ],
  ['90 left', {position: {x: 0.5, y: 0.5}, direction: {x: 0.5, y: 1}, walls: [GameWalls.left]} ],
  ['45 top', {position: {x: 0.5, y: 0.5}, direction: {x: 0, y: 1}, walls: [GameWalls.top]} ],
  ['45 right', {position: {x: 0.5, y: 0.5}, direction: {x: 0, y: 1}, walls: [GameWalls.right]} ],
  ['45 bottom', {position: {x: 0.5, y: 0.5}, direction: {x: 0, y: 1}, walls: [GameWalls.bottom]} ],
  ['45 left', {position: {x: 0.5, y: 0.5}, direction: {x: 0, y: 1}, walls: [GameWalls.left]} ],
  ['45 all', {position: {x: 0.5, y: 0.5}, direction: {x: 0, y: 1}, walls: Object.values(GameWalls)} ],
  ['45 1', {
    position: {x: 0.5, y: 0},
    direction: {x: 0.5, y: 1},
    walls: [makeWall({ x0: 0.5, y0: 1, x1: 0, y1: 0, sigma: 1 })]
  }],
  ['45 2', {
    position: {x: 0.5, y: 0},
    direction: {x: 0.5, y: 1},
    walls: [makeWall({ x0: 0.5, y0: 1, x1: 1, y1: 0, sigma: 1 })]
  }],
  ['45 all', {
    position: {x: 0.5, y: 0},
    direction: {x: 0.5, y: 1},
    walls: [
      makeWall({ x0: 0.5, y0: 1, x1: 0, y1: 0, sigma: 1 }),
      makeWall({ x0: 0.5, y0: 1, x1: 1, y1: 0, sigma: 1 }),
    ]
  }],
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

    config.walls.forEach(w => line(w.x0, w.y0, w.x1, w.y1));

    circle(ballState.x, ballState.y, ballState.radius);
    line(ballState.x, ballState.y, config.direction.x, config.direction.y);

    const plotContainer = document.createElement('div');
    mainContainer.append(plotContainer);

    const collisions = [...computeCollisionsWithWalls(ballState, config.walls)];
    for (const collision of collisions) {
      console.log(collision);
      const { t } = collision;
      const c = {
        x: 1/2 * ballState.acceleration * Math.cos(angle) * t**2 + ballState.velocity * Math.cos(angle) * t + ballState.x,
        y: 1/2 * ballState.acceleration * Math.sin(angle) * t**2 + ballState.velocity * Math.sin(angle) * t + ballState.y,
      };
      circle(
        c.x, c.y,
        ballState.radius,
      );

      const wall = collision.obstacle.value;
      const q = {
        x: c.x + wall.sigma * ballState.radius * -wall.angle.sin,
        y: c.y + wall.sigma * ballState.radius * wall.angle.cos
      };
      circle(q.x, q.y, 1/100);
    }
  });

  tabs?.append(btn);

  getTab(btn);
}

getTab(tabs.querySelectorAll('button')[0]).show();

function direction(x0: number, y0: number, x1: number, y1: number) {
  return Math.atan2(y1 - y0, x1 - x0);
}
