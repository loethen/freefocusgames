'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCcw, Share2, Square, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareModal } from '@/components/ui/ShareModal';
import { cn } from '@/lib/utils';
import {
  PVT_MODES,
  PvtMode,
  PvtResponse,
  FALSE_START_MS,
  TIMEOUT_MS,
  FEEDBACK_MS,
  randomInterval,
  calculateStats,
} from '../config';

type Screen = 'start' | 'running' | 'results';
// Inside a running test: waiting for the counter, counter running,
// counter stopped on the reaction time, or a false start message
type Phase = 'wait' | 'stimulus' | 'feedback' | 'falseStart';

const MODE_STORAGE_KEY = 'pvtMode';

// Event timestamps share the performance.now() clock in modern browsers;
// fall back to the current time if a browser reports something else.
function eventTime(timeStamp: number) {
  const now = performance.now();
  return timeStamp > 0 && timeStamp <= now ? timeStamp : now;
}

function formatClock(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

export default function PvtGame() {
  const t = useTranslations('games.psychomotorVigilanceTest.gameUI');

  const [screen, setScreen] = useState<Screen>('start');
  const [mode, setMode] = useState<PvtMode>('brief');
  const [phase, setPhase] = useState<Phase>('wait');
  const [feedbackTime, setFeedbackTime] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(PVT_MODES.brief.durationMs);
  const [responses, setResponses] = useState<PvtResponse[]>([]);
  const [falseStarts, setFalseStarts] = useState<number>(0);
  const [showShareModal, setShowShareModal] = useState(false);

  // Refs: timers read these, so they never see stale state
  const modeRef = useRef<PvtMode>('brief');
  const testStartRef = useRef<number>(0);
  const onsetRef = useRef<number | null>(null);
  const responsesRef = useRef<PvtResponse[]>([]);
  const falseStartsRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameRef = useRef<number | null>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (clockRef.current) clearInterval(clockRef.current);
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    timeoutRef.current = null;
    clockRef.current = null;
    frameRef.current = null;
    onsetRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // Remember the last chosen length
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY);
      if (saved === 'brief' || saved === 'standard') {
        setMode(saved);
        setRemainingMs(PVT_MODES[saved].durationMs);
      }
    } catch {
      // Storage unavailable (private mode, blocked cookies)
    }
  }, []);

  const chooseMode = (next: PvtMode) => {
    setMode(next);
    setRemainingMs(PVT_MODES[next].durationMs);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      // Keep the choice for this visit only
    }
  };

  const finishTest = useCallback(() => {
    clearTimers();
    setResponses([...responsesRef.current]);
    setFalseStarts(falseStartsRef.current);
    setScreen('results');
  }, [clearTimers]);

  // Wait a random interval before the next counter, or end the test when time is up
  const scheduleNext = useCallback(() => {
    const elapsed = performance.now() - testStartRef.current;
    if (elapsed >= PVT_MODES[modeRef.current].durationMs) {
      finishTest();
      return;
    }
    onsetRef.current = null;
    setFeedbackTime(null);
    setPhase('wait');
    timeoutRef.current = setTimeout(() => setPhase('stimulus'), randomInterval(modeRef.current));
  }, [finishTest]);

  const showFalseStart = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    onsetRef.current = null;
    falseStartsRef.current += 1;
    setPhase('falseStart');
    timeoutRef.current = setTimeout(scheduleNext, FEEDBACK_MS);
  }, [scheduleNext]);

  const recordResponse = useCallback((reactionTime: number) => {
    const onset = onsetRef.current;
    if (onset === null) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    onsetRef.current = null;

    responsesRef.current.push({ at: Math.round(onset - testStartRef.current), reactionTime });
    setFeedbackTime(reactionTime);
    setPhase('feedback');
    timeoutRef.current = setTimeout(scheduleNext, FEEDBACK_MS);
  }, [scheduleNext]);

  const respond = useCallback((time: number) => {
    if (phase === 'wait') {
      showFalseStart();
      return;
    }
    if (phase !== 'stimulus' || onsetRef.current === null) return;

    const reactionTime = Math.round(time - onsetRef.current);
    if (reactionTime < FALSE_START_MS) {
      showFalseStart();
      return;
    }
    recordResponse(reactionTime);
  }, [phase, showFalseStart, recordResponse]);

  // Start the counter on the frame it first appears, run it every frame,
  // and end the trial as a lapse if nobody responds
  useLayoutEffect(() => {
    if (screen !== 'running' || phase !== 'stimulus') return;
    frameRef.current = requestAnimationFrame(() => {
      const onset = performance.now();
      onsetRef.current = onset;
      const tick = () => {
        if (counterRef.current) {
          counterRef.current.textContent = String(Math.floor(performance.now() - onset)).padStart(3, '0');
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      tick();
      timeoutRef.current = setTimeout(() => recordResponse(TIMEOUT_MS), TIMEOUT_MS);
    });
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [screen, phase, recordResponse]);

  // Space responds while the test runs, without scrolling the page
  useEffect(() => {
    if (screen !== 'running') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.code !== 'Space') return;
      event.preventDefault();
      if (event.repeat) return;
      respond(eventTime(event.timeStamp));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, respond]);

  const startTest = () => {
    clearTimers();
    modeRef.current = mode;
    responsesRef.current = [];
    falseStartsRef.current = 0;
    testStartRef.current = performance.now();
    setResponses([]);
    setFalseStarts(0);
    setRemainingMs(PVT_MODES[mode].durationMs);
    setScreen('running');
    clockRef.current = setInterval(() => {
      setRemainingMs(PVT_MODES[modeRef.current].durationMs - (performance.now() - testStartRef.current));
    }, 250);
    scheduleNext();
    boardRef.current?.focus();
  };

  const stopTest = () => {
    clearTimers();
    setScreen('start');
    setRemainingMs(PVT_MODES[mode].durationMs);
  };

  const config = PVT_MODES[screen === 'start' ? mode : modeRef.current];
  const stats = calculateStats(responses, falseStarts, modeRef.current);
  const progress = Math.min(100, Math.max(0, (1 - remainingMs / config.durationMs) * 100));

  return (
    <>
      <div
        ref={boardRef}
        tabIndex={-1}
        className={cn(
          'relative w-full min-h-96 overflow-hidden rounded-2xl bg-gray-950 text-white outline-none select-none',
          screen === 'running' && 'cursor-pointer touch-manipulation'
        )}
        onPointerDown={screen === 'running' ? (e) => respond(eventTime(e.timeStamp)) : undefined}
        role={screen === 'running' ? 'button' : undefined}
        aria-label={screen === 'running' ? t('boardLabel') : undefined}
      >
        {/* START */}
        {screen === 'start' && (
          <div className="flex min-h-96 flex-col items-center justify-center gap-7 p-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10" aria-hidden="true">
              <Timer className="h-8 w-8 text-red-400" strokeWidth={1.75} />
            </span>
            <div className="space-y-2">
              <p className="text-2xl md:text-3xl font-bold tracking-tight">{t('startTitle')}</p>
              <p className="text-sm md:text-base text-white/70">{t('startHint')}</p>
            </div>

            <div className="grid w-full max-w-sm grid-cols-2 gap-2" role="radiogroup" aria-label={t('lengthLabel')}>
              {(['brief', 'standard'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={mode === option}
                  onClick={() => chooseMode(option)}
                  className={cn(
                    'rounded-xl border px-3 py-3 text-left transition-colors',
                    mode === option
                      ? 'border-red-400/70 bg-red-500/10'
                      : 'border-white/15 hover:border-white/35'
                  )}
                >
                  <span className="block font-semibold">{t(`modes.${option}.title`)}</span>
                  <span className="block text-xs text-white/60">{t(`modes.${option}.note`)}</span>
                </button>
              ))}
            </div>

            <Button onClick={startTest} size="lg" className="bg-white px-8 text-gray-900 hover:bg-white/90">
              {t('start')}
            </Button>
            <p className="hidden items-center gap-2 text-xs text-white/50 sm:flex">
              {t('keyboardHint')}
              <kbd className="rounded-md bg-white/15 px-2 py-0.5 font-sans text-[11px] font-medium text-white/85">
                {t('spaceKey')}
              </kbd>
            </p>
          </div>
        )}

        {/* RUNNING */}
        {screen === 'running' && (
          <>
            <div className="absolute inset-x-0 top-0 h-1 bg-white/10">
              <div className="h-full bg-white/40 transition-[width] duration-200" style={{ width: `${progress}%` }} />
            </div>
            <div className="absolute inset-x-4 top-4 flex items-center justify-between text-xs text-white/50">
              <span className="tabular-nums">{t('timeLeft', { time: formatClock(remainingMs) })}</span>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={stopTest}
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:bg-white/10 hover:text-white/80"
              >
                <Square className="h-3 w-3" aria-hidden="true" />
                {t('stop')}
              </button>
            </div>

            <div className="flex min-h-96 flex-col items-center justify-center p-6 text-center">
              {(phase === 'stimulus' || phase === 'feedback') && (
                <span
                  ref={phase === 'stimulus' ? counterRef : undefined}
                  className="font-mono text-7xl md:text-8xl font-bold tabular-nums text-red-500"
                  aria-live="off"
                >
                  {phase === 'feedback' && feedbackTime !== null
                    ? (feedbackTime >= TIMEOUT_MS ? t('noResponse') : String(feedbackTime).padStart(3, '0'))
                    : '000'}
                </span>
              )}
              {phase === 'falseStart' && (
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-amber-300">{t('falseStart')}</p>
                  <p className="mt-2 text-sm text-white/60">{t('falseStartHint')}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* RESULTS */}
        {screen === 'results' && (
          <div className="mx-auto flex min-h-96 w-full max-w-xl flex-col items-center justify-center gap-6 p-6 text-center">
            {stats ? (
              <>
                <div>
                  <p className="text-sm font-medium text-white/60">{t('results.medianRT')}</p>
                  <p className="mt-1 text-6xl font-bold tabular-nums">
                    {stats.medianRT}
                    <span className="ml-1 text-2xl font-medium text-white/50">ms</span>
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {t(`modes.${modeRef.current}.title`)} · {t('results.responses', { count: stats.responses })}
                  </p>
                </div>

                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    { label: t('results.lapses'), value: stats.lapses, hint: t('results.lapsesHint', { ms: PVT_MODES[modeRef.current].lapseMs }), highlight: true },
                    { label: t('results.falseStarts'), value: stats.falseStarts, hint: t('results.falseStartsHint') },
                    { label: t('results.meanRT'), value: `${stats.meanRT} ms` },
                    { label: t('results.responseSpeed'), value: stats.responseSpeed.toFixed(2), hint: t('results.responseSpeedHint') },
                    { label: t('results.fastest10'), value: `${stats.fastest10} ms` },
                    { label: t('results.slowest10'), value: `${stats.slowest10} ms` },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={cn('rounded-xl px-3 py-3 text-left', item.highlight ? 'bg-red-500/15' : 'bg-white/10')}
                    >
                      <div className="text-xs text-white/60">{item.label}</div>
                      <div className="mt-0.5 text-xl font-semibold tabular-nums">{item.value}</div>
                      {item.hint && <div className="mt-0.5 text-[11px] leading-4 text-white/45">{item.hint}</div>}
                    </div>
                  ))}
                </div>

                <ReactionChart
                  responses={responses}
                  durationMs={PVT_MODES[modeRef.current].durationMs}
                  lapseMs={PVT_MODES[modeRef.current].lapseMs}
                  title={t('results.chartTitle')}
                  lapseLabel={t('results.lapseLine')}
                />
              </>
            ) : (
              <p className="text-white/70">{t('results.notEnough')}</p>
            )}

            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button onClick={() => setScreen('start')} className="flex-1 gap-2 bg-white text-gray-900 hover:bg-white/90">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {t('playAgain')}
              </Button>
              {stats && (
                <Button
                  onClick={() => setShowShareModal(true)}
                  variant="outline"
                  className="flex-1 gap-2 border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  {t('share')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={t('shareTitle')}
        shareText={stats ? t('shareText', { median: stats.medianRT, lapses: stats.lapses, falseStarts: stats.falseStarts }) : ''}
      />
    </>
  );
}

// Reaction time of each response across the test, with the lapse threshold
function ReactionChart({ responses, durationMs, lapseMs, title, lapseLabel }: {
  responses: PvtResponse[];
  durationMs: number;
  lapseMs: number;
  title: string;
  lapseLabel: string;
}) {
  const width = 480;
  const height = 120;
  const pad = 6;
  const maxRT = 1000;
  const y = (rt: number) => pad + (1 - Math.min(rt, maxRT) / maxRT) * (height - pad * 2);
  const x = (at: number) => pad + Math.min(1, at / durationMs) * (width - pad * 2);

  return (
    <div className="w-full text-left">
      <p className="mb-2 text-xs font-medium text-white/60">{title}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full rounded-xl bg-white/5" role="img" aria-label={title}>
        <line x1={pad} x2={width - pad} y1={y(lapseMs)} y2={y(lapseMs)} stroke="rgb(248 113 113 / 0.6)" strokeDasharray="4 4" />
        <text x={width - pad - 2} y={y(lapseMs) - 4} textAnchor="end" fontSize="10" fill="rgb(248 113 113 / 0.8)">
          {lapseLabel} {lapseMs} ms
        </text>
        {responses.map((r, i) => (
          <circle
            key={i}
            cx={x(r.at)}
            cy={y(r.reactionTime)}
            r={3}
            fill={r.reactionTime >= lapseMs ? 'rgb(248 113 113)' : 'rgb(255 255 255 / 0.75)'}
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-white/40">
        <span>0:00</span>
        <span>{formatClock(durationMs)}</span>
      </div>
    </div>
  );
}
