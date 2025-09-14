import * as Constants from "./constants";
import { BallEngine } from "./ball-engine";
import { computeExpandedRadius, StaticBall } from "./static-ball";
import { directionalArrow, ppAngle, solveQuadratic } from "./utils";

export interface Wall {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface WallObstacle {
  type: 'wall';
  value: Wall & {
    sigma: number;
  };
}

type BallObstacle = {
  type: 'ball';
  value: StaticBall;
};

export type Obstacle = WallObstacle | BallObstacle;

export interface Collision<O> {
  t: number;
  with: O;
}

const GameWalls = {
  top: {x0: 0, y0: 1, x1: 1, y1: 1}, // top
  right: {x0: 1, y0: 1, x1: 1, y1: 0}, // right
  bottom: {x0: 1, y0: 0, x1: 0, y1: 0}, // bottom
  left: {x0: 0, y0: 0, x1: 0, y1: 1}, // left
};

function wallName({x0, y0, x1, y1}: Wall) {
  return Object.entries(GameWalls).find(([, v]) => v.x0 === x0 && v.y0 === y0 && v.x1 === x1 && v.y1 === y1)![0];
}

export function computeCollisionsWithLine(
  xw: number, yw: number, alpha: number, // wall
  xb: number, yb: number, beta: number, // ball
  velocity: number,
  acceleration: number,
  radius: number,
  t0: number,
  tMax: number,
  epsilon: number,
  { verbose }: { verbose?: boolean } = {},
): { t: number; sigma: number; } | undefined {
  if (Math.abs(Math.sin(alpha - beta)) <= epsilon) {
    // Parallel lines.
    // TODO It might always collide, return t=undefined?
    return;
  }

  const Delta = Math.sin(alpha - beta);
  const c0 = (xb - xw) * Math.sin(alpha) - (yb - yw) * Math.cos(alpha);

  function* gen() {
    for (const sigma of [-1, 1]) {
      for (const t of solveQuadratic(1 / 2 * acceleration * Delta, velocity * Delta, c0 - sigma * radius, epsilon)) {
        if (t < t0) {
          verbose && console.debug(`Excluding collision happening in the past at t=${t} sigma=${sigma}`);
          continue;
        }
        if (t > tMax) {
          verbose && console.debug(`Excluding collision happening after the ball has stopped at t=${t} sigma=${sigma}`);
          continue;
        }
        verbose && console.debug(`Potential collision at t=${t} sigma=${sigma}`);
        yield { t, sigma };
      }
    }
  }

  const collisions = [...gen()];
  if (collisions.length > 0) {
    const firstCollision = collisions.reduce((a, b) => {
      const [first, second] = a.t < b.t ? [a, b] : [b, a];
      verbose && console.debug(`Excluding subsequent collision at t=${second.t} sigma=${second.sigma}`);
      return first;
    });
    verbose && console.debug(`First collision at t=${firstCollision.t} sigma=${firstCollision.sigma}`);
    return firstCollision;
  }
}

class MathBall implements StaticBall {
  counter: number;
  radius: number;
  x: number;
  y: number;

  firedAt: number;

