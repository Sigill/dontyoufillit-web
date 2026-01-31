import { StaticBall } from "./static-ball";

/**
 * Defines the result of a ball-to-ball collision.
 */
export interface CollisionResult {
  /** How much to decrement the hit ball's counter. Use Infinity for instant destroy. */
  counterDecrement: number;
  /** Whether the current ball should stop immediately after this collision. */
  stopCurrentBall: boolean;
  /** Whether the current ball should grow when stopped (only relevant if stopCurrentBall is true). */
  growOnStop: boolean;
  /** Whether score should be increased when the hit ball is destroyed. */
  scoreOnDestroy: boolean;
}

/**
 * Handles the logic for ball-to-ball collisions.
 */
export interface CollisionHandler {
  /**
   * Called when the current ball collides with a static ball.
   * @param hitBall The static ball that was hit
   * @returns The result of the collision
   */
  onBallCollision(hitBall: StaticBall): CollisionResult;

  /** The cost of using this collision handler, if any. */
  readonly cost?: number;
}

/**
 * Default collision handler: decrement counter by 1, ball continues bouncing, grows on stop.
 */
export const DefaultCollisionHandler: CollisionHandler = {
  onBallCollision(): CollisionResult {
    return {
      counterDecrement: 1,
      stopCurrentBall: false,
      growOnStop: true,
      scoreOnDestroy: true,
    };
  },
};

/**
 * Lazer mode collision handler: destroy hit ball instantly, stop current ball, no growth.
 */
export const LazerCollisionHandler: CollisionHandler = {
  cost: 5,

  onBallCollision(): CollisionResult {
    return {
      counterDecrement: Infinity, // Instant destroy
      stopCurrentBall: true,
      growOnStop: false,
      scoreOnDestroy: false,
    };
  },
};
