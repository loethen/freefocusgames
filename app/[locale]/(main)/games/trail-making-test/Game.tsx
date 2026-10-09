"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { PlayCircle, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { gameTabClass, gameTabsClass } from "@/lib/game-tab-styles";
import { submitScoreToLeaderboard } from "@/lib/leaderboard";
import {
  createTrailLayout,
  initialTrailRun,
  selectTrailPoint,
  trailSegmentBetweenEdges,
  trailLabels,
  validateTrailSubmission,
  TRAIL_BOARD_SIZE,
  TRAIL_LAYOUT_VERSION,
  TRAIL_LEADERBOARD_MODE,
  TRAIL_RULES_VERSION,
  type TrailMode,
  type TrailPart,
  type TrailPoint,
  type TrailRun,
} from "@/lib/trail-making";

type Phase =
  | "idle"
  | "running"
  | "between"
  | "result"
  | "practice-result"
  | "interrupted";
type Result = {
  part: TrailPart;
  durationMs: number;
  errors: number;
  connected: number;
  seed: number;
  layoutVersion: string;
  width: number;
  height: number;
  inputMethod: "pointer" | "keyboard" | "mixed" | null;
};
type Runtime = {
  run: TrailRun;
  part: TrailPart;
  practice: boolean;
  seed: number;
  startedAt: number;
  inputMethod: Result["inputMethod"];
  width: number;
  height: number;
  radius: number;
};

