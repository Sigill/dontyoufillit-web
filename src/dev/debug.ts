import { BallEngineMath, computeFixedPoints, ppObstacle } from '../core/ball-engine/ball-engine-math';
import { makeBalls } from '../core/ball';
import * as Constants from '../core/constants';
import { directionalArrow, ppAngle } from '../core/utils';

const GameWalls = {
  top: {x0: 0, y0: 1, x1: 1, y1: 1}, // top
  right: {x0: 1, y0: 1, x1: 1, y1: 0}, // right
  bottom: {x0: 1, y0: 0, x1: 0, y1: 0}, // bottom
  left: {x0: 0, y0: 0, x1: 0, y1: 1}, // left
};

const canvas = document.createElement('canvas');
canvas.width = canvas.height = 500;
document.body.append(canvas);

const ctx = canvas.getContext('2d')!;
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

for (const w of Object.values(GameWalls)) {
  line(w.x0, w.y0, w.x1, w.y1);
}

const { ball, staticBalls } = makeBalls({
  ball: {},
});

ctx.fillStyle = 'white';
for (const b of staticBalls) {
  circle(b.x, b.y, b.radius);
}

ctx.fillStyle = 'black';
circle(ball.x, ball.y, ball.radius);

function* pairwise<T>(items: Array<T>) {
  if (items.length < 2) {
    throw new Error("Not enough items");
  }

  for (let i = 1; i < items.length; i += 1) {
    yield [items[i - 1], items[i]];
  }
}

const fixedPointsGenerator = computeFixedPoints(
  { ...ball, velocity: Constants.DEFAULT_BALL_VELOCITY, acceleration: Constants.DEFAULT_BALL_ACCELERATION },
  staticBalls
);

// --------------------------------------

for (const [a, b] of pairwise(fixedPointsGenerator)) {
  line(a.x, a.y, b.x, b.y);

  const {t, x, y, angle, velocity, obstacles: obstacles} = b;
  for (const obstacle of obstacles) {
    console.debug(`Collision with ${ppObstacle(obstacle)}`);
  }
  console.debug(`Δt:${t.toFixed(3)} ${directionalArrow(Math.cos(angle) * velocity, Math.sin(angle) * velocity)} x:${x.toFixed(3)} y:${y.toFixed(3)} v:${velocity.toFixed(3)} angle:${ppAngle(angle)}`);
}

const engine = new BallEngineMath();
engine.staticBalls = staticBalls;
engine.fire(ball);
engine.update(2.5, 0);

// for (let i = 0; i < fixedPoints.length - 1; i += 1) {
//   const a = fixedPoints[i];
//   const b = fixedPoints[i + 1];
//   line(a.x, a.y, b.x, b.y);
// }
