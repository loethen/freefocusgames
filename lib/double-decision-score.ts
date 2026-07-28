export const DOUBLE_DECISION_RULES_VERSION = 1;
export const DOUBLE_DECISION_MIN_RANKED_TRIALS = 20;
export const DOUBLE_DECISION_MIN_RANKED_ACCURACY = 70;
export const DOUBLE_DECISION_MIN_DISPLAY_MS = 120;
export const DOUBLE_DECISION_MAX_DISPLAY_MS = 2200;
export const DOUBLE_DECISION_MAX_TRIAL_POINTS = 375;

const FIELD_MULTIPLIERS: Record<number, number> = {
    1: 1,
    2: 1.25,
    3: 1.5,
};

export function calculateDoubleDecisionTrialPoints({
    correct,
    displayMs,
    fieldLevel,
}: {
    correct: boolean;
    displayMs: number;
    fieldLevel: number;
}) {
    if (!correct) return 0;

    const fieldMultiplier = FIELD_MULTIPLIERS[fieldLevel] ?? 1;
    const speedMultiplier = Math.min(
        2.5,
        Math.max(0.75, Math.sqrt(1200 / displayMs))
    );

    return Math.round(100 * fieldMultiplier * speedMultiplier);
}

export function calculateDoubleDecisionScore(pointsTotal: number, totalTrials: number) {
    if (totalTrials <= 0) return 0;

    return Math.round(
        (pointsTotal / totalTrials / DOUBLE_DECISION_MAX_TRIAL_POINTS) * 1000
    );
}

export function isDoubleDecisionLeaderboardEligible({
    accuracy,
    totalTrials,
}: {
    accuracy: number;
    totalTrials: number;
}) {
    return (
        totalTrials >= DOUBLE_DECISION_MIN_RANKED_TRIALS &&
        accuracy >= DOUBLE_DECISION_MIN_RANKED_ACCURACY
    );
}
