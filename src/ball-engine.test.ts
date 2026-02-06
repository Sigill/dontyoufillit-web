import { assert } from 'chai';
import { BallEngineMath } from './ball-engine-math';
import { BallEngineMotionEquationAbsolute, BallEngineMotionEquationDelta } from './ball-engine-motion-equation';
import { BallEngineRK4 } from './ball-engine-rk4';
import { makeMovingBall, makeStaticBall, MovingBall, StaticBall } from './ball';
import { DEFAULT_BALL_RADIUS } from './constants';

[
  { name: 'BallEngineMath', builder: () => new BallEngineMath() },
  { name: 'BallEngineMotionEquationDelta', builder: () => new BallEngineMotionEquationDelta() },
  { name: 'BallEngineMotionEquationAbsolute', builder: () => new BallEngineMotionEquationAbsolute() },
  { name: 'BallEngineRK4', builder: () => new BallEngineRK4() },
].forEach(({ name, builder }) => {
  describe(name, () => {
    function run({ ball, staticBalls = [] }: { ball?: Partial<MovingBall>, staticBalls?: Array<Partial<StaticBall>> } = {}) {
      const engine = builder();
      engine.staticBalls.push(...staticBalls.map(makeStaticBall));
      engine.fire(makeMovingBall(ball));
      const update = engine.update(3, 0);
      return update;
    }

    it('should return { score: 0, gameover: false } when the ball never clears the bottom wall without hitting any static ball', () => {
      const update = run({
        ball: { angle: 0, x: 0.5, y: -0.1 },
      });
      assert.deepEqual(update, { score: 0, gameover: false });

    });

    it("should return { score: 0, gameover: false } when the ball doesn't hit any static ball", () => {
      const update = run();
      assert.deepEqual(update, { score: 0, gameover: false });
    });

    it("should return { score: 1, gameover: true } when the ball destroys a static ball and bounces down", () => {
      const update = run({
        ball: { angle: Math.PI / 2, x: 0.8, y: -0.1 },
        staticBalls: [
          // At x + cos(45) * radius * 2, the ball should bounce at 180°. Shift ball a bit to the left to make the ball bounce down.
          { counter: 1, x: 0.8 + Math.cos(Math.PI / 4) * 0.025 * 2 - 0.001, y: 0.025 },
        ]
      });
      assert.deepEqual(update, { score: 1, gameover: true });
    });

    describe("when a collision with a static ball occurs before clearing the bottom wall and the ball bounces down", () => {
      const { ball, staticBalls } = {
        ball: { x: 0.8 },
        staticBalls: [
          // At x + cos(45) * radius * 2, the ball should bounce at 180°. Shift ball a bit to the left to make the ball bounce down.
          { x: 0.8 + Math.cos(Math.PI / 4) * DEFAULT_BALL_RADIUS * 2 - 0.001, y: DEFAULT_BALL_RADIUS },
        ]
      };

      it("should return { score: 0, gameover: true } if the static ball is not popped", () => {
        const update = run({
          ball,
          staticBalls: [{ ...staticBalls[0] }]
        });
        assert.deepEqual(update, { score: 0, gameover: true });
      });

      it("should return { score: 1, gameover: true } if the static ball is popped", () => {
        const update = run({
          ball,
          staticBalls: [{ ...staticBalls[0], counter: 1 }]
        });
        assert.deepEqual(update, { score: 1, gameover: true });
      });
    });

    describe("when a collision with a static ball occurs before clearing the bottom wall and the ball bounces up", () => {
      const { ball, staticBalls } = {
        ball: { x: 0.8 },
        staticBalls: [
          // At x + cos(45) * radius * 2, the ball should bounce at 180°. Shift ball a bit to the right to make the ball bounce up.
          { x: 0.8 + Math.cos(Math.PI / 4) * DEFAULT_BALL_RADIUS * 2 + 0.001, y: DEFAULT_BALL_RADIUS },
        ]
      };

      it("should return { score: 0, gameover: false } if the static ball is not popped", () => {
        const update = run({
          ball,
          staticBalls
        });
        assert.deepEqual(update, { score: 0, gameover: false });
      });

      it("should return { score: 1, gameover: false } if the static ball is popped", () => {
        const update = run({
          ball,
          staticBalls: [{ ...staticBalls[0], counter: 1 }]
        });
        assert.deepEqual(update, { score: 1, gameover: false });
      });
    });
  });
});
