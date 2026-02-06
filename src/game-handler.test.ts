import { assert } from 'chai';
import sinon from 'sinon';
import { BallEngine } from './ball-engine';
import { MovingCannon as Cannon } from './cannon';
import { DefaultCollisionHandler, LazerCollisionHandler } from './collision-handler';
import { GameHandler } from './game-handler';
import { BallGeometry } from "./ball";

/**
 * Mock BallEngine that records all update calls.
 */
class MockBallEngine extends BallEngine {
  currentBall: BallGeometry | null = null;
  updateCalls: Array<{ frameTime: number; lastFrameTime: number }> = [];

  internalFire(): void {
    // No-op for testing
  }

  override update(frameTime: number, lastFrameTime: number): { score: number; gameover: boolean } {
    this.updateCalls.push({ frameTime, lastFrameTime });
    return { score: 0, gameover: false };
  }

  internalReset(): void {
    super.internalReset();
    this.updateCalls = [];
  }
}

/**
 * Mock Cannon that records all update calls.
 */
class MockCannon extends Cannon {
  updateCalls: Array<{ frameTime: number; lastFrameTime: number }> = [];

  override update(frameTime: number, lastFrameTime: number) {
    this.updateCalls.push({ frameTime, lastFrameTime });
  }

  override reset() {
    this.updateCalls = [];
  }
}

const FRAME_DURATION = 16; // ~60fps

