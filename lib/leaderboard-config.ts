export type LeaderboardDirection = "ASC" | "DESC";

export interface LeaderboardSortConfig {
  primary: LeaderboardDirection;
  target?: number;
}

export const DEFAULT_LEADERBOARD_MODE = "standard";
export const RANKED_LEADERBOARD_MODE = "ranked";

export const LEADERBOARD_GAME_CONFIG: Record<string, LeaderboardSortConfig> = {
  "reaction-time": { primary: "ASC" },
  "memory-matching-game": { primary: "ASC" },
  "stroop-effect-test": { primary: "ASC" },
  "challenge10Seconds": { primary: "ASC", target: 10_000 },
  "cps-test": { primary: "DESC" },
  "spacebar-clicker": { primary: "DESC" },
  "frog-memory-leap": { primary: "DESC" },
  "fish-trace": { primary: "DESC" },
  "block-memory-challenge": { primary: "DESC" },
  "schulte-table": { primary: "ASC" },
  "dual-n-back": { primary: "DESC" },
};

export function getLeaderboardSortConfig(gameId: string): LeaderboardSortConfig {
  return LEADERBOARD_GAME_CONFIG[gameId] || { primary: "DESC" };
}
