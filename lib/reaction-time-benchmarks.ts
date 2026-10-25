// Reaction time benchmarks from real players: best five-round averages of 8,791 players on
// FreeFocusGames (March 8 to October 23, 2026, excluding results under 120 ms or over 1,000 ms).
// Each point pairs an average in milliseconds with the share of players who were slower.
// The same data backs /blog/what-is-a-good-reaction-time; update both together.
const FASTER_THAN_POINTS: [ms: number, fasterThanPercent: number][] = [
  [200, 99.9],
  [233, 99],
  [250, 97.6],
  [266, 95],
  [284, 90],
  [300, 84.2],
  [320, 75],
  [350, 60.7],
  [369, 50],
  [400, 36.4],
  [440, 25],
  [500, 16.5],
  [582, 10],
  [687, 5],
  [1000, 0],
];

// The median best average: half of all players were faster.
export const REACTION_MEDIAN_MS = 369;

export type ReactionRating = "godlike" | "excellent" | "good" | "average" | "slow";

// Share of players (0-99) whose average was slower than `ms`.
export function reactionFasterThanPercent(ms: number): number {
  const first = FASTER_THAN_POINTS[0];
  const last = FASTER_THAN_POINTS[FASTER_THAN_POINTS.length - 1];
  if (ms <= first[0]) return 99;
  if (ms >= last[0]) return 0;
  for (let i = 1; i < FASTER_THAN_POINTS.length; i++) {
    const [hiMs, hiPct] = FASTER_THAN_POINTS[i];
    if (ms <= hiMs) {
      const [loMs, loPct] = FASTER_THAN_POINTS[i - 1];
      const percent = loPct + ((ms - loMs) / (hiMs - loMs)) * (hiPct - loPct);
      return Math.min(99, Math.max(0, Math.round(percent)));
    }
  }
  return 0;
}

// Rating bands follow the player percentiles: top 5%, top 25%, faster than the median,
// the middle half, and the slowest quarter.
export function reactionRating(ms: number): ReactionRating {
  if (ms <= 266) return "godlike";
  if (ms <= 320) return "excellent";
  if (ms <= 369) return "good";
  if (ms <= 440) return "average";
  return "slow";
}

// Distribution of the same best averages in 20 ms bins: [bin start in ms, players].
// Results from 800 to 1,000 ms (218 players) sit outside the chart range.
export const REACTION_DISTRIBUTION_TOTAL = 8791;
export const REACTION_DISTRIBUTION_BINS: [binStartMs: number, players: number][] = [
  [160, 3], [180, 8], [200, 38], [220, 85], [240, 211], [260, 383], [280, 654], [300, 764],
  [320, 854], [340, 956], [360, 870], [380, 762], [400, 539], [420, 445], [440, 324], [460, 245],
  [480, 201], [500, 159], [520, 133], [540, 139], [560, 120], [580, 120], [600, 96], [620, 85],
  [640, 79], [660, 59], [680, 55], [700, 33], [720, 52], [740, 37], [760, 29], [780, 36],
];
