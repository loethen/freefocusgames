// Reaction time benchmarks from real players: best five-round averages of 12,157 players on
// FreeFocusGames (March 8 to November 27, 2026, excluding results under 120 ms or over 1,000 ms).
// Each point pairs an average in milliseconds with the share of players who were slower.
// The same data backs /blog/what-is-a-good-reaction-time; update both together.
const FASTER_THAN_POINTS: [ms: number, fasterThanPercent: number][] = [
  [200, 99.8],
  [231, 99],
  [250, 97.2],
  [261, 95],
  [280, 90],
  [300, 82.8],
  [318, 75],
  [350, 59.8],
  [368, 50],
  [400, 36.6],
  [441, 25],
  [500, 16.4],
  [577, 10],
  [682, 5],
  [1000, 0],
];

// The median best average: half of all players were faster.
export const REACTION_MEDIAN_MS = 368;

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
  if (ms <= 261) return "godlike";
  if (ms <= 318) return "excellent";
  if (ms <= 368) return "good";
  if (ms <= 441) return "average";
  return "slow";
}

// Distribution of the same best averages in 20 ms bins: [bin start in ms, players].
// Results from 800 to 1,000 ms (281 players) sit outside the chart range.
export const REACTION_DISTRIBUTION_TOTAL = 12157;
export const REACTION_DISTRIBUTION_BINS: [binStartMs: number, players: number][] = [
  [160, 3], [180, 16], [200, 47], [220, 141], [240, 360], [260, 617], [280, 905], [300, 1061],
  [320, 1130], [340, 1253], [360, 1142], [380, 1033], [400, 746], [420, 616], [440, 454], [460, 352],
  [480, 286], [500, 246], [520, 203], [540, 181], [560, 166], [580, 146], [600, 138], [620, 113],
  [640, 109], [660, 73], [680, 77], [700, 43], [720, 69], [740, 57], [760, 49], [780, 44],
];
