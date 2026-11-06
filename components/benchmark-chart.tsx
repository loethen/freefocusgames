"use client";

import { useTranslations } from "next-intl";

import { DistributionChart, type DistributionBin } from "@/components/distribution-chart";
import type { Benchmark } from "@/lib/benchmarks";

// Number formatting for bin edges: 0.5 steps keep one decimal, the rest are whole numbers.
function edge(value: number) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

// `unit` is the localized unit label (messages: charts.units).
export function toDistributionBins(benchmark: Benchmark, unit: string): DistributionBin[] {
    const chart = benchmark.chart;

    if (chart.kind === "categories") {
        return chart.bins.map(([label, count]) => ({ range: `${label} ${unit}`, count, tick: label }));
    }

    // Whole-number units such as milliseconds read best as inclusive ranges (300–319 ms).
    const inclusive = benchmark.unit === "ms";
    return chart.counts.map((count, index) => {
        const start = chart.start + index * chart.step;
        const end = inclusive ? start + chart.step - 1 : start + chart.step;
        return {
            range: `${edge(start)}–${edge(end)} ${unit}`,
            count,
            tick: chart.ticks.includes(start) ? edge(start) : undefined,
        };
    });
}

export function BenchmarkChart({ benchmark, axisLabel, ariaLabel }: {
    benchmark: Benchmark;
    axisLabel: string;
    ariaLabel: string;
}) {
    const t = useTranslations("charts.units");
    const chart = benchmark.chart;
    const endTick = chart.kind === "histogram" && chart.end
        ? edge(chart.start + chart.counts.length * chart.step)
        : undefined;

    return (
        <DistributionChart
            bins={toDistributionBins(benchmark, t(benchmark.unit))}
            total={benchmark.chartTotal}
            axisLabel={axisLabel}
            ariaLabel={ariaLabel}
            tickPosition={chart.kind === "categories" ? "center" : "start"}
            endTick={endTick}
        />
    );
}
