"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

import { Link } from "@/i18n/navigation";

import {
    REACTION_DISTRIBUTION_BINS,
    REACTION_DISTRIBUTION_TOTAL,
} from "@/lib/reaction-time-benchmarks";

// Blog articles embed this chart with <reaction-time-distribution></reaction-time-distribution>.
const COPY = {
    en: {
        title: "How fast are players? Best five-round averages",
        aria: "Histogram of best reaction time averages from 8,791 players. Most players fall between 280 and 440 ms, peaking at 340 to 359 ms. The median is 369 ms.",
        axis: "Average reaction time (ms)",
        players: (n: number) => `${n.toLocaleString("en-US")} players`,
        caption: "8,791 players, March 8 to October 23, 2026, each counted once with their best result. Bars are 20 ms wide; 218 players between 800 and 1,000 ms are not shown.",
        method: "How we collect and filter this data",
    },
    zh: {
        title: "玩家有多快？最佳 5 轮平均反应时间分布",
        aria: "8,791 名玩家最佳平均反应时间的直方图。大多数玩家在 280 到 440 毫秒之间，峰值在 340 到 359 毫秒，中位数为 369 毫秒。",
        axis: "平均反应时间（毫秒）",
        players: (n: number) => `${n.toLocaleString("zh-CN")} 名玩家`,
        caption: "8,791 名玩家，2026 年 3 月 8 日至 10 月 23 日，每人只计最好的一次。每根柱子宽 20 毫秒；800 到 1,000 毫秒之间的 218 名玩家未画出。",
        method: "我们如何收集和筛选这些数据",
    },
};

const WIDTH = 720;
const HEIGHT = 300;
const PAD = { left: 44, right: 12, top: 14, bottom: 44 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;
const FIRST_MS = REACTION_DISTRIBUTION_BINS[0][0];
const BIN_MS = 20;
const BIN_W = PLOT_W / REACTION_DISTRIBUTION_BINS.length;
const Y_MAX = 12;
const Y_TICKS = [0, 3, 6, 9, 12];
const X_TICKS = [200, 300, 400, 500, 600, 700, 800];

const xFor = (ms: number) => PAD.left + ((ms - FIRST_MS) / BIN_MS) * BIN_W;
const yFor = (percent: number) => PAD.top + PLOT_H - (percent / Y_MAX) * PLOT_H;

// A bar with rounded top corners, anchored flat to the baseline.
function barPath(x: number, y: number, w: number, h: number) {
    const r = Math.min(4, h, w / 2);
    const bottom = y + h;
    return `M${x},${bottom}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${bottom}Z`;
}

export function ReactionTimeDistribution() {
    const locale = useLocale();
    const copy = locale === "zh" ? COPY.zh : COPY.en;
    const [active, setActive] = useState<number | null>(null);

    const activeBin = active !== null ? REACTION_DISTRIBUTION_BINS[active] : null;
    const activeShare = activeBin ? (activeBin[1] / REACTION_DISTRIBUTION_TOTAL) * 100 : 0;

    return (
        <figure className="not-prose my-8 rounded-xl border border-border bg-background p-4 sm:p-6">
            <p className="text-sm font-semibold text-foreground">{copy.title}</p>
            <div className="relative mt-3">
                <svg
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    className="h-auto w-full"
                    role="img"
                    aria-label={copy.aria}
                    onMouseLeave={() => setActive(null)}
                >
                    {Y_TICKS.map((tick) => (
                        <g key={tick}>
                            <line
                                x1={PAD.left}
                                x2={WIDTH - PAD.right}
                                y1={yFor(tick)}
                                y2={yFor(tick)}
                                className="stroke-border"
                                strokeWidth={1}
                            />
                            <text
                                x={PAD.left - 8}
                                y={yFor(tick) + 4}
                                textAnchor="end"
                                className="fill-muted-foreground text-[11px]"
                            >
                                {tick}%
                            </text>
                        </g>
                    ))}

                    {REACTION_DISTRIBUTION_BINS.map(([binMs, players], index) => {
                        const percent = (players / REACTION_DISTRIBUTION_TOTAL) * 100;
                        const x = xFor(binMs) + 1;
                        const y = yFor(percent);
                        return (
                            <path
                                key={binMs}
                                d={barPath(x, y, BIN_W - 2, yFor(0) - y)}
                                className={active === index
                                    ? "fill-blue-700 dark:fill-blue-300"
                                    : "fill-blue-500 dark:fill-blue-400"}
                            />
                        );
                    })}

                    <line
                        x1={PAD.left}
                        x2={WIDTH - PAD.right}
                        y1={yFor(0)}
                        y2={yFor(0)}
                        className="stroke-muted-foreground"
                        strokeWidth={1}
                    />
                    {X_TICKS.map((tick) => (
                        <text
                            key={tick}
                            x={xFor(tick)}
                            y={yFor(0) + 18}
                            textAnchor={tick === 800 ? "end" : "middle"}
                            className="fill-muted-foreground text-[11px]"
                        >
                            {tick}
                        </text>
                    ))}
                    <text
                        x={PAD.left + PLOT_W / 2}
                        y={HEIGHT - 4}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[11px]"
                    >
                        {copy.axis}
                    </text>

                    {/* Full-height hit targets, wider than the bars themselves. */}
                    {REACTION_DISTRIBUTION_BINS.map(([binMs], index) => (
                        <rect
                            key={binMs}
                            x={xFor(binMs)}
                            y={PAD.top}
                            width={BIN_W}
                            height={PLOT_H}
                            fill="transparent"
                            onMouseEnter={() => setActive(index)}
                            onClick={() => setActive(index)}
                        />
                    ))}
                </svg>

                {activeBin && (
                    <div
                        className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-sm"
                        style={{ left: `${Math.min(88, Math.max(12, ((xFor(activeBin[0]) + BIN_W / 2) / WIDTH) * 100))}%` }}
                    >
                        <p className="font-semibold tabular-nums">
                            {activeBin[0]}–{activeBin[0] + BIN_MS - 1} ms
                        </p>
                        <p className="tabular-nums text-muted-foreground">
                            {copy.players(activeBin[1])} · {activeShare.toFixed(1)}%
                        </p>
                    </div>
                )}
            </div>
            <figcaption className="mt-3 text-xs leading-5 text-muted-foreground">
                {copy.caption}{" "}
                <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
                    {copy.method}
                </Link>
            </figcaption>
        </figure>
    );
}
