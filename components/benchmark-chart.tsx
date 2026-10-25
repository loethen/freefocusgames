"use client";

import { useLocale } from "next-intl";

import { DistributionChart, type DistributionBin } from "@/components/distribution-chart";
import type { Benchmark, BenchmarkUnit } from "@/lib/benchmarks";

const UNITS: Record<"en" | "zh", Record<BenchmarkUnit, string>> = {
    en: { ms: "ms", s: "s", cps: "CPS", digits: "digits" },
    zh: { ms: "毫秒", s: "秒", cps: "CPS", digits: "位" },
};

// Number formatting for bin edges: 0.5 steps keep one decimal, the rest are whole numbers.
function edge(value: number) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function toDistributionBins(benchmark: Benchmark, locale: string): DistributionBin[] {
    const unit = UNITS[locale === "zh" ? "zh" : "en"][benchmark.unit];
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
    const locale = useLocale();
    const chart = benchmark.chart;
    const endTick = chart.kind === "histogram" && chart.end
        ? edge(chart.start + chart.counts.length * chart.step)
        : undefined;

    return (
        <DistributionChart
            bins={toDistributionBins(benchmark, locale)}
            total={benchmark.chartTotal}
            axisLabel={axisLabel}
            ariaLabel={ariaLabel}
            tickPosition={chart.kind === "categories" ? "center" : "start"}
            endTick={endTick}
        />
    );
}
