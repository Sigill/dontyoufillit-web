import * as Constants from "./constants";

export interface BallGeometry {
  radius: number;
  x: number;
  y: number;
}

export interface StaticBall extends BallGeometry {
  counter: number;
}

export interface MovingBall extends BallGeometry {
  angle: number;
  velocity: number;
  acceleration: number;
}

export interface BallState {
  t: number;
  x: number;
  y: number;
  angle: number;
  velocity: number;
  acceleration: number;
}

export function makeMovingBall({
  radius = Constants.DEFAULT_BALL_RADIUS,
  x = 0.5,
  y = Constants.CANNON_Y_POSITION + Constants.CANNON_BASE_HEIGHT + Constants.CANNON_LENGTH,
  angle = Math.PI / 2,
  velocity = Constants.DEFAULT_BALL_VELOCITY,
  acceleration = Constants.DEFAULT_BALL_ACCELERATION,
}: Partial<MovingBall> = {}): MovingBall {
  return { radius, angle, x, y, velocity, acceleration };
}

export function makeCannonBall({
  radius = Constants.DEFAULT_BALL_RADIUS,
  angle,
  velocity = Constants.DEFAULT_BALL_VELOCITY,
  acceleration = Constants.DEFAULT_BALL_ACCELERATION,
}: {
  radius?: number;
  angle: number;
  velocity?: number;
  acceleration?: number;
}): MovingBall {
  const x = 0.5 + Math.cos(angle) * Constants.CANNON_LENGTH;
  const y = Constants.CANNON_Y_POSITION + Constants.CANNON_BASE_HEIGHT + Math.sin(angle) * Constants.CANNON_LENGTH;

  return makeMovingBall({ radius, angle, x, y, velocity, acceleration });
}

export function makeStaticBall({
  radius = Constants.DEFAULT_BALL_RADIUS,
  x = 0.5,
  y = 0.5,
  counter = 3,
}: Partial<StaticBall>): StaticBall {
  return { radius, x, y, counter };
}

export function makeBalls(
  { ball, staticBalls }: { ball: Partial<MovingBall>, staticBalls?: Array<Partial<StaticBall>> }
): { ball: MovingBall, staticBalls: Array<StaticBall> } {
  return {
    ball: makeMovingBall(ball),
    staticBalls: staticBalls?.map(makeStaticBall) ?? [],
  };
}
