export type SpanMode = "forward" | "backward";
export const SPAN_RULES_VERSION = 3;
export const SPAN_PROTOCOL = "visual-700-300-v3";
export const SPAN_FORWARD_LEADERBOARD_MODE = "visual-forward-v3";
export const SPAN_BACKWARD_LEADERBOARD_MODE = "visual-backward-v3";
export const SPAN_START_LENGTH = 3;
export const SPAN_DISPLAY_MS = 700;
export const SPAN_GAP_MS = 300;

export type SpanTrial = {
  sequence: string;
  answer: string;
  correct: boolean;
};

export function expectedAnswer(sequence: string, mode: SpanMode) {
  return mode === "backward" ? sequence.split("").reverse().join("") : sequence;
}

export function makeSequence(length: number, random = Math.random) {
  return Array.from({ length }, () => Math.floor(random() * 10)).join("");
}

export function spanProgress(trials: SpanTrial[]) {
  const length = trials.at(-1)?.sequence.length ?? SPAN_START_LENGTH;
  const current = trials.filter((trial) => trial.sequence.length === length);
  const passed = current.some((trial) => trial.correct);
  return {
    length: passed ? length + 1 : length,
    done: current.length === 2 && !passed,
    best: trials.reduce(
      (best, trial) =>
        trial.correct ? Math.max(best, trial.sequence.length) : best,
      0,
    ),
  };
}

export function digitSpanLeaderboardMode(direction: SpanMode) {
  return direction === "backward"
    ? SPAN_BACKWARD_LEADERBOARD_MODE
    : SPAN_FORWARD_LEADERBOARD_MODE;
}

export function isDigitSpanLeaderboardMode(mode: string) {
  return (
    mode === SPAN_FORWARD_LEADERBOARD_MODE ||
    mode === SPAN_BACKWARD_LEADERBOARD_MODE
  );
}

export function isCompletedDigitSpanRun(
  trials: SpanTrial[],
  direction: SpanMode,
) {
  let length = SPAN_START_LENGTH;
  let failures = 0;
  let done = false;
  for (const trial of trials) {
    if (
      done ||
      !trial ||
      trial.sequence.length !== length ||
      !/^\d+$/.test(trial.sequence) ||
      !/^\d+$/.test(trial.answer) ||
      trial.answer.length !== length ||
      trial.correct !==
        (trial.answer === expectedAnswer(trial.sequence, direction))
    )
      return false;
    if (trial.correct) {
      length += 1;
      failures = 0;
    } else {
      failures += 1;
      done = failures === 2;
    }
  }
  return done;
}

export function digitSpanSubmissionDetails(
  trials: SpanTrial[],
  direction: SpanMode,
) {
  const progress = spanProgress(trials);
  return {
    direction,
    rulesVersion: SPAN_RULES_VERSION,
    protocol: SPAN_PROTOCOL,
    presentation: "visual",
    digitDisplayMs: SPAN_DISPLAY_MS,
    digitGapMs: SPAN_GAP_MS,
    startingLength: SPAN_START_LENGTH,
    finished: progress.done && isCompletedDigitSpanRun(trials, direction),
    failedLength: progress.length,
    totalTrials: trials.length,
    correctTrials: trials.filter((trial) => trial.correct).length,
    finalLengthTrials: trials.filter(
      (trial) => trial.sequence.length === progress.length,
    ).length,
    finalLengthCorrectTrials: trials.filter(
      (trial) => trial.sequence.length === progress.length && trial.correct,
    ).length,
  };
}

export type DigitSpanSubmissionDetails = {
  direction?: unknown;
  rulesVersion?: unknown;
  protocol?: unknown;
  presentation?: unknown;
  digitDisplayMs?: unknown;
  digitGapMs?: unknown;
  startingLength?: unknown;
  finished?: unknown;
  failedLength?: unknown;
  totalTrials?: unknown;
  correctTrials?: unknown;
  finalLengthTrials?: unknown;
  finalLengthCorrectTrials?: unknown;
};

// Validate the submitted protocol summary, not a claim of cheat-proof verification.
export function validateDigitSpanSubmission(
  score: number,
  mode: string,
  details: DigitSpanSubmissionDetails | null,
) {
  if (!isDigitSpanLeaderboardMode(mode))
    return "Score rejected (Unsupported digit span mode)";
  if (!Number.isSafeInteger(score) || score < SPAN_START_LENGTH)
    return "Score rejected (Invalid digit span length)";
  const direction = details?.direction;
  if (
    (direction !== "forward" && direction !== "backward") ||
    digitSpanLeaderboardMode(direction) !== mode
  )
    return "Score rejected (Invalid recall direction)";
  if (
    details?.rulesVersion !== SPAN_RULES_VERSION ||
    details.protocol !== SPAN_PROTOCOL ||
    details.presentation !== "visual" ||
    details.digitDisplayMs !== SPAN_DISPLAY_MS ||
    details.digitGapMs !== SPAN_GAP_MS ||
    details.startingLength !== SPAN_START_LENGTH
  )
    return "Score rejected (Invalid digit span rules)";
  const failedLength = details.failedLength;
  const totalTrials = details.totalTrials;
  const correctTrials = details.correctTrials;
  if (
    details.finished !== true ||
    !Number.isSafeInteger(failedLength) ||
    failedLength !== score + 1 ||
    details.finalLengthCorrectTrials !== 0 ||
    details.finalLengthTrials !== 2
  )
    return "Score rejected (Incomplete digit span test)";
  const passedLengths = score - SPAN_START_LENGTH + 1;
  const minTrials = passedLengths + 2;
  const maxTrials = passedLengths * 2 + 2;
  if (
    !Number.isSafeInteger(maxTrials) ||
    !Number.isSafeInteger(totalTrials) ||
    typeof totalTrials !== "number" ||
    totalTrials < minTrials ||
    totalTrials > maxTrials ||
    correctTrials !== passedLengths
  )
    return "Score rejected (Inconsistent digit span trials)";
  return null;
}
