import { assert } from 'chai';
import { computeFixedPoints } from './ball-engine-math';
import { makeBalls } from '../ball';
import { DEFAULT_BALL_RADIUS, DEFAULT_BALL_VELOCITY, DEFAULT_BALL_ACCELERATION } from '../constants';

describe('computeFixedPoints()', () => {
  // it('should stops when a collision with a ball occured but the bottom wall has not been cleared', () => {
  //   const ball = { radius: 0.025, angle: 0.41741294390696315, x: 0.5609427188476009, y: -0.07297354141019015, velocity: DEFAULT_BALL_VELOCITY, acceleration: DEFAULT_BALL_ACCELERATION };
  //   const ball1 = { counter: 3, radius: 0.08292598608470797, x: 0.8538976933509962, y: 0.08292598608470797 };
  //   const fixedPoints = [...computeFixedPoints(ball, [ball1], { epsilon: 1e-5 })];
  //   assert.sameDeepOrderedMembers(fixedPoints, [
  //     { t: 0, x: ball.x, y: ball.y, angle: ball.angle, velocity: ball.velocity, acceleration: ball.acceleration, obstacles: [] },
  //     {
  //       t: 0.23695243933969434,
  //       x: 0.767285453705971,
  //       y: 0.018533918125763563,
  //       angle: 4.002774484863123,
  //       velocity: 0.9052190242641223,
  //       acceleration: -0.4,
  //       obstacles: [
  //         {
  //           type: "ball",
  //           value: { counter: 3, radius: ball1.radius, x: ball1.x, y: ball1.y }
  //         }
  //       ],
  //     }
  //   ]);
  // });

  it('should stop when a collision with a static ball occurs before clearing the bottom wall and the ball bounces down', () => {
    const { ball, staticBalls } = makeBalls({
      ball: { angle: Math.PI / 2, x: 0.8, y: -0.1 },
      staticBalls: [
        // At x + cos(45) * radius * 2, the ball should bounce at 180°. Shift ball a bit to the left to make the ball bounce down.
        { x: 0.8 + Math.cos(Math.PI / 4) * 0.025 * 2 - 0.001, y: 0.025 },
      ]
    });
    const fixedPoints = [...computeFixedPoints(ball, staticBalls, { epsilon: 1e-5 })];
    assert.sameDeepOrderedMembers(fixedPoints, [
      { t: 0, x: ball.x, y: ball.y, angle: ball.angle, velocity: DEFAULT_BALL_VELOCITY, acceleration: DEFAULT_BALL_ACCELERATION, obstacles: [] },
      {
        t: 0.09030310788927243,
        x: 0.8,
        y: -0.011327822369619892,
        angle: 3.1973901445240145,
        velocity: 0.963878756844291,
        acceleration: -0.4,
        obstacles: [{
          type: "ball",
          value: { counter: 3, radius: DEFAULT_BALL_RADIUS, x: staticBalls[0].x, y: staticBalls[0].y }
        }],
      },
    ]);
  });

  it('should not stop when a collision with a static ball occurs before clearing the bottom wall and the ball bounces up', () => {
    const { ball, staticBalls } = makeBalls({
      ball: { angle: Math.PI / 2, x: 0.8, y: -0.1 },
      staticBalls: [
        // At x + cos(45) * radius * 2, the ball should bounce at 180°. Shift ball a bit to the right to make the ball bounce up.
        { x: 0.8 + Math.cos(Math.PI / 4) * 0.025 * 2 + 0.001, y: 0.025 },
      ]
    });
    const fixedPoints = [...computeFixedPoints(ball, staticBalls, { epsilon: 1e-5 })];
    assert.sameDeepOrderedMembers(fixedPoints, [
      { t: 0, x: ball.x, y: ball.y, angle: ball.angle, velocity: DEFAULT_BALL_VELOCITY, acceleration: DEFAULT_BALL_ACCELERATION, obstacles: [] },
      {
        t: 0.09238061650009927,
        x: 0.8,
        y: -0.009326219160888424,
        angle: 3.084192596321998,
        velocity: 0.9630477533999603,
        acceleration: -0.4,
        obstacles: [{
          type: "ball",
          value: { counter: 3, radius: DEFAULT_BALL_RADIUS, x: staticBalls[0].x, y: staticBalls[0].y }
        }],
      },
      {
        t: 1.1160785028532507,
        x: 0.02499999999999991,
        y: 0.035207745640972954,
        angle: 0.05740005726779529,
        velocity: 0.5535685988586997,
        acceleration: -0.4,
        obstacles: [{
          type: "wall",
          value: {
            sigma: 1,
            wall: { x0: 0, x1: 0, y0: 0, y1: 1 }
          }
        }],
      },
      {
        t: 2.5,
        x: 0.4074168888425763,
        y: 0.05718263630852469,
        angle: 0.05740005726779529,
        velocity: 0,
        acceleration: -0.4,
        obstacles: [],
      }
    ]);
  });

  it('should not stop when no collision with a static ball occurs and the ball does not clear the bottom wall', () => {
    const { ball, staticBalls } = makeBalls({
      ball: { angle: Math.PI, x: 0.8, y: -0.1 },
      staticBalls: [],
    });
    const fixedPoints = [...computeFixedPoints(ball, staticBalls, { epsilon: 1e-5 })];
    assert.sameDeepOrderedMembers(fixedPoints, [
      { t: 0, x: ball.x, y: ball.y, angle: ball.angle, velocity: DEFAULT_BALL_VELOCITY, acceleration: DEFAULT_BALL_ACCELERATION, obstacles: [] },
      {
        t: 0.9588964992577561,
        x: 0.02499999999999991,
        y: -0.09999999999999991,
        angle: 0,
        velocity: 0.6164414002968975,
        acceleration: -0.4,
        obstacles: [{
          type: "wall",
          value: {
            sigma: 1,
            wall: { x0: 0, x1: 0, y0: 0, y1: 1 }
          }
        }],
      },
      {
        t: 2.5,
        x: 0.49999999999999967,
        y: -0.09999999999999991,
        angle: 0,
        velocity: 0,
        acceleration: -0.4,
        obstacles: [],
      }
    ]);
  });
});
