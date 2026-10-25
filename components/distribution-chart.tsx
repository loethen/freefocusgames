"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

export type DistributionBin = {
    // Shown in the tooltip, e.g. "300–319 ms".
    range: string;
    count: number;
    // Axis label under this bar: at its left edge for histograms, centred for categories.
    tick?: string;
};

export type DistributionChartProps = {
    bins: DistributionBin[];
    // Players the shares are calculated from, including any outside the chart range.
    total: number;
    axisLabel: string;
    ariaLabel: string;
    tickPosition?: "start" | "center";
    // Optional label for the right edge of the last bar, e.g. "800".
    endTick?: string;
};

const WIDTH = 720;
const HEIGHT = 300;
const PAD = { left: 44, right: 12, top: 14, bottom: 44 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

// A bar with rounded top corners, anchored flat to the baseline.
function barPath(x: number, y: number, w: number, h: number) {
    const r = Math.min(4, h, w / 2);
    const bottom = y + h;
    return `M${x},${bottom}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${bottom}Z`;
}

// Picks a round axis maximum and four steps for the largest share.
function yScale(maxPercent: number) {
    const step = [1, 2, 2.5, 3, 5, 10, 15, 20, 25, 30].find((s) => s * 4 >= maxPercent) ?? Math.ceil(maxPercent / 4);
    return { max: step * 4, ticks: [0, 1, 2, 3, 4].map((i) => i * step) };
}

export function DistributionChart({
    bins,
    total,
    axisLabel,
    ariaLabel,
    tickPosition = "start",
    endTick,
}: DistributionChartProps) {
    const locale = useLocale();
    const [active, setActive] = useState<number | null>(null);

    const binW = PLOT_W / bins.length;
    const shares = bins.map((bin) => (bin.count / total) * 100);
    const { max, ticks } = yScale(Math.max(...shares));
    const xFor = (index: number) => PAD.left + index * binW;
    const yFor = (percent: number) => PAD.top + PLOT_H - (percent / max) * PLOT_H;
    const formatCount = (n: number) => n.toLocaleString(locale === "zh" ? "zh-CN" : "en-US");
    const playersLabel = (n: number) => (locale === "zh" ? `${formatCount(n)} 名玩家` : `${formatCount(n)} players`);

    const activeBin = active !== null ? bins[active] : null;

    return (
        <div className="relative">
            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="h-auto w-full"
                role="img"
                aria-label={ariaLabel}
                onMouseLeave={() => setActive(null)}
            >
                {ticks.map((tick) => (
                    <g key={tick}>
                        <line
                            x1={PAD.left}
                            x2={WIDTH - PAD.right}
                            y1={yFor(tick)}
                            y2={yFor(tick)}
                            className="stroke-border"
                            strokeWidth={1}
                        />
                        <text x={PAD.left - 8} y={yFor(tick) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
                            {tick}%
                        </text>
                    </g>
                ))}

                {bins.map((bin, index) => {
                    const y = yFor(shares[index]);
                    return (
                        <path
                            key={bin.range}
                            d={barPath(xFor(index) + 1, y, binW - 2, yFor(0) - y)}
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
                {bins.map((bin, index) => bin.tick && (
                    <text
                        key={bin.range}
                        x={xFor(index) + (tickPosition === "center" ? binW / 2 : 0)}
                        y={yFor(0) + 18}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[11px]"
                    >
                        {bin.tick}
                    </text>
                ))}
                {endTick && (
                    <text x={xFor(bins.length)} y={yFor(0) + 18} textAnchor="end" className="fill-muted-foreground text-[11px]">
                        {endTick}
                    </text>
                )}
                <text
                    x={PAD.left + PLOT_W / 2}
                    y={HEIGHT - 4}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[11px]"
                >
                    {axisLabel}
                </text>

                {/* Full-height hit targets, wider than the bars themselves. */}
                {bins.map((bin, index) => (
                    <rect
                        key={bin.range}
                        x={xFor(index)}
                        y={PAD.top}
                        width={binW}
                        height={PLOT_H}
                        fill="transparent"
                        onMouseEnter={() => setActive(index)}
                        onClick={() => setActive(index)}
                    />
                ))}
            </svg>

            {activeBin && active !== null && (
                <div
                    className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-sm"
                    style={{ left: `${Math.min(88, Math.max(12, ((xFor(active) + binW / 2) / WIDTH) * 100))}%` }}
                >
                    <p className="font-semibold tabular-nums">{activeBin.range}</p>
                    <p className="tabular-nums text-muted-foreground">
                        {playersLabel(activeBin.count)} · {shares[active].toFixed(1)}%
                    </p>
                </div>
            )}
        </div>
    );
}
