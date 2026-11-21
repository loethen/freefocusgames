"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Calculator,
  Check,
  CheckCircle2,
  Clock3,
  Keyboard,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { gameTabClass, gameTabsClass } from "@/lib/game-tab-styles";
import {
  calculateTenKeyMetrics,
  generateTenKeyEntry,
  generateTenKeyQueue,
  sanitizeTenKeyInput,
  type TenKeyCompletedEntry,
  type TenKeyMetrics,
  type TenKeyMode,
} from "@/lib/ten-key-test";

const DURATION_OPTIONS = [60, 180, 300] as const;
type DurationSeconds = (typeof DURATION_OPTIONS)[number];

const DURATION_LABELS: Record<DurationSeconds, string> = {
  60: "Quick",
  180: "Standard",
  300: "Endurance",
};

const MODE_OPTIONS: Array<{
  id: TenKeyMode;
  title: string;
  sample: string;
  description: string;
}> = [
  {
    id: "numbers",
    title: "Standard Numbers",
    sample: "482915",
    description: "4–8 digit integers for core numpad speed",
  },
  {
    id: "currency",
    title: "Currency & Decimals",
    sample: "1482.50",
    description: "Dollar amounts with decimal points for banking & AP",
  },
  {
    id: "codes",
    title: "ZIP & Account Codes",
    sample: "90210",
    description: "5-digit ZIPs and 7–9 digit invoice or account IDs",
  },
];

const NUMPAD_LAYOUT: Array<
  Array<{ label: string; keyMatch: string; finger: string; span?: number; anchor?: boolean }>
> = [
  [
    { label: "7", keyMatch: "7", finger: "Index" },
    { label: "8", keyMatch: "8", finger: "Middle" },
    { label: "9", keyMatch: "9", finger: "Ring" },
  ],
  [
    { label: "4", keyMatch: "4", finger: "Index" },
    { label: "5", keyMatch: "5", finger: "Middle", anchor: true },
    { label: "6", keyMatch: "6", finger: "Ring" },
  ],
  [
    { label: "1", keyMatch: "1", finger: "Index" },
    { label: "2", keyMatch: "2", finger: "Middle" },
    { label: "3", keyMatch: "3", finger: "Ring" },
  ],
  [
    { label: "0", keyMatch: "0", finger: "Thumb", span: 2 },
    { label: ".", keyMatch: ".", finger: "Ring" },
  ],
];

type TestState = "idle" | "running" | "result";

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatKph(value: number) {
  return value.toLocaleString("en-US");
}

function getBestScoreKey(mode: TenKeyMode, duration: DurationSeconds) {
  return `career-tests:10-key:${mode}:${duration}`;
}

function loadBestScore(mode: TenKeyMode, duration: DurationSeconds): number {
  try {
    return Number(localStorage.getItem(getBestScoreKey(mode, duration)) ?? 0);
  } catch {
    return 0;
  }
}

function saveBestScore(mode: TenKeyMode, duration: DurationSeconds, netKph: number) {
  try {
    const key = getBestScoreKey(mode, duration);
    const previous = Number(localStorage.getItem(key) ?? 0);
    if (netKph > previous) localStorage.setItem(key, String(netKph));
  } catch {
    // Test remains fully usable when localStorage is unavailable.
  }
}

