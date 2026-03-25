export type LeaderboardDirection = "ASC" | "DESC";

export interface LeaderboardSortConfig {
  primary: LeaderboardDirection;
}

export const DEFAULT_LEADERBOARD_MODE = "standard";
export const RANKED_LEADERBOARD_MODE = "ranked";

export const LEADERBOARD_GAME_CONFIG: Record<string, LeaderboardSortConfig> = {
  "reaction-time": { primary: "ASC" },
  "memory-matching-game": { primary: "ASC" },
  "cps-test": { primary: "DESC" },
  "frog-memory-leap": { primary: "DESC" },
  "fish-trace": { primary: "DESC" },
  "block-memory-challenge": { primary: "DESC" },
  "schulte-table": { primary: "ASC" },
};
