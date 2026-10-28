import { DOUBLE_DECISION_MIN_DISPLAY_MS } from "./double-decision-score";

// School Run: endless Double Decision rounds, one mistake ends the run. The game and the
// leaderboard API share these rules, so the server can check a run against the same schedule.

export const SCHOOL_RUN_RULES_VERSION = 1;
export const SCHOOL_RUN_MASK_MS = 150;
export const SCHOOL_RUN_FEEDBACK_MS = 1100;

// The first round is shown for 2 s; every cleared round shortens the flash a little. Every few
// rounds the ring of planes widens, and the flash steps back up so the new level starts fair.
const INITIAL_DISPLAY_MS = 2000;
const SPEED_UP = 0.92;
const ROUNDS_PER_LEVEL = 8;
const LEVEL_UP_SLOWDOWN = 1.3;

const MAX_ROUNDS = 1000;
// Quickest a player can tap both answers in one round.
const MIN_ANSWER_MS = 400;
// A measured flash can run up to a few frames long on a busy or slow device, never much short.
const DISPLAY_EARLY_MS = 10;
const DISPLAY_LATE_MS = 120;
const MAX_RUN_MS = 6 * 60 * 60 * 1000;

// Flash length and level for a round, counted from 0.
export function schoolRunRound(round: number): { level: 1 | 2 | 3; displayMs: number } {
  const level = Math.min(3, 1 + Math.floor(round / ROUNDS_PER_LEVEL)) as 1 | 2 | 3;
  const ms = INITIAL_DISPLAY_MS * SPEED_UP ** round * LEVEL_UP_SLOWDOWN ** (level - 1);
  return { level, displayMs: Math.max(DOUBLE_DECISION_MIN_DISPLAY_MS, Math.round(ms)) };
}

// Checks a submitted run: `score` is the number of rounds cleared. Returns why it was rejected,
// or null when it fits the schedule.
export function validateSchoolRunSubmission(
  score: number,
  details: { fastestDisplayMs?: unknown; durationMs?: unknown; rulesVersion?: unknown } | null,
) {
  if (!Number.isInteger(score) || score < 1 || score > MAX_ROUNDS || !details) {
    return "Score rejected (Invalid School Run entry)";
  }
  if (details.rulesVersion !== SCHOOL_RUN_RULES_VERSION) {
    return "Score rejected (Unsupported School Run rules)";
  }

  let fastest = Infinity;
  let minDuration = 0;
  for (let round = 0; round < score; round++) {
    const { displayMs } = schoolRunRound(round);
    fastest = Math.min(fastest, displayMs);
    minDuration += displayMs + SCHOOL_RUN_MASK_MS + MIN_ANSWER_MS + SCHOOL_RUN_FEEDBACK_MS;
  }

  const fastestDisplayMs = details.fastestDisplayMs;
  if (
    typeof fastestDisplayMs !== "number" ||
    fastestDisplayMs < fastest - DISPLAY_EARLY_MS ||
    fastestDisplayMs > fastest + DISPLAY_LATE_MS
  ) {
    return "Score rejected (School Run speed mismatch)";
  }

  const durationMs = details.durationMs;
  if (typeof durationMs !== "number" || durationMs < minDuration || durationMs > MAX_RUN_MS) {
    return "Score rejected (School Run duration mismatch)";
  }

  return null;
}
