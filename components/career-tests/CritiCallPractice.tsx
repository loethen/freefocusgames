"use client";

import { Button } from "@/components/ui/button";
import {
  createComparisonPair,
  createDispatcherScenario,
  normalizeDispatcherValue,
  scenarioToSpokenCall,
  scenarioToWrittenCall,
  type DispatcherScenario,
} from "@/lib/career-test-scenarios";
import { analytics } from "@/lib/analytics";
import { useGoogleTranslateTts } from "@/hooks/useGoogleTranslateTts";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Headphones,
  Keyboard,
  RotateCcw,
  ScanSearch,
  Volume2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ModuleId = "written-entry" | "audio-entry" | "comparison" | "memory";
type DrillState = "idle" | "active" | "result";

type EntryField = {
  key: keyof DispatcherScenario;
  label: string;
  placeholder: string;
};

const ENTRY_FIELDS: EntryField[] = [
  { key: "lastName", label: "Last name", placeholder: "LAST NAME" },
  { key: "firstName", label: "First name", placeholder: "FIRST NAME" },
  { key: "phone", label: "Telephone", placeholder: "202-555-0100" },
  { key: "address", label: "Address", placeholder: "123 MAIN ST" },
  { key: "city", label: "City", placeholder: "CITY" },
  { key: "zip", label: "ZIP", placeholder: "90000" },
  { key: "vehicle", label: "Vehicle", placeholder: "COLOR MAKE MODEL" },
  { key: "licensePlate", label: "License plate", placeholder: "ABC1234" },
];

const MODULES: Array<{
  id: ModuleId;
  title: string;
  description: string;
  icon: typeof Keyboard;
  detail: string;
}> = [
  {
    id: "written-entry",
    title: "Written Data Entry",
    description: "Read a dispatcher-style call and place each fact in the correct field.",
    icon: Keyboard,
    detail: "8 fields · accuracy and speed",
  },
  {
    id: "audio-entry",
    title: "Audio Data Entry",
    description: "Listen to a generated call and enter names, numbers, and vehicle details.",
    icon: Headphones,
    detail: "Google voice · replay available",
  },
  {
    id: "comparison",
    title: "Character Comparison",
    description: "Decide whether similar-looking number and letter sequences match.",
    icon: ScanSearch,
    detail: "10 rapid comparisons",
  },
  {
    id: "memory",
    title: "Memory Recall",
    description: "Study a short incident record, then recall key details after it disappears.",
    icon: Brain,
    detail: "10-second study period",
  },
];

function formatDuration(milliseconds: number) {
  return `${Math.max(1, Math.round(milliseconds / 1000))}s`;
}

function savePracticeResult(moduleId: ModuleId, score: number) {
  try {
    const key = `career-tests:criticall:${moduleId}`;
    const previous = JSON.parse(localStorage.getItem(key) ?? "[]") as number[];
    localStorage.setItem(key, JSON.stringify([...previous.slice(-9), score]));
  } catch {
    // Practice works even when localStorage is unavailable.
  }
}

function ModuleBackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick} className="mb-4 -ml-3">
      <ArrowLeft aria-hidden="true" />
      All practice modes
    </Button>
  );
}

