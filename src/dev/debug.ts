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

function disk(x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

for (const w of Object.values(GameWalls)) {
  line(w.x0, w.y0, w.x1, w.y1);
}

const { ball, staticBalls } = makeBalls({
  ball: {
    radius: 0.025,
    angle: 0.9000000000000002,
    x: 0.5414406645513776,
    y: -0.04777820602483442,
    velocity: 1,
    acceleration: -0.4
  },
  staticBalls: [
    { x: 0.13991118238393296, y: 0.03144733191832394, radius: 0.03144733191832394, counter: 1 },
    { x: 0.06552516789681753, y: 0.9518441423635728, radius: 0.04815585763642716, counter: 2 },
    { x: 0.8813627595963455, y: 0.6004773628628752, radius: 0.03276362664525044, counter: 1 },
    { x: 0.8019828185989984, y: 0.9708228034109408, radius: 0.02917719658905915, counter: 2 },
    { x: 0.06462744767686635, y: 0.8148068267418627, radius: 0.06462744767686635, counter: 3 },
    { x: 0.16736054342094986, y: 0.7955323636080318, radius: 0.0398981180487514, counter: 2 },
    { x: 0.11415295418546924, y: 0.7262204588442293, radius: 0.03686304632246605, counter: 2 },
    { x: 0.6172290496208201, y: 0.9306109848516088, radius: 0.03288436423201754, counter: 3 },
    { x: 0.3426760354151431, y: 0.9559593497125043, radius: 0.04404065028749571, counter: 3 },
    { x: 0.2918324975217727, y: 0.7521707210874774, radius: 0.09191045299182132, counter: 2 },
    { x: 0.04950693530416406, y: 0.040500729413881595, radius: 0.040500729413881595, counter: 3 },
    { x: 0.4645580695948107, y: 0.5764709039943464, radius: 0.030900230719331928, counter: 3 },
    { x: 0.7458560144588637, y: 0.5038590055346757, radius: 0.13366108591437542, counter: 2 },
    { x: 0.430770782120473, y: 0.3039451524834007, radius: 0.23949337577614815, counter: 2 },
    { x: 0.8659649643578391, y: 0.13898558543077127, counter: 3, radius: 0.1340350356421609 }
  ]
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

const { fixedPoints } = computeFixedPoints(
  { ...ball, velocity: Constants.DEFAULT_BALL_VELOCITY, acceleration: Constants.DEFAULT_BALL_ACCELERATION },
  staticBalls
);

// --------------------------------------

for (const [a, b] of pairwise(fixedPoints)) {
  line(a.x, a.y, b.x, b.y);
  ctx.save();
  ctx.fillStyle = 'green';
  disk(b.x, b.y, 0.01);
  ctx.restore();

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
