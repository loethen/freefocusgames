// Test parameters follow the published PVT protocols:
// standard 10-minute PVT (2–10 s intervals, lapse >= 500 ms) and the
// 3-minute PVT-B (Basner, Mollicone & Dinges, 2011: 1–4 s intervals, lapse >= 355 ms).
export const PVT_MODES = {
  brief: { durationMs: 3 * 60 * 1000, minIntervalMs: 1000, maxIntervalMs: 4000, lapseMs: 355 },
  standard: { durationMs: 10 * 60 * 1000, minIntervalMs: 2000, maxIntervalMs: 10000, lapseMs: 500 },
} as const;

export type PvtMode = keyof typeof PVT_MODES;

// Responses faster than this are anticipations and count as false starts.
export const FALSE_START_MS = 100;
// A stimulus left unanswered this long ends as a lapse.
export const TIMEOUT_MS = 30000;
// How long the stopped counter (or a false-start message) stays on screen.
export const FEEDBACK_MS = 1000;

export interface PvtResponse {
  // Milliseconds since the test started, when the stimulus appeared
  at: number;
  reactionTime: number;
}

export function randomInterval(mode: PvtMode) {
  const { minIntervalMs, maxIntervalMs } = PVT_MODES[mode];
  return minIntervalMs + Math.random() * (maxIntervalMs - minIntervalMs);
}

function mean(values: number[]) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function calculateStats(responses: PvtResponse[], falseStarts: number, mode: PvtMode) {
  if (responses.length === 0) return null;

  const times = responses.map(r => r.reactionTime).sort((a, b) => a - b);
  // Fastest and slowest 10% use at least one response
  const tenth = Math.max(1, Math.round(times.length * 0.1));

  return {
    responses: times.length,
    medianRT: Math.round(median(times)),
    meanRT: Math.round(mean(times)),
    // Response speed: mean of 1/RT, in responses per second
    responseSpeed: Math.round(mean(times.map(rt => 1000 / rt)) * 100) / 100,
    lapses: times.filter(rt => rt >= PVT_MODES[mode].lapseMs).length,
    falseStarts,
    fastest10: Math.round(mean(times.slice(0, tenth))),
    slowest10: Math.round(mean(times.slice(-tenth))),
  };
}