  constructor(r: number, x: number, y: number, firedAt: number, readonly fixedPoints: Array<BallState & { with: Obstacle[]; }>) {
    this.counter = 3;

    this.radius = r;
    this.x = x;
    this.y = y;

    this.firedAt = firedAt;
  }
}

interface BallState {
  t: number;
  x: number;
  y: number;
  angle: number;
  velocity: number;
  acceleration: number;
}

export function* computeCollisionsWithWalls(
  { t: t0, x, y, angle: ballAngle, velocity, acceleration, radius }: BallState & { radius: number; },
  candidateWalls:  Array<Wall>,
  {
    epsilon = 1e-5,
    verbose,
  }: {
    epsilon?: number;
    verbose?: boolean;
  } = {}
): Generator<Collision<WallObstacle>, void, unknown> {
  function* gen() {
    for (const wall of candidateWalls) {
      verbose && console.group(`Considering ${wallName(wall)} wall`);

      const wallAngle = Math.atan2(wall.y1 - wall.y0, wall.x1 - wall.x0);

      const collision = computeCollisionsWithLine(
        wall.x0, wall.y0, wallAngle,
        x, y, ballAngle, velocity, acceleration, radius,
        epsilon,
        -velocity / acceleration,
        epsilon,
        { verbose },
      );

      if (collision !== undefined) {
        yield {t: collision.t + t0, with: { type: 'wall' as const, value: {...wall, sigma: collision.sigma }}};
      }

      verbose && console.groupEnd();
    }
  }

  const collisions = [...gen()]
    .sort((a, b) => a.t - b.t)
    // Identify imminent collisions.
    .filter(({t}, _, [first]) => t <= first.t + epsilon);

  for (const {t, with: {value: wall}} of collisions) {
    verbose && console.debug(`Collision at t=${t} with ${wallName(wall)} wall`);
  }

  yield* collisions;
}

function* computeCollisionsWithGameWalls(
  ball: BallState & { radius: number; },
  {
    epsilon = 1e-5,
    verbose,
  }: {
    epsilon?: number;
    verbose?: boolean;
  } = {}
): Generator<Collision<WallObstacle>, void, unknown> {
  // // TODO IO: depending on direction of movement, only check the walls in that direction.
  const candidateWalls: Array<Wall> = [GameWalls.top, GameWalls.right, GameWalls.left];

  // Only consider the bottom border if above it.
  if (ball.y > ball.radius) {
    candidateWalls.push(GameWalls.bottom);
  }

  yield* computeCollisionsWithWalls(ball, candidateWalls, { epsilon, verbose });
}

function* computeFixedPoints(
  { x, y, angle: ballAngle, velocity: velocity, acceleration, radius }: Omit<BallState, 't'> & { radius: number; },
  { verbose }: { verbose?: boolean } = {},
): Generator<BallState & { with: Array<Obstacle>; }> {
  let t0 = 0;

  const tMax = -velocity / acceleration;

  yield {
    t: t0,
    x, y,
    angle: ballAngle,
    velocity,
    acceleration,
    with: []
  };

  for (let i = 0; true; ++i) {
    verbose && console.group(`Fixed point #${i+1}`);

    verbose && console.debug(`${t0} ${directionalArrow(Math.cos(ballAngle) * velocity, Math.sin(ballAngle) * velocity)} x=${x.toFixed(3)} y=${y.toFixed(3)} angle=${ppAngle(ballAngle)} v=${velocity.toFixed(3)}`);

    const collisions = [...computeCollisionsWithGameWalls({t: t0, x, y, angle: ballAngle, velocity, acceleration, radius}, { verbose: verbose })];
    // TODO handle collision with balls.

    if (collisions.length > 1) { // TODO handle collision against multiple objects.
      throw new Error('Collision against multiple objects');
    }

    const collision = collisions.at(0);

    const t1 = collision?.t ?? tMax;
    const deltaT = t1 - t0;

    x = 1/2 * Math.cos(ballAngle) * acceleration * deltaT**2 + Math.cos(ballAngle) * velocity * deltaT + x;
    y = 1/2 * Math.sin(ballAngle) * acceleration * deltaT**2 + Math.sin(ballAngle) * velocity * deltaT + y;
    velocity = velocity + acceleration * deltaT;

    if (collision !== undefined) {
      if (collision.with.type === 'wall') {
        const wall = collision.with.value as Wall;
        const wallAngle = Math.atan2(wall.y1 - wall.y0, wall.x1 - wall.x0);
        ballAngle = 2 * wallAngle - ballAngle;

        // TODO stop if collision with bottom wall.

        verbose && console.log(ppAngle(ballAngle), directionalArrow(Math.cos(ballAngle), Math.sin(ballAngle)));
      } else {
        // TODO handle collision with balls.
      }
    }

    yield {
      t: t1,
      x,
      y,
      angle: ballAngle,
      velocity,
      acceleration,
      with: collision === undefined ? [] : [collision.with]
    };

    t0 = t1;

    verbose && console.groupEnd();

    if (collision === undefined) {
      verbose && console.debug(`No collision detected, stopping`);
      break;
    }
    if (collision.with.type === 'wall' && collision.with.value === GameWalls.bottom) {
      verbose && console.debug(`Collision with bottom wall, stopping`);
      break;
    }
  }
}

export class BallEngineMath extends BallEngine {
  staticBalls: Array<StaticBall> = [];
  currentBall: MathBall | null = null;

