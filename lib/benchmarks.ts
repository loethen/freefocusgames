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
        players: 12157,
        median: "368",
        top10: "280",
        top1: "231",
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
        players: 23851,
        median: "32",
        top10: "2",
        top1: "0.1",
        chart: {
            kind: "categories",
            bins: [
                ["<10", 6361], ["10–25", 4321], ["25–50", 3887], ["50–100", 3706],
                ["100–250", 3676], ["250–500", 1177], ["500–1k", 406], ["1k–3k", 317],
            ],
        },
        chartTotal: 23851,
    },
    {
        id: "schulte",
        game: "/games/schulte-table",
        article: "/blog/what-is-a-good-schulte-table-time",
        unit: "s",
        players: 11720,
        median: "26.8",
        top10: "17.2",
        top1: "11.7",
        chart: {
            kind: "histogram",
            start: 8,
            step: 2,
            counts: [
                41, 105, 218, 426, 677, 962, 1029, 1047, 996, 906, 735, 625, 554, 507, 396, 340,
                295, 271, 243, 197, 145, 120, 99, 94, 92, 61, 61, 49, 37, 40, 37,
            ],
            ticks: [10, 20, 30, 40, 50, 60],
            end: true,
        },
        chartTotal: 11405,
    },
    {
        id: "cps",
        game: "/games/cps-test",
        article: "/blog/what-is-a-good-cps-test-score",
        unit: "cps",
        players: 5533,
        median: "7.0",
        top10: "11.0",
        top1: "14.3",
        chart: {
            kind: "histogram",
            start: 1,
            step: 1,
            counts: [182, 183, 206, 353, 640, 1038, 932, 630, 402, 373, 277, 162, 80, 42, 24],
            ticks: [2, 4, 6, 8, 10, 12, 14],
            end: true,
        },
        chartTotal: 5524,
    },
    {
        id: "digitSpan",
        game: "/games/digit-span-test",
        article: "/blog/digit-span-test-explained",
        unit: "digits",
        players: 601,
        median: "7",
        top10: "10",
        chart: {
            kind: "categories",
            bins: [
                ["3", 9], ["4", 53], ["5", 93], ["6", 141], ["7", 112], ["8", 78],
                ["9", 53], ["10", 33], ["11", 15], ["12", 6], ["13+", 8],
            ],
        },
        chartTotal: 601,
    },
    {
        id: "trailMaking",
        game: "/games/trail-making-test",
        article: "/blog/trail-making-test-explained",
        unit: "s",
        players: 584,
        median: "35.5 / 59.6",
        top10: "23.7 / 38.2",
        chart: {
            kind: "histogram",
            start: 40,
            step: 10,
            counts: [13, 26, 40, 68, 91, 75, 71, 49, 28, 23, 23, 10, 8, 10, 3, 7],
            ticks: [40, 80, 120, 160],
            end: true,
        },
        chartTotal: 545,
    },
];

// Dual n-back keeps each player's fastest clear rather than their highest level, so its shares are lower bounds.
export const NBACK_BENCHMARK = {
    game: "/games/dual-n-back",
    article: "/blog/interactive-dual-n-back-tutorial-complete-guide",
    players: 638,
    levels: [
        { level: 3, share: "23.7" },
        { level: 4, share: "10.8" },
        { level: 5, share: "3.8" },
    ],
    medianAccuracy: "89",
};
