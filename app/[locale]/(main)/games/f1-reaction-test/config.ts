// Five red lights come on one at a time, then all go out after a hold the
// driver cannot predict. The real hold is not published; this test uses 0.2–3 s.
export const LIGHT_COUNT = 5;
export const LIGHT_INTERVAL_MS = 1000;
export const MIN_HOLD_MS = 200;
export const MAX_HOLD_MS = 3000;

// Faster than this after lights out is anticipation, so it counts as a jump start.
export const MIN_REACTION_MS = 100;

// Typical F1 start reaction range quoted by teams, in milliseconds.
export const F1_RANGE_MS = { min: 200, max: 300 };

// How many recent attempts the board shows
export const HISTORY_SIZE = 5;

// The leaderboard ranks the average of this many clean starts in a row;
// a jump start begins a new set.
export const LEADERBOARD_SET_SIZE = 5;

export function randomHold() {
  return MIN_HOLD_MS + Math.random() * (MAX_HOLD_MS - MIN_HOLD_MS);
}

export function formatSeconds(ms: number) {
  return (ms / 1000).toFixed(3);
}

export type F1Rating = 'faster' | 'inRange' | 'close' | 'slower';

export function rateAgainstF1(ms: number): F1Rating {
  if (ms < F1_RANGE_MS.min) return 'faster';
  if (ms <= F1_RANGE_MS.max) return 'inRange';
  if (ms <= 400) return 'close';
  return 'slower';
}
