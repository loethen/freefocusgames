"use client";
import { gameTabClass, gameTabsClass } from '@/lib/game-tab-styles'
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  expectedAnswer,
  makeSequence,
  spanProgress,
  digitSpanLeaderboardMode,
  digitSpanSubmissionDetails,
  validateDigitSpanSubmission,
  SPAN_DISPLAY_MS,
  SPAN_GAP_MS,
  SpanMode,
  SpanTrial,
} from "@/lib/digit-span";
import { Button } from "@/components/ui/button";
import { submitScoreToLeaderboard } from "@/lib/leaderboard";
import { cn } from "@/lib/utils";
import { PlayCircle, Hash, Trophy, Check, X, Delete } from "lucide-react";
export default function DigitSpanGame() {
  const t = useTranslations("games.digitSpanTest.game");
  const [mode, setMode] = useState<SpanMode>("forward");
  const modeRef = useRef<SpanMode>("forward");
  const [phase, setPhase] = useState<
    "idle" | "show" | "answer" | "feedback" | "result" | "interrupted"
  >("idle");
  const [sequence, setSequence] = useState("");
  const [digit, setDigit] = useState("");
  const [answer, setAnswer] = useState("");
  const [trials, setTrials] = useState<SpanTrial[]>([]);
  const [practice, setPractice] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const active = useRef(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const submitted = useRef(false);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    active.current = false;
  };
  const reset = (next: SpanMode) => {
    clearTimers();
    modeRef.current = next;
    setMode(next);
    setPhase("idle");
    setTrials([]);
    setAnswer("");
    setDigit("");
    setPractice(false);
    submitted.current = false;
  };
  useEffect(() => {
    const hash = () => {
      const hashValue = window.location.hash;
      if (hashValue !== "#backward" && hashValue !== "#forward") return;
      const next = hashValue === "#backward" ? "backward" : "forward";
      if (next !== modeRef.current) reset(next);
    };
    hash();
    const interrupt = () => {
      if (active.current) {
        clearTimers();
        setDigit("");
        setPhase("interrupted");
      }
    };
    const visibility = () => {
      if (document.hidden) interrupt();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", interrupt);
    window.addEventListener("hashchange", hash);
    return () => {
      clearTimers();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", interrupt);
      window.removeEventListener("hashchange", hash);
    };
    // Mode changes are handled by reset; this subscription intentionally lasts for the mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (phase === "answer") input.current?.focus();
  }, [phase]);
  const present = (example: boolean, records: SpanTrial[]) => {
    clearTimers();
    if (records.length === 0) submitted.current = false;
    setPractice(example);
    setAnswer("");
    setPhase("show");
    const seq = example ? "418" : makeSequence(spanProgress(records).length);
    setSequence(seq);
    setDigit("");
    active.current = true;
    seq.split("").forEach((d, i) => {
      timers.current.push(
        setTimeout(
          () => setDigit(d),
          500 + i * (SPAN_DISPLAY_MS + SPAN_GAP_MS),
        ),
      );
      timers.current.push(
        setTimeout(
          () => setDigit(""),
          500 + SPAN_DISPLAY_MS + i * (SPAN_DISPLAY_MS + SPAN_GAP_MS),
        ),
      );
    });
    timers.current.push(
      setTimeout(
        () => {
          active.current = false;
          setPhase("answer");
        },
        500 + seq.length * (SPAN_DISPLAY_MS + SPAN_GAP_MS),
      ),
    );
  };
  const submit = () => {
    if (phase !== "answer" || answer.length !== sequence.length) return;
    if (practice) {
      setPhase("feedback");
      return;
    }
    const next = [
      ...trials,
      { sequence, answer, correct: answer === expectedAnswer(sequence, mode) },
    ];
    setTrials(next);
    if (spanProgress(next).done) {
      setPhase("result");
    } else setPhase("feedback");
  };
  const progress = spanProgress(trials);
  useEffect(() => {
    if (
      phase !== "result" ||
      practice ||
      !progress.done ||
      progress.best < 3 ||
      submitted.current
    )
      return;
    const details = digitSpanSubmissionDetails(trials, mode);
    const leaderboardMode = digitSpanLeaderboardMode(mode);
    if (validateDigitSpanSubmission(progress.best, leaderboardMode, details))
      return;
    submitted.current = true;
    void submitScoreToLeaderboard("digit-span-test", progress.best, {
      mode: leaderboardMode,
      details,
    });
  }, [phase, practice, progress.done, progress.best, mode, trials]);
  const summary = (records: SpanTrial[]) => {
    const result = spanProgress(records);
    return result.best
      ? t("span", { count: result.best })
      : t("noSuccessfulSpan");
  };
  const idle = phase === "idle";
  const finished = phase === "result";
  const correct = answer === expectedAnswer(sequence, mode);
  const displayedLength = sequence.length || 3;
  const completedAtLength = trials.filter(
    (trial) => trial.sequence.length === displayedLength,
  ).length;
  const trialNumber =
    phase === "feedback" || phase === "result"
      ? completedAtLength
      : completedAtLength + 1;
  const review = (records: SpanTrial[]) => (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {Array.from(new Set(records.map((trial) => trial.sequence.length))).map(
          (length) => (
            <span key={length}>
              {t("lengthResult", {
                length,
                correct: records.filter(
                  (trial) => trial.sequence.length === length && trial.correct,
                ).length,
                total: records.filter(
                  (trial) => trial.sequence.length === length,
                ).length,
              })}
            </span>
          ),
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {["length", "shown", "answer", "result"].map((key) => (
                <th key={key} className="border-b py-2 pr-3 font-medium">
                  {t(`review.${key}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((trial, index) => (
              <tr key={index} className="border-b border-border/50">
                <td className="py-2 pr-3">{trial.sequence.length}</td>
                <td className="py-2 pr-3 font-mono">{trial.sequence}</td>
                <td className="py-2 pr-3 font-mono">{trial.answer}</td>
                <td className="py-2">
                  {t(trial.correct ? "correct" : "incorrect")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  return (
    <div id="backward" className="max-w-md mx-auto space-y-4 py-4 scroll-mt-20">
      <span id="forward" className="block scroll-mt-20" />
      <div
        className={cn("mx-auto flex max-w-[280px] rounded-lg p-1", gameTabsClass)}
        role="group"
        aria-label={t("modeLabel")}
      >
        {(["forward", "backward"] as const).map((option) => (
          <Button
            key={option}
            type="button"
            variant="ghost"
            aria-pressed={mode === option}
            onClick={() => {
              window.history.replaceState(null, "", `#${option}`);
              if (option !== modeRef.current) reset(option);
            }}
            className={cn(
              "flex-1 h-10 shadow-none",
              gameTabClass(mode === option),
            )}
          >
            {t(option)}
          </Button>
        ))}
      </div>
      <div
        className="flex min-h-6 items-center justify-between gap-2 text-sm text-muted-foreground"
        aria-live="polite"
      >
        <span>
          {practice
            ? t("example")
            : !idle
              ? t("trialStatus", {
                  length: displayedLength,
                  trial: Math.min(2, trialNumber),
                })
              : ""}
        </span>
        {!idle && !practice && (
          <span className="flex items-center gap-1">
            <Trophy className="h-4 w-4" aria-hidden="true" />
            {t("bestSpan", { count: progress.best })}
          </span>
        )}
      </div>
      <div className="min-h-[400px] rounded-lg bg-foreground/5 p-4 sm:p-6 flex flex-col justify-center">
        {idle && (
          <div className="mx-auto flex w-full max-w-[280px] flex-col items-center gap-5 text-center">
            <Hash className="h-12 w-12 text-primary" aria-hidden="true" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{t("readyTitle")}</h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  mode === "forward"
                    ? "forwardInstruction"
                    : "backwardInstruction",
                )}
              </p>
            </div>
            <div className="w-full space-y-2">
              <Button
                size="lg"
                className="w-full gap-2 shadow-none"
                onClick={() => {
                  setTrials([]);
                  present(false, []);
                }}
              >
                <PlayCircle className="h-5 w-5" />
                {t("start")}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => present(true, [])}
              >
                {t("tryExample")}
              </Button>
            </div>
          </div>
        )}
        {phase === "show" && (
          <div className="text-center space-y-8">
            <p className="text-sm text-muted-foreground">{t("watch")}</p>
            <div
              className="h-32 flex items-center justify-center text-8xl font-semibold tabular-nums"
              aria-label={t("presentation")}
            >
              {digit || <span className="text-foreground/20">·</span>}
            </div>
          </div>
        )}
        {phase === "answer" && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="space-y-4"
          >
            <label
              className="block text-center text-sm text-muted-foreground"
              htmlFor="span-answer"
            >
              {t(mode === "forward" ? "enterForward" : "enterBackward", {
                count: sequence.length,
              })}
            </label>
            <textarea
              ref={input}
              id="span-answer"
              value={answer}
              inputMode="numeric"
              autoComplete="off"
              maxLength={sequence.length}
              rows={Math.min(6, Math.max(2, Math.ceil(sequence.length / 20)))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submit();
                }
              }}
              onChange={(event) =>
                setAnswer(
                  event.target.value
                    .replace(/[^0-9]/g, "")
                    .slice(0, sequence.length),
                )
              }
              className="w-full min-w-0 resize-none rounded-md border border-input p-3 text-center text-xl tracking-widest font-mono bg-background break-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <div className="grid grid-cols-3 gap-2">
              {"123456789".split("").map((number) => (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 text-lg shadow-none touch-manipulation"
                  key={number}
                  onClick={() =>
                    setAnswer((value) =>
                      (value + number).slice(0, sequence.length),
                    )
                  }
                >
                  {number}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                className="h-12 shadow-none"
                aria-label={t("delete")}
                onClick={() => setAnswer((value) => value.slice(0, -1))}
              >
                <Delete className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 text-lg shadow-none"
                onClick={() =>
                  setAnswer((value) => (value + "0").slice(0, sequence.length))
                }
              >
                0
              </Button>
              <Button
                type="submit"
                className="h-12 shadow-none"
                disabled={answer.length !== sequence.length}
              >
                {t("submit")}
              </Button>
            </div>
          </form>
        )}
        {phase === "feedback" && (
          <div role="status" className="space-y-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center">
              {correct ? (
                <Check className="h-10 w-10" />
              ) : (
                <X className="h-10 w-10 text-destructive" />
              )}
            </div>
            <h2 className="text-xl font-semibold">
              {t(correct ? "correct" : "incorrect")}
            </h2>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                {t("expectedAnswer", {
                  answer: expectedAnswer(sequence, mode),
                })}
              </p>
              <p>{t("yourAnswer", { answer })}</p>
            </div>
            <Button
              className="shadow-none"
              onClick={() => {
                if (practice) reset(mode);
                else present(false, trials);
              }}
            >
              {t(practice ? "finishExample" : "nextTrial")}
            </Button>
          </div>
        )}
        {phase === "interrupted" && (
          <div role="alert" className="space-y-5 text-center">
            <p className="text-sm text-muted-foreground">{t("interrupted")}</p>
            <Button
              className="shadow-none"
              onClick={() => present(practice, trials)}
            >
              {t("restartTrial")}
            </Button>
          </div>
        )}
        {finished && (
          <div className="space-y-5 text-center">
            <Trophy className="h-10 w-10 mx-auto" aria-hidden="true" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("longestSpan")}
              </p>
              <h2 className="text-3xl font-semibold tabular-nums">
                {summary(trials)}
              </h2>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                className="shadow-none"
                onClick={() => {
                  setTrials([]);
                  present(false, []);
                }}
              >
                {t("tryAgain")}
              </Button>
              <Button variant="ghost" onClick={() => reset(mode)}>
                {t("changeMode")}
              </Button>
            </div>
          </div>
        )}
      </div>
      {finished && (
        <details className="border-b pb-3">
          <summary className="cursor-pointer py-2 text-sm font-medium">
            {t("trialReview")}
          </summary>
          {review(trials)}
        </details>
      )}
    </div>
  );
}