describe('GameHandler pause/resume mechanism', () => {
  let gameHandler: GameHandler;
  let mockBallEngine: MockBallEngine;
  let mockCannon: MockCannon;
  let clock: sinon.SinonFakeTimers;
  let requestAnimationFrameStub: sinon.SinonStub;
  let cancelAnimationFrameStub: sinon.SinonStub;
  let pendingTimeouts: Map<number, ReturnType<typeof setTimeout>>;
  let nextRafId: number;

  beforeEach(() => {
    // Install Sinon fake timers
    clock = sinon.useFakeTimers();

    pendingTimeouts = new Map();
    nextRafId = 1;

    // Stub requestAnimationFrame to use setTimeout
    requestAnimationFrameStub = sinon.stub(window, 'requestAnimationFrame')
      .callsFake((callback: FrameRequestCallback): number => {
        const rafId = nextRafId++;
        const timeoutId = setTimeout(() => {
          pendingTimeouts.delete(rafId);
          callback(clock.now);
        }, FRAME_DURATION);
        pendingTimeouts.set(rafId, timeoutId);
        return rafId;
      });

    // Stub cancelAnimationFrame to cancel the corresponding timeout
    cancelAnimationFrameStub = sinon.stub(window, 'cancelAnimationFrame')
      .callsFake((rafId: number): void => {
        const timeoutId = pendingTimeouts.get(rafId);
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
          pendingTimeouts.delete(rafId);
        }
      });

    mockBallEngine = new MockBallEngine();
    mockCannon = new MockCannon();
    gameHandler = new GameHandler({ cannon: mockCannon, ballEngine: mockBallEngine });
  });

  afterEach(() => {
    requestAnimationFrameStub.restore();
    cancelAnimationFrameStub.restore();
    clock.restore();
  });

  describe('initial state', () => {
    it('should start in PAUSED state', () => {
      assert.equal(gameHandler.state, GameHandler.PAUSED);
    });
  });

  describe('resume()', () => {
    it('should transition to RUNNING state when resumed', () => {
      gameHandler.resume();
      assert.equal(gameHandler.state, GameHandler.RUNNING);
    });

    it('should request an animation frame when resumed', () => {
      gameHandler.resume();
      assert.equal(pendingTimeouts.size, 1);
    });

    it('should dispatch beginStep and endStep events on initial resume frame', () => {
      const beginStepEvents: number[] = [];
      const endStepEvents: number[] = [];
      let eventCounter = 0;

      gameHandler.observable.addEventListener('beginStep', () => {
        beginStepEvents.push(eventCounter++);
      });
      gameHandler.observable.addEventListener('endStep', () => {
        endStepEvents.push(eventCounter++);
      });

      gameHandler.resume();
      clock.tick(FRAME_DURATION); // t=16ms: startOrResume

      assert.deepEqual(beginStepEvents, [0]);
      assert.deepEqual(endStepEvents, [1]);
    });
  });

  describe('time correction on resume', () => {
    it('should apply time correction when resuming after pause', () => {
      // Resume the game
      gameHandler.resume();

      clock.tick(FRAME_DURATION); // t=16ms: startOrResume

      clock.tick(FRAME_DURATION); // t=32ms: step

      // At this point, update should have been called
      assert.equal(mockBallEngine.updateCalls.length, 1);
      assert.equal(mockCannon.updateCalls.length, 1);

      // Verify the time parameters (converted from ms to seconds)
      // frameTime = 0.032, lastFrameTime = 0.016
      assert.closeTo(mockBallEngine.updateCalls[0].frameTime, 0.032, 0.001);
      assert.closeTo(mockBallEngine.updateCalls[0].lastFrameTime, 0.016, 0.001);
      assert.closeTo(mockCannon.updateCalls[0].frameTime, 0.032, 0.001);
      assert.closeTo(mockCannon.updateCalls[0].lastFrameTime, 0.016, 0.001);

      // Pause the game
      gameHandler.pause();
      assert.equal(gameHandler.state, GameHandler.PAUSED);

      // Clear the update call history
      mockBallEngine.updateCalls = [];
      mockCannon.updateCalls = [];

      // Simulate 500ms of pause time passing
      clock.tick(500);

      // Resume the game
      gameHandler.resume();
      clock.tick(FRAME_DURATION); // t=548ms: startOrResume

      // The startOrResume should correct the time by adding ~500ms to timeCorrection
      // #timeCorrection += 0.548 - 0.032 = 0.516

      clock.tick(FRAME_DURATION); // t=564ms: step

      // Now the update should be called with corrected times
      // Real time: 564ms, but corrected by 516ms = 48ms game time
      // frameTime should be 0.048, lastFrameTime should be 0.032
      assert.equal(mockBallEngine.updateCalls.length, 1);
      assert.closeTo(mockBallEngine.updateCalls[0].frameTime, 0.048, 0.001);
      assert.closeTo(mockBallEngine.updateCalls[0].lastFrameTime, 0.032, 0.001);

      assert.equal(mockCannon.updateCalls.length, 1);
      assert.closeTo(mockCannon.updateCalls[0].frameTime, 0.048, 0.001);
      assert.closeTo(mockCannon.updateCalls[0].lastFrameTime, 0.032, 0.001);
    });

    it('should maintain continuous game time across multiple pause/resume cycles', () => {
      // Resume the game
      gameHandler.resume();
      clock.tick(FRAME_DURATION); // t=16ms: startOrResume

      clock.tick(FRAME_DURATION); // t=32ms: step
      assert.closeTo(mockBallEngine.updateCalls[0].frameTime, 0.032, 0.001);
      assert.closeTo(mockBallEngine.updateCalls[0].lastFrameTime, 0.016, 0.001);

      clock.tick(FRAME_DURATION); // t=48ms: step
      assert.closeTo(mockBallEngine.updateCalls[1].frameTime, 0.048, 0.001);
      assert.closeTo(mockBallEngine.updateCalls[1].lastFrameTime, 0.032, 0.001);

      gameHandler.pause();

      mockBallEngine.updateCalls = [];
      mockCannon.updateCalls = [];

      clock.tick(500); // Simulate 500ms of pause time passing

      gameHandler.resume();
      clock.tick(FRAME_DURATION); // Frame at t=548ms: startOrResume

      clock.tick(FRAME_DURATION); // Frame at t=564ms: step

      // Time correction should have removed the 500ms pause
      // Game time should continue from where it left off (~48ms -> ~64ms)
      assert.closeTo(mockBallEngine.updateCalls[0].frameTime, 0.064, 0.001);
      assert.closeTo(mockBallEngine.updateCalls[0].lastFrameTime, 0.048, 0.001);
      assert.closeTo(mockCannon.updateCalls[0].frameTime, 0.064, 0.001);
      assert.closeTo(mockCannon.updateCalls[0].lastFrameTime, 0.048, 0.001);

      gameHandler.pause();

      mockBallEngine.updateCalls = [];
      mockCannon.updateCalls = [];

      clock.tick(300); // Simulate 300ms of pause time passing

      gameHandler.resume();
      clock.tick(FRAME_DURATION); // Frame at t=848ms: startOrResume

      clock.tick(FRAME_DURATION); // Frame at t=864ms: step

      // Game time should continue from ~64ms -> ~80ms
      assert.closeTo(mockBallEngine.updateCalls[0].frameTime, 0.080, 0.001);
      assert.closeTo(mockBallEngine.updateCalls[0].lastFrameTime, 0.064, 0.001);
      assert.closeTo(mockCannon.updateCalls[0].frameTime, 0.080, 0.001);
      assert.closeTo(mockCannon.updateCalls[0].lastFrameTime, 0.064, 0.001);
    });
  });

  describe('pause()', () => {
    it('should transition to PAUSED state when paused', () => {
      gameHandler.resume();
      gameHandler.pause();
      assert.equal(gameHandler.state, GameHandler.PAUSED);
    });

    it('should cancel pending animation frame when paused', () => {
      gameHandler.resume();
      clock.tick(FRAME_DURATION); // Frame at t=16ms: startOrResume
      assert.equal(pendingTimeouts.size, 1);

      gameHandler.pause();
      assert.equal(pendingTimeouts.size, 0);
    });

    it('should not call update after pause', () => {
      gameHandler.resume();
      clock.tick(FRAME_DURATION); // Frame at t=16ms: startOrResume
      clock.tick(FRAME_DURATION); // Frame at t=32ms: step

      gameHandler.pause();

      // Advance time - should have no effect since the callback was cancelled
      clock.tick(FRAME_DURATION); // Frame at t=48ms

      assert.equal(mockBallEngine.updateCalls.length, 1);
    });
  });

  describe('Lazer collision handler', () => {
    it('should be enableable if score >= 5', () => {
      gameHandler.score = 5;
      assert.isTrue(gameHandler.canEnableCollisionHandler(LazerCollisionHandler));
      gameHandler.toggleCollisionHandler(LazerCollisionHandler);
      assert.equal(gameHandler.activeCollisionHandler, LazerCollisionHandler);
      assert.equal(gameHandler.score, 5); // Score not deducted yet
    });

    it('should allow cancellation (toggling off)', () => {
      gameHandler.score = 5;
      gameHandler.toggleCollisionHandler(LazerCollisionHandler);
      assert.equal(gameHandler.activeCollisionHandler, LazerCollisionHandler);
      gameHandler.toggleCollisionHandler(LazerCollisionHandler);
      assert.strictEqual(gameHandler.activeCollisionHandler, DefaultCollisionHandler);
      assert.equal(gameHandler.score, 5);
    });

    it('should deduct score only when fired', () => {
      gameHandler.score = 10;
      gameHandler.toggleCollisionHandler(LazerCollisionHandler);
      assert.equal(gameHandler.score, 10);
      gameHandler.fire();
      assert.equal(gameHandler.score, 5);
    });

    it('should automatically reset after firing and finishing', () => {
      gameHandler.score = 10;
      gameHandler.toggleCollisionHandler(LazerCollisionHandler);
      gameHandler.fire();
      assert.equal(gameHandler.activeCollisionHandler, LazerCollisionHandler);

      // Simulate ball finishing
      mockBallEngine.reset(); // This calls internalReset() in the real implementation
      assert.strictEqual(gameHandler.activeCollisionHandler, DefaultCollisionHandler);
    });
  });
});
