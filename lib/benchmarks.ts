// Player benchmarks shown on /benchmarks. Each entry repeats the numbers published in its article;
// update both together. Distributions are D1 queries of each player's best result, using the same
// exclusions as the article (see /methodology). Shares are relative to `chartTotal`.
import { REACTION_DISTRIBUTION_BINS, REACTION_DISTRIBUTION_TOTAL } from "@/lib/reaction-time-benchmarks";

export type BenchmarkUnit = "ms" | "s" | "cps" | "digits";

export type BenchmarkHistogram = {
    kind: "histogram";
    start: number;
    step: number;
    counts: number[];
    // Axis labels at these bin starts; `end` labels the right edge of the last bar.
    ticks: number[];
    end?: boolean;
};

export type BenchmarkCategories = {
    kind: "categories";
    // [axis label, players]
    bins: [label: string, count: number][];
};

export type BenchmarkId = "reactionTime" | "tenSeconds" | "schulte" | "cps" | "digitSpan" | "trailMaking";

export type Benchmark = {
    id: BenchmarkId;
    game: string;
    article: string;
    unit: BenchmarkUnit;
    players: number;
    median: string;
    top10: string;
    top1?: string;
    chart: BenchmarkHistogram | BenchmarkCategories;
    chartTotal: number;
};

export const BENCHMARKS: Benchmark[] = [
    {
        id: "reactionTime",
        game: "/games/reaction-time",
        article: "/blog/what-is-a-good-reaction-time",
        unit: "ms",
        players: 8791,
        median: "369",
        top10: "284",
        top1: "233",
        chart: {
            kind: "histogram",
            start: REACTION_DISTRIBUTION_BINS[0][0],
            step: 20,
            counts: REACTION_DISTRIBUTION_BINS.map(([, count]) => count),
            ticks: [200, 300, 400, 500, 600, 700],
            end: true,
        },
        chartTotal: REACTION_DISTRIBUTION_TOTAL,
    },
    {
        id: "tenSeconds",
        game: "/games/challenge-10-seconds",
        article: "/blog/10-seconds-challenge-viral-game",
        unit: "ms",
        players: 19788,
        median: "32",
        top10: "2",
        top1: "0.1",
        chart: {
            kind: "categories",
            bins: [
                ["<10", 5334], ["10–25", 3576], ["25–50", 3186], ["50–100", 3083],
                ["100–250", 3043], ["250–500", 958], ["500–1k", 322], ["1k–3k", 250],
            ],
        },
        chartTotal: 19752,
    },
    {
        id: "schulte",
        game: "/games/schulte-table",
        article: "/blog/what-is-a-good-schulte-table-time",
        unit: "s",
        players: 10560,
        median: "26.4",
        top10: "17.1",
        top1: "11.6",
        chart: {
            kind: "histogram",
            start: 8,
            step: 2,
            counts: [
                36, 100, 201, 401, 609, 870, 942, 951, 888, 777, 646, 548, 474, 452, 341, 306,
                254, 233, 209, 177, 115, 105, 84, 82, 78, 53, 51, 43, 34, 35, 29,
            ],
            ticks: [10, 20, 30, 40, 50, 60],
            end: true,
        },
        chartTotal: 10391,
    },
    {
        id: "cps",
        game: "/games/cps-test",
        article: "/blog/what-is-a-good-cps-test-score",
        unit: "cps",
        players: 4554,
        median: "7.0",
        top10: "11.0",
        top1: "14.4",
        chart: {
            kind: "histogram",
            start: 1,
            step: 1,
            counts: [153, 155, 165, 291, 519, 867, 757, 509, 329, 306, 223, 136, 70, 36, 31],
            ticks: [2, 4, 6, 8, 10, 12, 14],
            end: true,
        },
        chartTotal: 4547,
    },
    {
        id: "digitSpan",
        game: "/games/digit-span-test",
        article: "/blog/digit-span-test-explained",
        unit: "digits",
        players: 214,
        median: "7",
        top10: "10",
        chart: {
            kind: "categories",
            bins: [
                ["3", 6], ["4", 14], ["5", 29], ["6", 47], ["7", 34], ["8", 34],
                ["9", 25], ["10", 15], ["11", 5], ["12", 2], ["13+", 3],
            ],
        },
        chartTotal: 214,
    },
    {
        id: "trailMaking",
        game: "/games/trail-making-test",
        article: "/blog/trail-making-test-explained",
        unit: "s",
        players: 201,
        median: "34.6 / 58.8",
        top10: "24.2 / 39.0",
        chart: {
            kind: "histogram",
            start: 40,
            step: 10,
            counts: [4, 9, 15, 23, 38, 28, 21, 12, 9, 9, 9, 6, 6, 0, 1, 1],
            ticks: [40, 80, 120, 160],
            end: true,
        },
        chartTotal: 203,
    },
];

// Dual n-back keeps each player's fastest clear rather than their highest level, so its shares are lower bounds.
export const NBACK_BENCHMARK = {
    game: "/games/dual-n-back",
    article: "/blog/interactive-dual-n-back-tutorial-complete-guide",
    players: 576,
    levels: [
        { level: 3, share: "24" },
        { level: 4, share: "11.5" },
        { level: 5, share: "4" },
    ],
    medianAccuracy: "89",
};
