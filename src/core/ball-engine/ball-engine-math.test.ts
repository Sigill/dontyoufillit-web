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
    const { fixedPoints } = computeFixedPoints(ball, staticBalls, { epsilon: 1e-5 });
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
    const { fixedPoints } = computeFixedPoints(ball, staticBalls, { epsilon: 1e-5 });
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
            x0: 0, x1: 0, y0: 0, y1: 1,
            sigma: 1,
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
    const { fixedPoints } = computeFixedPoints(ball, staticBalls, { epsilon: 1e-5 });
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
            x0: 0, x1: 0, y0: 0, y1: 1,
            sigma: 1,
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

  it('should handle collisions against multiple items', () => {
    const {ball, staticBalls } = {
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
        { x: 0.8659649643578391, y: 0.13898558543077127, radius: 0.1340350356421609, counter: 3 }
      ]
    };

    assert.throws(() => {
      return computeFixedPoints(ball, staticBalls, { epsilon: 1e-5 }).fixedPoints;
    }, "Collision against multiple objects");
  });
});