export default function TrailMakingGame() {
  const t = useTranslations("games.trailMakingTest.game");
  const [mode, setMode] = useState<TrailMode>("both");
  const modeRef = useRef<TrailMode>("both");
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const [part, setPart] = useState<TrailPart>("a");
  const [practice, setPractice] = useState(false);
  const [points, setPoints] = useState<TrailPoint[]>([]);
  const [run, setRun] = useState(() => initialTrailRun());
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [errorPoint, setErrorPoint] = useState<number | null>(null);
  const runtime = useRef<Runtime | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const nodeSizer = useRef<HTMLSpanElement>(null);
  const submitted = useRef(false);
  const boardSize = useRef({ width: 0, height: 0 });
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setStage = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };
  const stopTimers = () => {
    if (interval.current) clearInterval(interval.current);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    interval.current = null;
    errorTimer.current = null;
  };
  const interrupt = () => {
    if (phaseRef.current !== "running" && phaseRef.current !== "between")
      return;
    stopTimers();
    runtime.current = null;
    setResults([]);
    setErrorPoint(null);
    setStage("interrupted");
  };
  const changeMode = (next: TrailMode) => {
    if (next === modeRef.current) return;
    const inProgress =
      phaseRef.current === "running" || phaseRef.current === "between";
    stopTimers();
    runtime.current = null;
    modeRef.current = next;
    setMode(next);
    setResults([]);
    setErrorPoint(null);
    setPoints([]);
    setElapsed(0);
    setPractice(false);
    submitted.current = false;
    setStage(inProgress ? "interrupted" : "idle");
  };

  useEffect(() => {
    const hash = () => {
      const value = window.location.hash;
      if (value === "#part-a") changeMode("a");
      if (value === "#part-b") changeMode("b");
      if (value === "#both") changeMode("both");
    };
    hash();
    const hidden = () => {
      if (document.hidden) interrupt();
    };
    window.addEventListener("hashchange", hash);
    window.addEventListener("blur", interrupt);
    document.addEventListener("visibilitychange", hidden);
    const observer = new ResizeObserver(() => {
      const rect = board.current?.getBoundingClientRect();
      if (!rect) return;
      const changed =
        Math.abs(rect.width - boardSize.current.width) > 0.5 ||
        Math.abs(rect.height - boardSize.current.height) > 0.5;
      if (boardSize.current.width > 0 && changed) interrupt();
      boardSize.current = { width: rect.width, height: rect.height };
    });
    if (board.current) observer.observe(board.current);
    return () => {
      stopTimers();
      runtime.current = null;
      observer.disconnect();
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("blur", interrupt);
      document.removeEventListener("visibilitychange", hidden);
    };
    // Handlers read refs so asynchronous interruptions use the current run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = (
    nextPart: TrailPart,
    example = false,
    continuation = false,
  ) => {
    stopTimers();
    if (!continuation) {
      setResults([]);
      submitted.current = false;
    }
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const layout = createTrailLayout(seed, example ? 5 : 25);
    const nextRun = initialTrailRun(layout.length);
    const rect = board.current?.getBoundingClientRect();
    const dimensions = { width: rect?.width ?? 0, height: rect?.height ?? 0 };
    boardSize.current = dimensions;
    runtime.current = {
      run: nextRun,
      part: nextPart,
      practice: example,
      seed,
      startedAt: performance.now(),
      inputMethod: null,
      radius: (nodeSizer.current?.getBoundingClientRect().width ?? 32) / 2,
      ...dimensions,
    };
    setPoints(layout);
    setRun(nextRun);
    setPart(nextPart);
    setPractice(example);
    setElapsed(0);
    setErrorPoint(null);
    setStage("running");
    interval.current = setInterval(() => {
      if (runtime.current && !runtime.current.run.finished)
        setElapsed(performance.now() - runtime.current.startedAt);
    }, 100);
  };
  const select = (index: number, inputMethod: "pointer" | "keyboard") => {
    const current = runtime.current;
    if (!current || current.run.finished || phaseRef.current !== "running")
      return;
    current.inputMethod =
      current.inputMethod && current.inputMethod !== inputMethod
        ? "mixed"
        : inputMethod;
    const next = selectTrailPoint(current.run, index);
    const wrong = next.errors > current.run.errors;
    current.run = next;
    setRun(next);
    if (wrong) {
      setErrorPoint(index);
      if (errorTimer.current) clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => setErrorPoint(null), 300);
    }
    if (!next.finished) return;
    const durationMs = performance.now() - current.startedAt;
    stopTimers();
    runtime.current = null;
    setElapsed(durationMs);
    setErrorPoint(null);
    if (current.practice) {
      setStage("practice-result");
      return;
    }
    setResults((previous) => [
      ...previous,
      {
        part: current.part,
        durationMs,
        errors: next.errors,
        connected: next.nextIndex,
        seed: current.seed,
        layoutVersion: TRAIL_LAYOUT_VERSION,
        width: current.width,
        height: current.height,
        inputMethod: current.inputMethod,
      },
    ]);
    setStage(
      modeRef.current === "both" && current.part === "a" ? "between" : "result",
    );
  };
  useEffect(() => {
    if (phase !== "result" || mode !== "both" || practice || submitted.current || results.length !== 2)
      return;
    const [a, b] = results;
    if (a.part !== "a" || b.part !== "b") return;
    const details = {
      finished: true,
      rulesVersion: TRAIL_RULES_VERSION,
      layoutVersion: TRAIL_LAYOUT_VERSION,
      aDurationMs: Math.round(a.durationMs), bDurationMs: Math.round(b.durationMs),
      aErrors: a.errors, bErrors: b.errors,
      aConnected: a.connected, bConnected: b.connected,
      aSeed: a.seed, bSeed: b.seed,
      aWidth: a.width, bWidth: b.width, aHeight: a.height, bHeight: b.height,
      aInputMethod: a.inputMethod, bInputMethod: b.inputMethod,
    };
    const score = details.aDurationMs + details.bDurationMs;
    if (validateTrailSubmission(score, TRAIL_LEADERBOARD_MODE, details)) return;
    submitted.current = true;
    void submitScoreToLeaderboard("trail-making-test", score, {
      mode: TRAIL_LEADERBOARD_MODE,
      details,
    });
  }, [phase, mode, practice, results]);
  const labels = trailLabels(part, points.length);
  const initialPart = mode === "b" ? "b" : "a";
  const resultList = (
    <div className="space-y-2">
      {results.map((result) => (
        <div
          key={result.part}
          className="flex items-center justify-between gap-4 text-sm"
        >
          <span className="font-medium">{t(result.part)}</span>
          <span className="tabular-nums">
            {t("resultSummary", {
              time: (result.durationMs / 1000).toFixed(2),
              errors: result.errors,
            })}
          </span>
        </div>
      ))}
      {mode === "both" && results.length === 2 && (
        <div className="flex items-center justify-between gap-4 border-t pt-2 text-sm font-semibold">
          <span>{t("combined")}</span>
          <span className="tabular-nums">{t("resultSummary", {
            time: ((Math.round(results[0].durationMs) + Math.round(results[1].durationMs)) / 1000).toFixed(3),
            errors: results[0].errors + results[1].errors,
          })}</span>
        </div>
      )}
    </div>
  );
  return (
    <div className="mx-auto max-w-[520px] space-y-4 py-4">
      <span id="part-a" className="block scroll-mt-20" />
      <span id="part-b" className="block scroll-mt-20" />
      <div
        className={cn("mx-auto flex max-w-sm rounded-lg p-1", gameTabsClass)}
        role="group"
        aria-label={t("modeLabel")}
      >
        {(["both", "a", "b"] as const).map((option) => (
          <Button
            key={option}
            variant="ghost"
            className={cn("flex-1 h-10", gameTabClass(mode === option))}
            aria-pressed={mode === option}
            onClick={() => {
              window.history.replaceState(
                null,
                "",
                option === "both" ? "#both" : `#part-${option}`,
              );
              changeMode(option);
            }}
          >
            {t(option)}
          </Button>
        ))}
      </div>
      <div className="flex min-h-6 items-center justify-between gap-2 text-sm text-muted-foreground">
        <span aria-live="polite">
          {phase === "running"
            ? `${practice ? t("practice") : t(part)} · ${t("progress", { count: run.nextIndex, total: run.count })}`
            : ""}
        </span>
        {phase === "running" && (
          <span className="tabular-nums">
            {t("runningTime", { time: (elapsed / 1000).toFixed(2) })}
          </span>
        )}
      </div>
      <div
        ref={board}
        className="relative aspect-square min-h-[360px] w-full rounded-lg bg-foreground/5 select-none"
      >
        <span ref={nodeSizer} aria-hidden="true" className="pointer-events-none invisible absolute size-8 sm:size-10" />
        {phase === "running" && (
          <>
            <svg
              viewBox={`0 0 ${runtime.current?.width ?? TRAIL_BOARD_SIZE} ${runtime.current?.height ?? TRAIL_BOARD_SIZE}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full pointer-events-none"
              aria-hidden="true"
            >
              {points.slice(1, run.nextIndex).map((point, index) => {
                const current = runtime.current;
                if (!current) return null;
                const toPixels = (value: TrailPoint) => ({
                  x: value.x / TRAIL_BOARD_SIZE * current.width,
                  y: value.y / TRAIL_BOARD_SIZE * current.height,
                });
                const segment = trailSegmentBetweenEdges(toPixels(points[index]), toPixels(point), current.radius);
                return segment && <line key={index}
                  x1={segment.start.x} y1={segment.start.y}
                  x2={segment.end.x} y2={segment.end.y}
                  stroke="currentColor" strokeOpacity=".3" strokeWidth="3"
                />;
              })}
            </svg>
            {points
              .map((point, index) => ({ point, index }))
              .sort(
                (first, second) =>
                  first.point.y - second.point.y ||
                  first.point.x - second.point.x,
              )
              .map(({ point, index }) => (
                <button
                  key={index}
                  type="button"
                  aria-label={t("pointLabel", { label: labels[index] })}
                  onClick={(event) =>
                    select(index, event.detail === 0 ? "keyboard" : "pointer")
                  }
                  onKeyDown={(event) => {
                    if (event.repeat) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      select(index, "keyboard");
                    }
                  }}
                  style={{
                    left: `${(point.x / TRAIL_BOARD_SIZE) * 100}%`,
                    top: `${(point.y / TRAIL_BOARD_SIZE) * 100}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex min-h-11 min-w-11 items-center justify-center rounded-full touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    style={labels[index] === "I" ? { fontFamily: "Georgia, 'Times New Roman', serif" } : undefined}
                    className={cn(
                      "flex size-8 sm:size-10 items-center justify-center rounded-full border bg-background text-sm font-semibold tabular-nums",
                      index < run.nextIndex &&
                        "bg-muted border-foreground/30",
                      errorPoint === index &&
                        "border-destructive bg-destructive/10 text-destructive",
                    )}
                  >
                    {labels[index]}
                  </span>
                </button>
              ))}
          </>
        )}
        {phase !== "running" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-5 text-center">
            {(phase === "idle" || phase === "interrupted") && (
              <>
                <Route className="h-10 w-10 text-primary" aria-hidden="true" />
                <p
                  className="max-w-xs text-sm text-muted-foreground"
                  role={phase === "interrupted" ? "alert" : undefined}
                >
                  {t(
                    phase === "interrupted"
                      ? "interrupted"
                      : initialPart === "a"
                        ? "instructionA"
                        : "instructionB",
                  )}
                </p>
                <Button
                  size="lg"
                  className="gap-2 shadow-none"
                  onClick={() => start(initialPart)}
                >
                  <PlayCircle className="h-5 w-5" />
                  {t(phase === "interrupted" ? "restart" : "start")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => start(initialPart, true)}
                >
                  {t("tryPractice")}
                </Button>
              </>
            )}
            {phase === "practice-result" && (
              <>
                <h2 className="text-xl font-semibold">
                  {t("practiceComplete")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("practiceUnscored")}
                </p>
                <Button
                  onClick={() => start(initialPart)}
                  className="shadow-none"
                >
                  {t("start")}
                </Button>
                <Button variant="ghost" onClick={() => setStage("idle")}>
                  {t("changeMode")}
                </Button>
              </>
            )}
            {(phase === "between" || phase === "result") && (
              <>
                <h2 className="text-xl font-semibold">
                  {t(phase === "between" ? "partAComplete" : "complete")}
                </h2>
                {resultList}
                {phase === "between" ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {t("instructionB")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("betweenParts")}
                    </p>
                    <Button
                      onClick={() => start("b", false, true)}
                      className="shadow-none"
                    >
                      {t("startPartB")}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => start(initialPart)}
                    className="shadow-none"
                  >
                    {t("tryAgain")}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setResults([]);
                    setStage("idle");
                  }}
                >
                  {t("changeMode")}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      <p
        className="min-h-5 text-center text-sm text-muted-foreground"
        aria-live="polite"
      >
        {phase === "running" ? t("errors", { count: run.errors }) : ""}
      </p>
    </div>
  );
}
