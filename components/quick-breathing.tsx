"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { analytics } from "@/lib/analytics";

// Box breathing: inhale, hold, exhale, hold — 4 seconds each, 3 rounds.
const PHASES = ["inhale", "holdIn", "exhale", "holdOut"] as const;
const PHASE_SECONDS = 4;
const ROUNDS = 3;
const TOTAL_SECONDS = PHASES.length * PHASE_SECONDS * ROUNDS;

type Status = "idle" | "running" | "done";

export default function QuickBreathing() {
    const t = useTranslations("home.quickBreathing");
    const [status, setStatus] = useState<Status>("idle");
    const [elapsed, setElapsed] = useState(0);
    const startRef = useRef(0);

    useEffect(() => {
        if (status !== "running") return;
        const timer = window.setInterval(() => {
            const seconds = Math.floor((Date.now() - startRef.current) / 1000);
            if (seconds >= TOTAL_SECONDS) {
                setStatus("done");
                analytics.game.complete({
                    game_id: "box-breathing",
                    mode: "homepage",
                    duration_ms: TOTAL_SECONDS * 1000,
                });
            } else {
                setElapsed(seconds);
            }
        }, 250);
        return () => window.clearInterval(timer);
    }, [status]);

    const start = useCallback(() => {
        startRef.current = Date.now();
        setElapsed(0);
        setStatus("running");
        analytics.game.start({ game_id: "box-breathing", mode: "homepage" });
    }, []);

    const stop = useCallback(() => {
        setStatus("idle");
        setElapsed(0);
    }, []);

    const phase = PHASES[Math.floor(elapsed / PHASE_SECONDS) % PHASES.length];
    const secondsLeft = PHASE_SECONDS - (elapsed % PHASE_SECONDS);
    const round = Math.floor(elapsed / (PHASE_SECONDS * PHASES.length)) + 1;
    const expanded = status === "running" && (phase === "inhale" || phase === "holdIn");

    return (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
            <div
                className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-[2rem] border-2 border-teal-500/40 bg-background"
                aria-hidden="true"
            >
                <div
                    className="absolute h-32 w-32 rounded-full bg-teal-500/20 ease-linear motion-reduce:transition-none"
                    style={{
                        transform: `scale(${expanded ? 1 : 0.5})`,
                        transitionProperty: "transform",
                        transitionDuration: `${PHASE_SECONDS}s`,
                    }}
                />
                {status === "running" && (
                    <span className="relative text-4xl font-semibold tabular-nums text-teal-700 dark:text-teal-300">
                        {secondsLeft}
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {t("method")}
                </p>

                <div aria-live="polite" className="min-h-[3.5rem]">
                    {status === "idle" && (
                        <p className="text-lg text-muted-foreground">{t("intro")}</p>
                    )}
                    {status === "running" && (
                        <>
                            <p className="text-2xl font-semibold">{t(`phases.${phase}`)}</p>
                            <p className="text-sm text-muted-foreground">
                                {t("round", { current: round, total: ROUNDS })}
                            </p>
                        </>
                    )}
                    {status === "done" && (
                        <>
                            <p className="text-2xl font-semibold">{t("doneTitle")}</p>
                            <p className="text-sm text-muted-foreground">{t("doneHint")}</p>
                        </>
                    )}
                </div>

                {status === "idle" && (
                    <button
                        type="button"
                        onClick={start}
                        className="inline-flex h-11 items-center rounded-full bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {t("start")}
                    </button>
                )}
                {status === "running" && (
                    <button
                        type="button"
                        onClick={stop}
                        className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                        {t("stop")}
                    </button>
                )}
                {status === "done" && (
                    <button
                        type="button"
                        onClick={start}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        {t("again")}
                    </button>
                )}
            </div>
        </div>
    );
}
