"use client";

import { useLocale } from "next-intl";

import { BenchmarkChart } from "@/components/benchmark-chart";
import { Link } from "@/i18n/navigation";
import { BENCHMARKS } from "@/lib/benchmarks";

// Blog articles embed this chart with <reaction-time-distribution></reaction-time-distribution>.
const COPY = {
    en: {
        title: "How fast are players? Best five-round averages",
        aria: "Histogram of best reaction time averages from 8,791 players. Most players fall between 280 and 440 ms, peaking at 340 to 359 ms. The median is 369 ms.",
        axis: "Average reaction time (ms)",
        caption: "8,791 players, March 8 to October 23, 2026, each counted once with their best result. Bars are 20 ms wide; 218 players between 800 and 1,000 ms are not shown.",
        method: "How we collect and filter this data",
    },
    zh: {
        title: "玩家有多快？最佳 5 轮平均反应时间分布",
        aria: "8,791 名玩家最佳平均反应时间的直方图。大多数玩家在 280 到 440 毫秒之间，峰值在 340 到 359 毫秒，中位数为 369 毫秒。",
        axis: "平均反应时间（毫秒）",
        caption: "8,791 名玩家，2026 年 3 月 8 日至 10 月 23 日，每人只计最好的一次。每根柱子宽 20 毫秒；800 到 1,000 毫秒之间的 218 名玩家未画出。",
        method: "我们如何收集和筛选这些数据",
    },
};

const REACTION_BENCHMARK = BENCHMARKS.find((benchmark) => benchmark.id === "reactionTime")!;

export function ReactionTimeDistribution() {
    const locale = useLocale();
    const copy = locale === "zh" ? COPY.zh : COPY.en;

    return (
        <figure className="not-prose my-8 rounded-xl border border-border bg-background p-4 sm:p-6">
            <p className="text-sm font-semibold text-foreground">{copy.title}</p>
            <div className="mt-3">
                <BenchmarkChart benchmark={REACTION_BENCHMARK} axisLabel={copy.axis} ariaLabel={copy.aria} />
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
