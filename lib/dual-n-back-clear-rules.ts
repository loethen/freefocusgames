export const DUAL_N_BACK_CLEAR_MIN_LEVEL = 2;
export const DUAL_N_BACK_CLEAR_MIN_TRIALS = 20;
export const DUAL_N_BACK_CLEAR_MIN_ACCURACY = 80;
export const DUAL_N_BACK_CLEAR_MAX_LEVEL = 10;
export const DUAL_N_BACK_CLEAR_MAX_TRIALS = 100;
export const DUAL_N_BACK_CLEAR_MIN_INTERVAL_MS = 1000;
export const DUAL_N_BACK_CLEAR_MAX_INTERVAL_MS = 5000;
export const DUAL_N_BACK_CLEAR_MIN_DURATION_MS = 1000;
export const DUAL_N_BACK_CLEAR_MAX_DURATION_MS = 600000;
export const DUAL_N_BACK_CLEAR_TRAINING_MODE = "dual";

export type DualNBackClearSettings = {
    selectedNBack: number;
    selectedTypes: readonly string[];
    trialsPerRound: number;
};

export function isDualNBackClearLeaderboardEligible(settings: DualNBackClearSettings) {
    return (
        settings.selectedTypes.length === 2 &&
        settings.selectedTypes.includes("position") &&
        settings.selectedTypes.includes("audio") &&
        settings.selectedNBack >= DUAL_N_BACK_CLEAR_MIN_LEVEL &&
        settings.trialsPerRound >= DUAL_N_BACK_CLEAR_MIN_TRIALS
    );
}
