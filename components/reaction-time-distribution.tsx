"use client";

import { useTranslations } from "next-intl";

import { BenchmarkChart } from "@/components/benchmark-chart";
import { Link } from "@/i18n/navigation";
import { BENCHMARKS } from "@/lib/benchmarks";

// Blog articles embed this chart with <reaction-time-distribution></reaction-time-distribution>.
const REACTION_BENCHMARK = BENCHMARKS.find((benchmark) => benchmark.id === "reactionTime")!;

export function ReactionTimeDistribution() {
    const t = useTranslations("charts.reactionDistribution");

    return (
        <figure className="not-prose my-8 rounded-xl border border-border bg-background p-4 sm:p-6">
            <p className="text-sm font-semibold text-foreground">{t("title")}</p>
            <div className="mt-3">
                <BenchmarkChart benchmark={REACTION_BENCHMARK} axisLabel={t("axis")} ariaLabel={t("aria")} />
            </div>
            <figcaption className="mt-3 text-xs leading-5 text-muted-foreground">
                {t("caption")}{" "}
                <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
                    {t("method")}
                </Link>
            </figcaption>
        </figure>
    );
}