export default function TenKeyTypingTest() {
  const [mode, setMode] = useState<TenKeyMode>("numbers");
  const [duration, setDuration] = useState<DurationSeconds>(60);
  const [remaining, setRemaining] = useState<number>(60);
  const [state, setState] = useState<TestState>("idle");
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [completed, setCompleted] = useState<TenKeyCompletedEntry[]>([]);
  const [typed, setTyped] = useState("");
  const [metrics, setMetrics] = useState<TenKeyMetrics | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(60);
  const [showGuide, setShowGuide] = useState(true);
  const [bestNetKph, setBestNetKph] = useState(0);

  const startedAtRef = useRef(0);
  const completedRef = useRef<TenKeyCompletedEntry[]>([]);
  const queueRef = useRef<string[]>([]);
  const typedRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);

  const allowDecimal = mode === "currency";

  useEffect(() => {
    setBestNetKph(loadBestScore(mode, duration));
  }, [mode, duration]);

  const finish = useCallback(() => {
    if (!startedAtRef.current) return;
    const actualElapsed = Math.max(
      1,
      Math.min(duration, Math.round((Date.now() - startedAtRef.current) / 1000))
    );
    const activeTarget = queueRef.current[0] ?? "";
    const result = calculateTenKeyMetrics(
      completedRef.current,
      activeTarget,
      typedRef.current,
      actualElapsed
    );
    setElapsedSeconds(actualElapsed);
    setMetrics(result);
    setState("result");
    saveBestScore(mode, duration, result.netKph);
    setBestNetKph(loadBestScore(mode, duration));
    analytics.game.complete({
      game_id: "10-key-typing-test",
      mode: `${mode}-${duration}s`,
      score: result.netKph,
      accuracy: Math.round(result.accuracy),
      duration_ms: actualElapsed * 1000,
    });
  }, [duration, mode]);

  useEffect(() => {
    if (state !== "running" || !hasStartedTyping) return;
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const nextRemaining = Math.max(0, duration - elapsed);
      setRemaining(nextRemaining);
      if (nextRemaining <= 0) finish();
    }, 250);
    return () => window.clearInterval(timer);
  }, [duration, finish, hasStartedTyping, state]);

  const start = () => {
    const initialQueue = generateTenKeyQueue(mode, 12);
    queueRef.current = initialQueue;
    completedRef.current = [];
    typedRef.current = "";
    startedAtRef.current = 0;
    setQueue(initialQueue);
    setCompleted([]);
    setTyped("");
    setMetrics(null);
    setRemaining(duration);
    setHasStartedTyping(false);
    setState("running");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const ensureStarted = () => {
    if (startedAtRef.current) return;
    startedAtRef.current = Date.now();
    setHasStartedTyping(true);
    analytics.game.start({
      game_id: "10-key-typing-test",
      mode: `${mode}-${duration}s`,
    });
  };

  const submitCurrentEntry = () => {
    const currentTyped = typedRef.current.trim();
    if (!currentTyped) return;
    const currentTarget = queueRef.current[0] ?? "";
    const nextCompleted = [
      ...completedRef.current,
      { target: currentTarget, typed: currentTyped },
    ];
    const nextQueue = [
      ...queueRef.current.slice(1),
      generateTenKeyEntry(mode),
    ];
    completedRef.current = nextCompleted;
    queueRef.current = nextQueue;
    typedRef.current = "";
    setCompleted(nextCompleted);
    setQueue(nextQueue);
    setTyped("");
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeTenKeyInput(event.target.value, allowDecimal);
    if (sanitized.length > 0) ensureStarted();
    typedRef.current = sanitized;
    setTyped(sanitized);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (typedRef.current.trim().length > 0) {
        ensureStarted();
        submitCurrentEntry();
      }
    }
  };

  if (state === "idle") {
    return (
      <section className="mx-auto max-w-5xl py-4 sm:py-8" aria-labelledby="ten-key-terminal-title">
        <Calculator aria-hidden="true" className="h-12 w-12 text-primary" />
        <h2 id="ten-key-terminal-title" className="mt-4 text-3xl font-semibold tracking-tight">
          10-key numeric keypad terminal
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Enter each number and press Enter (or Space) to advance. Works with a desktop numeric keypad or laptop number row. Scores stay local on your device.
        </p>

        <fieldset className="mt-7">
          <legend className="text-sm font-medium">1. Choose a data format</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {MODE_OPTIONS.map((option) => {
              const selected = mode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMode(option.id)}
                  aria-pressed={selected}
                  className={`relative rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected
                      ? "border-primary/60 bg-primary/[0.06]"
                      : "border-border/60 bg-muted/25 hover:border-border hover:bg-muted/45"
                  }`}
                >
                  {selected && (
                    <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                  <span className="block font-mono text-base font-bold text-primary">
                    {option.sample}
                  </span>
                  <span className="mt-2 block text-sm font-semibold text-foreground">
                    {option.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="text-sm font-medium">2. Choose a test length</legend>
          <div className={`mt-3 grid max-w-xl grid-cols-3 gap-1.5 rounded-2xl p-1.5 ${gameTabsClass}`}>
            {DURATION_OPTIONS.map((seconds) => (
              <button
                key={seconds}
                type="button"
                onClick={() => {
                  setDuration(seconds);
                  setRemaining(seconds);
                }}
                aria-pressed={duration === seconds}
                className={`relative rounded-xl px-2 py-4 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3 ${gameTabClass(duration === seconds)}`}
              >
                {duration === seconds && (
                  <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
                <span className="block text-lg font-bold sm:text-xl">{seconds / 60} min</span>
                <span className="mt-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {DURATION_LABELS[seconds]}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={start}>
            Start 10-key test
          </Button>
          {bestNetKph > 0 && (
            <p className="text-sm text-muted-foreground">
              Personal best for this mode:{" "}
              <strong className="font-mono text-foreground">
                {formatKph(bestNetKph)} Net KPH
              </strong>
            </p>
          )}
        </div>
      </section>
    );
  }

  if (state === "result" && metrics) {
    return (
      <section className="mx-auto max-w-5xl space-y-6 py-4 sm:py-8" aria-live="polite">
        <div>
          <p className="text-sm font-medium text-primary">Practice complete</p>
          <h2 className="mt-1 text-3xl font-semibold">Your 10-key KPH result</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Net KPH", formatKph(metrics.netKph)],
            ["Gross KPH", formatKph(metrics.grossKph)],
            ["Accuracy", `${metrics.accuracy}%`],
            ["Errors", metrics.errors],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-muted/40 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 font-mono text-3xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          {metrics.entriesCompleted} entries submitted ({metrics.entriesExact} exact) ·{" "}
          {metrics.grossKeystrokes} total keystrokes in {elapsedSeconds}s.
        </p>

        <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            Many bank teller, accounts payable, and clerical job listings look for 8,000–12,000 KPH with 95%–98%+ accuracy, though each employer sets its own cutoff, format, and official test provider. Confirm the exact standard in your job announcement.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={start}>
            <RotateCcw aria-hidden="true" />
            Try the same test again
          </Button>
          <Button variant="outline" size="lg" onClick={() => setState("idle")}>
            Change mode or length
          </Button>
        </div>
      </section>
    );
  }

  const activeTarget = queue[0] ?? "";
  const upcomingEntries = queue.slice(1, 4);
  const recentEntries = completed.slice(-2);
  const expectedChar =
    typed.length < activeTarget.length ? activeTarget[typed.length] : "Enter";
  const elapsedSoFar =
    hasStartedTyping && startedAtRef.current
      ? Math.max(1, (Date.now() - startedAtRef.current) / 1000)
      : 0;
  const liveMetrics =
    elapsedSoFar >= 2
      ? calculateTenKeyMetrics(completed, activeTarget, typed, elapsedSoFar)
      : null;

  return (
    <section className="mx-auto max-w-5xl space-y-5" aria-labelledby="active-ten-key-title">
      <h2 id="active-ten-key-title" className="sr-only">
        Active 10-key typing test
      </h2>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-muted/35 px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Time remaining
          </p>
          <p className="mt-1 flex items-center gap-2 font-mono text-3xl font-bold" aria-live="polite">
            <Clock3 aria-hidden="true" className="h-6 w-6 text-primary" />
            {formatClock(remaining)}
          </p>
          {!hasStartedTyping && (
            <p className="mt-1 text-xs text-muted-foreground">
              Starts with your first keystroke
            </p>
          )}
        </div>

        <div className="flex gap-6 text-right">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Entries
            </p>
            <p className="mt-1 font-mono text-2xl font-bold">{completed.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Live Net KPH
            </p>
            <p className="mt-1 font-mono text-2xl font-bold">
              {liveMetrics ? formatKph(liveMetrics.netKph) : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 sm:p-7">
          {/* Recent submitted lines */}
          <div className="min-h-14 space-y-1.5 border-b border-border/50 pb-4">
            {recentEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Type the highlighted number below and press <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px]">Enter</kbd> to submit each entry.
              </p>
            ) : (
              recentEntries.map((entry, idx) => {
                const isExact = entry.target === entry.typed;
                return (
                  <div
                    key={`${completed.length - recentEntries.length + idx}-${entry.target}`}
                    className="flex items-center justify-between font-mono text-sm"
                  >
                    <span className="text-muted-foreground">{entry.target}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={
                          isExact
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {entry.typed}
                      </span>
                      {isExact ? (
                        <CheckCircle2 aria-label="Exact match" className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle aria-label="Mismatch" className="h-4 w-4 text-red-600" />
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Active target number */}
          <div className="py-6 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Current entry
            </p>
            <div
              aria-live="polite"
              className="mt-3 font-mono text-4xl font-bold tracking-[0.14em] sm:text-5xl"
            >
              {Array.from(activeTarget).map((char, index) => {
                if (index < typed.length) {
                  const isCorrect = typed[index] === char;
                  return (
                    <span
                      key={index}
                      className={
                        isCorrect
                          ? "rounded bg-emerald-100 px-0.5 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                          : "rounded bg-red-200 px-0.5 text-red-900 dark:bg-red-950 dark:text-red-200"
                      }
                    >
                      {char}
                    </span>
                  );
                }
                if (index === typed.length) {
                  return (
                    <span
                      key={index}
                      className="border-b-2 border-primary bg-primary/15 px-0.5 text-foreground"
                    >
                      {char}
                    </span>
                  );
                }
                return (
                  <span key={index} className="text-muted-foreground">
                    {char}
                  </span>
                );
              })}
            </div>

            <div className="mx-auto mt-6 max-w-xs">
              <input
                ref={inputRef}
                type="text"
                inputMode={allowDecimal ? "decimal" : "numeric"}
                value={typed}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onPaste={(event) => event.preventDefault()}
                onDrop={(event) => event.preventDefault()}
                autoComplete="off"
                spellCheck={false}
                aria-label="10-key numeric entry input"
                placeholder={allowDecimal ? "0.00" : "000000"}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-center font-mono text-2xl font-semibold tracking-[0.12em] outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Upcoming preview */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border/50 pt-4 font-mono text-sm text-muted-foreground">
            <span className="font-sans text-xs uppercase tracking-wide">Up next:</span>
            {upcomingEntries.map((item, idx) => (
              <span key={`${idx}-${item}`} className={idx === 0 ? "text-foreground/80" : "opacity-60"}>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Collapsible numpad touch-typing visual guide */}
        <aside className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Keyboard aria-hidden="true" className="h-3.5 w-3.5" />
              Numpad guide
            </span>
            <button
              type="button"
              onClick={() => setShowGuide((prev) => !prev)}
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              {showGuide ? "Hide" : "Show"}
            </button>
          </div>

          {showGuide ? (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-3 gap-1.5">
                {NUMPAD_LAYOUT.flat().map((key) => {
                  const isNext = expectedChar === key.keyMatch;
                  return (
                    <div
                      key={key.label}
                      className={`flex flex-col items-center justify-center rounded-lg border py-2 font-mono text-sm font-semibold transition-colors ${
                        key.span === 2 ? "col-span-2" : ""
                      } ${
                        isNext
                          ? "border-primary bg-primary text-primary-foreground"
                          : key.anchor
                            ? "border-primary/40 bg-background text-foreground"
                            : "border-border/70 bg-background/70 text-foreground"
                      }`}
                    >
                      <span>{key.label}</span>
                      <span
                        className={`text-[10px] font-sans font-normal ${
                          isNext ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}
                      >
                        {key.anchor ? "Home" : key.finger}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div
                className={`rounded-lg border py-2 text-center font-mono text-xs font-semibold transition-colors ${
                  expectedChar === "Enter"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-background/70 text-muted-foreground"
                }`}
              >
                Enter · Pinky
              </div>
              <p className="pt-1 text-[11px] leading-4 text-muted-foreground">
                Keep Num Lock ON and anchor fingers on <strong>4 · 5 · 6</strong>.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Guide hidden for blind touch-typing practice.
            </p>
          )}
        </aside>
      </div>

      <Button variant="outline" onClick={finish} disabled={!hasStartedTyping}>
        End and score now
      </Button>
    </section>
  );
}