  internalFire(ball: { radius: number; angle: number; x: number; y: number; }): void {
    // performance.now() could be anterior to the timestamp passed to a raf callback timestamp.
    // const time = performance.now() / 1000,
    const time = document.timeline.currentTime as number / 1000;

    console.info(`Ball fired at t=${time}`);

    this.takeSnapshot();

    const fixedPoints = [...computeFixedPoints(
      {...ball, velocity: Constants.DEFAULT_BALL_VELOCITY, acceleration: Constants.DEFAULT_BALL_ACCELERATION},
      { verbose: true }
    )];
    console.info('Fixed points', [...fixedPoints]);

    this.currentBall = new MathBall(
      ball.radius,
      ball.x, ball.y,
      time,
      fixedPoints,
    );
  }

  update(frameTime: number, lastFrameTime: number, { verbose }: { verbose?: boolean} = {}): { score: number; gameover: boolean; } {
    if (this.currentBall !== null) {
      verbose && console.group(`BallEngineMath.update t0=${lastFrameTime.toFixed(3)} t1=${frameTime.toFixed(3)} Δt=${(frameTime - this.currentBall.firedAt).toFixed(3)}`);

      const pastFixedPoints = this.currentBall.fixedPoints.filter(c => this.currentBall!.firedAt + c.t <= frameTime);

      const ballsHit = pastFixedPoints.reduce(
        (balls, fp) => {
          const obstacles = fp.with.filter(obstacle => obstacle.type === 'ball');
          balls.push(...obstacles.map(obstacle => obstacle.value));
          return balls;
        },
        new Array<StaticBall>()
      );

      // The last of the past fixed points is the one that will be used to compute the new position of the ball.
      // The ones before it have been consumed, let's discard them.
      this.currentBall.fixedPoints.splice(0, pastFixedPoints.length - 1);
      // The last one is kept as it might still be the fixed point for the next frame.
      // Discard its obstacles as the collisions have already been accounted for.
      pastFixedPoints.at(-1)!.with.length = 0;

      for (const ball of ballsHit) {
        ball.counter -= 1;
        if (ball.counter === 0) {
          this.staticBalls.splice(this.staticBalls.indexOf(ball), 1);
        }
      }

      const fp = pastFixedPoints.at(-1)!;
      console.log(`last fixed point t=${fp.t.toFixed(2)} x=${fp.x.toFixed(2)} y=${fp.y.toFixed(2)} ${directionalArrow(Math.cos(fp.angle), Math.sin(fp.angle))}`);

      const timeSinceFixedPoint = frameTime - (fp.t + this.currentBall.firedAt);
      this.currentBall.x = fp.x + Math.cos(fp.angle) * fp.velocity * timeSinceFixedPoint + 1/2 * Math.cos(fp.angle) * fp.acceleration * timeSinceFixedPoint**2;
      this.currentBall.y = fp.y + Math.sin(fp.angle) * fp.velocity * timeSinceFixedPoint + 1/2 * Math.sin(fp.angle) * fp.acceleration * timeSinceFixedPoint**2;

      // TODO gameover if collision with bottom wall.

      if (frameTime - this.currentBall.firedAt >= 2.5) {
        verbose && console.log(`Ball stopped firedAt=${this.currentBall.firedAt.toFixed(2)}`);

        const expandedRadius = computeExpandedRadius(this.currentBall, this.staticBalls);
        this.staticBalls.push({
          counter: 3,
          radius: expandedRadius,
          x: this.currentBall.x,
          y: this.currentBall.y,
        });

        this.currentBall = null;
      }

      verbose && console.groupEnd();
    }

    return { score: 0, gameover: false }; // TODO
  }

  override internalReset() {
    this.currentBall = null;
  }
}