function ScoreSummary({
  score,
  detail,
}: {
  score: number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl bg-primary/10 p-6 text-center" aria-live="polite">
      <p className="text-sm font-medium text-muted-foreground">Practice accuracy</p>
      <p className="mt-1 text-5xl font-bold tracking-tight">{score}%</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function DataEntryDrill({ audioMode }: { audioMode: boolean }) {
  const [scenario, setScenario] = useState<DispatcherScenario | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [state, setState] = useState<DrillState>("idle");
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const { play, replay, stop, status } = useGoogleTranslateTts();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const moduleId: ModuleId = audioMode ? "audio-entry" : "written-entry";

  const start = useCallback(() => {
    const nextScenario = createDispatcherScenario();
    setScenario(nextScenario);
    setValues({});
    setState("active");
    setScore(0);
    setShowTranscript(false);
    setStartedAt(Date.now());
    analytics.game.start({ game_id: "criticall-practice", mode: moduleId });

    if (audioMode) {
      void play(scenarioToSpokenCall(nextScenario));
    }

    window.setTimeout(() => firstInputRef.current?.focus(), 0);
  }, [audioMode, moduleId, play]);

  const submit = () => {
    if (!scenario) return;

    const correct = ENTRY_FIELDS.filter(
      (field) =>
        normalizeDispatcherValue(values[field.key] ?? "") ===
        normalizeDispatcherValue(String(scenario[field.key]))
    ).length;
    const nextScore = Math.round((correct / ENTRY_FIELDS.length) * 100);
    const duration = Date.now() - startedAt;
    setElapsed(duration);
    setScore(nextScore);
    setState("result");
    stop();
    savePracticeResult(moduleId, nextScore);
    analytics.game.complete({
      game_id: "criticall-practice",
      mode: moduleId,
      score: nextScore,
      accuracy: nextScore,
      duration_ms: duration,
    });
  };

  if (state === "idle") {
    return (
      <div className="py-8 text-center sm:py-12">
        {audioMode ? (
          <Headphones aria-hidden="true" className="mx-auto h-12 w-12 text-primary" />
        ) : (
          <Keyboard aria-hidden="true" className="mx-auto h-12 w-12 text-primary" />
        )}
        <h3 className="mt-4 text-2xl font-semibold">
          {audioMode ? "Audio Data Entry" : "Written Data Entry"}
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          {audioMode
            ? "A computer voice will read a completely fictional incident record. Enter each fact in the matching field. Audio is sent directly to Google Translate for speech playback."
            : "Read one fictional incident record, then transfer its details into the correct fields as quickly and accurately as you can."}
        </p>
        <Button size="lg" className="mt-6" onClick={start}>
          Start practice
        </Button>
      </div>
    );
  }

  if (!scenario) return null;

  const writtenCall = scenarioToWrittenCall(scenario);

  return (
    <div className="space-y-5">
      {(!audioMode || showTranscript || state === "result") && (
        <div className="rounded-2xl bg-muted/45 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Fictional call record
          </p>
          <p className="mt-2 text-base leading-7">{writtenCall}</p>
        </div>
      )}

      {audioMode && state === "active" && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/30 p-4">
          <Button variant="outline" onClick={() => void replay()} disabled={status === "loading"}>
            <Volume2 aria-hidden="true" />
            {status === "playing" ? "Playing call…" : status === "loading" ? "Loading audio…" : "Replay call"}
          </Button>
          {status === "error" && (
            <>
              <p className="text-sm text-destructive">Audio is temporarily unavailable.</p>
              <Button variant="ghost" onClick={() => void replay()}>
                Try again
              </Button>
              <Button variant="ghost" onClick={() => setShowTranscript(true)}>
                Use written fallback
              </Button>
            </>
          )}
        </div>
      )}

      <form
        className="grid gap-x-5 gap-y-4 py-2 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (state === "active") submit();
        }}
      >
        {ENTRY_FIELDS.map((field, index) => {
          const actual = String(scenario[field.key]);
          const isCorrect =
            normalizeDispatcherValue(values[field.key] ?? "") ===
            normalizeDispatcherValue(actual);
          return (
            <label key={field.key} className="block">
              <span className="mb-1.5 block text-sm font-medium">{field.label}</span>
              <div className="relative">
                <input
                  ref={index === 0 ? firstInputRef : undefined}
                  value={values[field.key] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.key]: event.target.value.toUpperCase(),
                    }))
                  }
                  disabled={state === "result"}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={field.placeholder}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 pr-10 font-mono text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-80"
                />
                {state === "result" &&
                  (isCorrect ? (
                    <CheckCircle2 aria-label="Correct" className="absolute right-3 top-3 h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle aria-label="Incorrect" className="absolute right-3 top-3 h-5 w-5 text-red-600" />
                  ))}
              </div>
              {state === "result" && !isCorrect && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  Correct: <strong className="font-mono text-foreground">{actual}</strong>
                </span>
              )}
            </label>
          );
        })}

        <div className="sm:col-span-2">
          {state === "active" ? (
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              Check my entry
            </Button>
          ) : (
            <div className="space-y-4">
              <ScoreSummary
                score={score}
                detail={`${ENTRY_FIELDS.filter((field) => normalizeDispatcherValue(values[field.key] ?? "") === normalizeDispatcherValue(String(scenario[field.key]))).length} of ${ENTRY_FIELDS.length} fields correct · ${formatDuration(elapsed)}`}
              />
              <Button type="button" size="lg" className="w-full" onClick={start}>
                <RotateCcw aria-hidden="true" />
                Practice another call
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

function ComparisonDrill() {
  const [state, setState] = useState<DrillState>("idle");
  const [pair, setPair] = useState(() => createComparisonPair());
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [roundStartedAt, setRoundStartedAt] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const totalRounds = 10;

  const start = useCallback(() => {
    const now = Date.now();
    setPair(createComparisonPair());
    setRound(1);
    setCorrect(0);
    setResponseTimes([]);
    setStartedAt(now);
    setRoundStartedAt(now);
    setState("active");
    analytics.game.start({ game_id: "criticall-practice", mode: "comparison" });
  }, []);

  const answer = useCallback(
    (answerIsMatch: boolean) => {
      if (state !== "active") return;
      const wasCorrect = answerIsMatch === pair.isMatch;
      const nextCorrect = correct + (wasCorrect ? 1 : 0);
      const nextResponseTimes = [...responseTimes, Date.now() - roundStartedAt];

      if (round >= totalRounds) {
        const score = Math.round((nextCorrect / totalRounds) * 100);
        setCorrect(nextCorrect);
        setResponseTimes(nextResponseTimes);
        setState("result");
        savePracticeResult("comparison", score);
        analytics.game.complete({
          game_id: "criticall-practice",
          mode: "comparison",
          score,
          accuracy: score,
          duration_ms: Date.now() - startedAt,
        });
        return;
      }

      setCorrect(nextCorrect);
      setResponseTimes(nextResponseTimes);
      setPair(createComparisonPair());
      setRound((current) => current + 1);
      setRoundStartedAt(Date.now());
    },
    [correct, pair.isMatch, responseTimes, round, roundStartedAt, startedAt, state]
  );

  useEffect(() => {
    if (state !== "active") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "m") answer(true);
      if (event.key.toLowerCase() === "d") answer(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answer, state]);

  if (state === "idle") {
    return (
      <div className="py-8 text-center sm:py-12">
        <ScanSearch aria-hidden="true" className="mx-auto h-12 w-12 text-primary" />
        <h3 className="mt-4 text-2xl font-semibold">Character Comparison</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Compare ten job-style letter and number sequences. Use the buttons or press M for Match and D for Different.
        </p>
        <Button size="lg" className="mt-6" onClick={start}>Start 10 comparisons</Button>
      </div>
    );
  }

  const score = Math.round((correct / totalRounds) * 100);
  const averageTime = responseTimes.length
    ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length)
    : 0;

  if (state === "result") {
    return (
      <div className="space-y-5 py-6 sm:py-8">
        <ScoreSummary score={score} detail={`${correct} of ${totalRounds} correct · ${averageTime} ms average response`} />
        <Button size="lg" className="w-full" onClick={start}>
          <RotateCcw aria-hidden="true" />
          Try another set
        </Button>
      </div>
    );
  }

  return (
    <div className="py-5 sm:py-8">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Comparison {round} of {totalRounds}</span>
        <span>{correct} correct</span>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[pair.left, pair.right].map((value, index) => (
          <div key={`${value}-${index}`} className="rounded-2xl bg-muted/50 px-4 py-10 text-center font-mono text-3xl font-bold tracking-[0.14em] sm:text-4xl">
            {value}
          </div>
        ))}
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3">
        <Button size="lg" variant="outline" onClick={() => answer(false)}>Different <span className="text-xs opacity-60">D</span></Button>
        <Button size="lg" onClick={() => answer(true)}>Match <span className="text-xs opacity-70">M</span></Button>
      </div>
    </div>
  );
}

