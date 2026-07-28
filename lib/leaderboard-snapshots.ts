import { DEFAULT_LEADERBOARD_MODE, getLeaderboardSortConfig } from "@/lib/leaderboard-config";

export interface LeaderboardSnapshotEntry {
  playerId: string;
  playerName: string;
  score: number;
  createdAt: string;
  details?: Record<string, boolean | number | string | null>;
}

export interface LeaderboardSnapshot {
  version: 1;
  gameId: string;
  mode: string;
  updatedAt: string;
  totalPlayers: number;
  scoreSum: number;
  entries: LeaderboardSnapshotEntry[];
}

export function createEmptySnapshot(
  gameId: string,
  mode: string = DEFAULT_LEADERBOARD_MODE
): LeaderboardSnapshot {
  return {
    version: 1,
    gameId,
    mode,
    updatedAt: new Date().toISOString(),
    totalPlayers: 0,
    scoreSum: 0,
    entries: [],
  };
}

export function getLeaderboardSnapshotKey(gameId: string, mode: string) {
  return `leaderboards/${gameId}/${mode}.json`;
}

export function hasTargetScore(gameId: string) {
  return typeof getLeaderboardSortConfig(gameId).target === "number";
}

export function getLeaderboardTarget(gameId: string) {
  return getLeaderboardSortConfig(gameId).target ?? null;
}

export function isHigherScoreBetter(gameId: string) {
  return getLeaderboardSortConfig(gameId).primary === "DESC";
}

function getScoreRankValue(gameId: string, score: number) {
  const target = getLeaderboardTarget(gameId);
  if (typeof target === "number") {
    return Math.abs(score - target);
  }

  return score;
}

export function compareScores(gameId: string, left: number, right: number) {
  const leftRank = getScoreRankValue(gameId, left);
  const rightRank = getScoreRankValue(gameId, right);

  if (leftRank !== rightRank) {
    return isHigherScoreBetter(gameId) ? rightRank - leftRank : leftRank - rightRank;
  }

  return 0;
}

export function isBetterScore(gameId: string, candidate: number, current: number) {
  return compareScores(gameId, candidate, current) < 0;
}

export function sortSnapshotEntries(gameId: string, entries: LeaderboardSnapshotEntry[]) {
  return [...entries].sort((a, b) => {
    const comparison = compareScores(gameId, a.score, b.score);
    if (comparison !== 0) {
      return comparison;
    }

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function updateSnapshotWithScore(
  snapshot: LeaderboardSnapshot,
  entry: LeaderboardSnapshotEntry,
  options: {
    isFirstPlayer: boolean;
    previousBestScore: number | null;
  }
) {
  const isImprovedBest =
    options.previousBestScore !== null &&
    isBetterScore(snapshot.gameId, entry.score, options.previousBestScore);

  if (!options.isFirstPlayer && !isImprovedBest) {
    return snapshot;
  }

  const nextSnapshot: LeaderboardSnapshot = {
    ...snapshot,
    updatedAt: new Date().toISOString(),
    totalPlayers: options.isFirstPlayer ? snapshot.totalPlayers + 1 : snapshot.totalPlayers,
    scoreSum: snapshot.scoreSum,
    entries: [...snapshot.entries],
  };

  if (options.isFirstPlayer) {
    nextSnapshot.scoreSum += entry.score;
  } else if (options.previousBestScore !== null) {
    nextSnapshot.scoreSum += entry.score - options.previousBestScore;
  }

  const existingIndex = nextSnapshot.entries.findIndex(
    (currentEntry) => currentEntry.playerId === entry.playerId
  );

  if (existingIndex >= 0) {
    const existingEntry = nextSnapshot.entries[existingIndex];
    if (isBetterScore(snapshot.gameId, entry.score, existingEntry.score)) {
      nextSnapshot.entries[existingIndex] = entry;
    }
  } else {
    nextSnapshot.entries.push(entry);
  }

  nextSnapshot.entries = sortSnapshotEntries(snapshot.gameId, nextSnapshot.entries).slice(0, 20);
  return nextSnapshot;
}