function MemoryDrill() {
  const [scenario, setScenario] = useState<DispatcherScenario | null>(null);
  const [phase, setPhase] = useState<"idle" | "memorize" | "recall" | "result">("idle");
  const [countdown, setCountdown] = useState(10);
  const [values, setValues] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const recallInputRef = useRef<HTMLInputElement>(null);

  const recallFields = useMemo<EntryField[]>(
    () => [
      { key: "phone", label: "Callback number", placeholder: "202-555-0100" },
      { key: "address", label: "Street address", placeholder: "123 MAIN ST" },
      { key: "licensePlate", label: "License plate", placeholder: "ABC1234" },
      { key: "direction", label: "Direction", placeholder: "NORTHBOUND" },
    ],
    []
  );

  const moveToRecall = useCallback(() => {
    setPhase("recall");
    window.setTimeout(() => recallInputRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (phase !== "memorize") return;
    if (countdown <= 0) {
      moveToRecall();
      return;
    }
    const timer = window.setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, moveToRecall, phase]);

  const start = () => {
    setScenario(createDispatcherScenario());
    setValues({});
    setScore(0);
    setCountdown(10);
    setStartedAt(Date.now());
    setPhase("memorize");
    analytics.game.start({ game_id: "criticall-practice", mode: "memory" });
  };

  const submit = () => {
    if (!scenario) return;
    const correct = recallFields.filter(
      (field) => normalizeDispatcherValue(values[field.key] ?? "") === normalizeDispatcherValue(String(scenario[field.key]))
    ).length;
    const nextScore = Math.round((correct / recallFields.length) * 100);
    setScore(nextScore);
    setPhase("result");
    savePracticeResult("memory", nextScore);
    analytics.game.complete({
      game_id: "criticall-practice",
      mode: "memory",
      score: nextScore,
      accuracy: nextScore,
      duration_ms: Date.now() - startedAt,
    });
  };

  if (phase === "idle") {
    return (
      <div className="py-8 text-center sm:py-12">
        <Brain aria-hidden="true" className="mx-auto h-12 w-12 text-primary" />
        <h3 className="mt-4 text-2xl font-semibold">Memory Recall</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          You have ten seconds to study a fictional incident record. It will disappear before you enter four details from memory.
        </p>
        <Button size="lg" className="mt-6" onClick={start}>Start memory drill</Button>
      </div>
    );
  }

  if (!scenario) return null;

  if (phase === "memorize") {
    return (
      <div className="rounded-2xl bg-primary/10 p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Memorize this record</p>
          <p className="rounded-full bg-background px-3 py-1 font-mono text-sm font-bold">{countdown}s</p>
        </div>
        <dl className="mt-7 grid gap-5 sm:grid-cols-2">
          {[
            ["Caller", `${scenario.firstName} ${scenario.lastName}`],
            ["Callback", scenario.phone],
            ["Address", `${scenario.address}, ${scenario.city}`],
            ["Vehicle", scenario.vehicle],
            ["Plate", scenario.licensePlate],
            ["Direction", scenario.direction],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-mono text-lg font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <Button variant="outline" className="mt-8 w-full" onClick={moveToRecall}>I am ready now</Button>
      </div>
    );
  }

  return (
    <form
      className="py-5 sm:py-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (phase === "recall") submit();
      }}
    >
      <h3 className="text-xl font-semibold">Recall the hidden details</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {recallFields.map((field, index) => {
          const actual = String(scenario[field.key]);
          const isCorrect = normalizeDispatcherValue(values[field.key] ?? "") === normalizeDispatcherValue(actual);
          return (
            <label key={field.key}>
              <span className="mb-1.5 block text-sm font-medium">{field.label}</span>
              <input
                ref={index === 0 ? recallInputRef : undefined}
                value={values[field.key] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value.toUpperCase() }))}
                disabled={phase === "result"}
                autoComplete="off"
                spellCheck={false}
                placeholder={field.placeholder}
                className="h-11 w-full rounded-md border border-input bg-background px-3 font-mono text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-80"
              />
              {phase === "result" && (
                <span className={`mt-1 block text-xs ${isCorrect ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
                  {isCorrect ? "Correct" : <>Correct: <strong className="font-mono text-foreground">{actual}</strong></>}
                </span>
              )}
            </label>
          );
        })}
      </div>
      {phase === "recall" ? (
        <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto">Check my memory</Button>
      ) : (
        <div className="mt-6 space-y-4">
          <ScoreSummary score={score} detail={`${Math.round((score / 100) * recallFields.length)} of ${recallFields.length} details recalled`} />
          <Button type="button" size="lg" className="w-full" onClick={start}>
            <RotateCcw aria-hidden="true" />
            Practice another record
          </Button>
        </div>
      )}
    </form>
  );
}

export default function CritiCallPractice() {
  const [activeModule, setActiveModule] = useState<ModuleId | null>(null);

  return (
    <section className="mx-auto max-w-5xl" aria-labelledby="practice-heading">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Practice terminal</p>
          <h2 id="practice-heading" className="mt-1 text-3xl font-semibold tracking-tight">
            {activeModule ? MODULES.find((item) => item.id === activeModule)?.title : "Choose a skill to practice"}
          </h2>
        </div>
        {!activeModule && <p className="hidden text-sm text-muted-foreground sm:block">Progress stays on this device</p>}
      </div>

      {activeModule ? (
        <>
          <ModuleBackButton onClick={() => setActiveModule(null)} />
          {activeModule === "written-entry" && <DataEntryDrill audioMode={false} />}
          {activeModule === "audio-entry" && <DataEntryDrill audioMode />}
          {activeModule === "comparison" && <ComparisonDrill />}
          {activeModule === "memory" && <MemoryDrill />}
        </>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => setActiveModule(module.id)}
                className="group rounded-2xl border border-border/60 bg-muted/25 p-6 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon aria-hidden="true" className="h-8 w-8 text-primary" />
                <h3 className="mt-5 text-xl font-semibold group-hover:text-primary">{module.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.description}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">{module.detail}</p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
