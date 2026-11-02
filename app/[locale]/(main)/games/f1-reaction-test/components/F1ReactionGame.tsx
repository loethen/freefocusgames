'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Award, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressShareModal } from '@/components/ui/ProgressShareModal';
import type { ProgressCardData } from '@/lib/progress-share';
import { cn } from '@/lib/utils';
import { submitScoreToLeaderboard } from '@/lib/leaderboard';
import {
  LIGHT_COUNT,
  LIGHT_INTERVAL_MS,
  MIN_REACTION_MS,
  F1_RANGE_MS,
  HISTORY_SIZE,
  LEADERBOARD_SET_SIZE,
  randomHold,
  formatSeconds,
  rateAgainstF1,
} from '../config';

// idle: waiting to start; sequence: lights coming on and holding;
// go: lights out, timing; result: reaction shown; jump: pressed too early
type Stage = 'idle' | 'sequence' | 'go' | 'result' | 'jump';

const BEST_KEY = 'f1ReactionBest';

// Event timestamps share the performance.now() clock in modern browsers;
// fall back to the current time if a browser reports something else.
function eventTime(timeStamp: number) {
  const now = performance.now();
  return timeStamp > 0 && timeStamp <= now ? timeStamp : now;
}

// Scale for the comparison bar, in milliseconds
const SCALE_MIN = 100;
const SCALE_MAX = 600;
const scalePercent = (ms: number) =>
  Math.min(100, Math.max(0, ((ms - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100));

export default function F1ReactionGame() {
  const t = useTranslations('games.f1ReactionTest.gameUI');
  const pageT = useTranslations('games.f1ReactionTest');
  const locale = useLocale();

  const [stage, setStage] = useState<Stage>('idle');
  const [lit, setLit] = useState(0);
  const [lastTime, setLastTime] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [best, setBest] = useState<number | null>(null);
  // Clean starts in a row since the last jump start, for the leaderboard set
  const [setTimes, setSetTimes] = useState<number[]>([]);
  const [submittedAverage, setSubmittedAverage] = useState<number | null>(null);
  const [shareCard, setShareCard] = useState<ProgressCardData | null>(null);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onsetRef = useRef<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    try {
      const saved = parseInt(localStorage.getItem(BEST_KEY) ?? '', 10);
      if (saved >= MIN_REACTION_MS) setBest(saved);
    } catch {
      // Storage unavailable (private mode, blocked cookies)
    }
  }, []);

  const startSequence = useCallback(() => {
    clearTimers();
    onsetRef.current = null;
    setLit(0);
    setStage('sequence');
    for (let i = 1; i <= LIGHT_COUNT; i++) {
      timersRef.current.push(setTimeout(() => setLit(i), i * LIGHT_INTERVAL_MS));
    }
    timersRef.current.push(setTimeout(() => {
      setLit(0);
      setStage('go');
    }, LIGHT_COUNT * LIGHT_INTERVAL_MS + randomHold()));
  }, [clearTimers]);

  const jumpStart = useCallback(() => {
    clearTimers();
    onsetRef.current = null;
    setSetTimes([]);
    setSubmittedAverage(null);
    setStage('jump');
  }, [clearTimers]);

  const recordTime = useCallback((ms: number) => {
    onsetRef.current = null;
    setLastTime(ms);
    setHistory(prev => [ms, ...prev].slice(0, HISTORY_SIZE));
    setStage('result');

    // Every clean start from the fifth on submits the average of the last five
    const nextSet = [...setTimes, ms].slice(-LEADERBOARD_SET_SIZE);
    setSetTimes(nextSet);
    if (nextSet.length === LEADERBOARD_SET_SIZE) {
      const setAverage = Math.round(nextSet.reduce((a, b) => a + b, 0) / LEADERBOARD_SET_SIZE);
      setSubmittedAverage(setAverage);
      void submitScoreToLeaderboard('f1-reaction-test', setAverage);
    }
    if (best === null || ms < best) {
      setBest(ms);
      try {
        localStorage.setItem(BEST_KEY, String(ms));
      } catch {
        // Keep the best time for this visit only
      }
    }
  }, [best, setTimes]);

  const respond = useCallback((time: number) => {
    if (stage === 'idle' || stage === 'result' || stage === 'jump') {
      startSequence();
      return;
    }
    if (stage === 'sequence') {
      jumpStart();
      return;
    }
    // Lights are out: a press before the frame that showed it, or within
    // MIN_REACTION_MS, was timed in advance
    const onset = onsetRef.current;
    const reaction = onset === null ? 0 : Math.round(time - onset);
    if (reaction < MIN_REACTION_MS) {
      jumpStart();
      return;
    }
    recordTime(reaction);
  }, [stage, startSequence, jumpStart, recordTime]);

  // Start timing on the frame where the lights go out
  useLayoutEffect(() => {
    if (stage !== 'go') return;
    const frame = requestAnimationFrame(() => {
      onsetRef.current = performance.now();
    });
    return () => cancelAnimationFrame(frame);
  }, [stage]);

  // Space or Enter plays like a tap while the board is on screen, without scrolling the page
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      const target = event.target as HTMLElement | null;
      if (target && target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
      const board = boardRef.current?.getBoundingClientRect();
      if (!board || board.bottom <= 0 || board.top >= window.innerHeight) return;
      event.preventDefault();
      if (event.repeat) return;
      respond(eventTime(event.timeStamp));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [respond]);

  const average = history.length > 0 ? Math.round(history.reduce((a, b) => a + b, 0) / history.length) : null;

  // Builds the share card from the latest start, best time and recent starts
  const openShareCard = () => {
    if (lastTime === null) return;
    const seconds = (ms: number) => `${formatSeconds(ms)} s`;
    setShareCard({
      variant: 'score',
      title: pageT('title'),
      subtitle: t('shareCard.subtitle'),
      primaryLabel: t('shareCard.reaction'),
      primaryValue: seconds(lastTime),
      trendText: t(`rating.${rateAgainstF1(lastTime)}`),
      historyLabel: t('shareCard.recentStarts'),
      // Oldest first, so the chart reads left to right
      history: [...history].reverse(),
      direction: 'lower',
      metrics: [
        { label: t('best'), value: best !== null ? seconds(best) : '-', highlight: true },
        { label: t('average'), value: average !== null ? seconds(average) : '-' },
        // Short form so it fits the metric box
        { label: t('shareCard.f1Start'), value: `${F1_RANGE_MS.min / 1000}–${F1_RANGE_MS.max / 1000} s` },
      ],
      footer: t('shareCard.challenge'),
      siteUrl: `freefocusgames.com${locale === 'en' ? '' : `/${locale}`}/games/f1-reaction-test`,
      coverImage: '/games/f1-reaction-test-cover.png',
      description: t('shareCard.description'),
      // Night grid palette from the cover: near-black with start-light red
      theme: {
        backgroundFrom: '#1b1f27',
        backgroundTo: '#050608',
        accent: '#ff3b30',
        panel: 'rgba(12, 14, 19, 0.86)',
        text: '#f7f7f8',
        mutedText: 'rgba(235, 236, 240, 0.68)',
        glow: '#ff3b30',
      },
    });
  };

  return (
    <>
      <div
        ref={boardRef}
        className="relative w-full min-h-96 cursor-pointer select-none overflow-hidden rounded-2xl bg-gray-950 text-white touch-manipulation"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          respond(eventTime(e.timeStamp));
        }}
        role="button"
        tabIndex={0}
        aria-label={t('boardLabel')}
      >
        {best !== null && (
          <p className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm text-white/80">
            <Award className="h-3.5 w-3.5" aria-hidden="true" />
            {t('best')}: <span className="font-semibold tabular-nums">{formatSeconds(best)}</span> s
          </p>
        )}

        <div className="flex min-h-96 flex-col items-center justify-center gap-8 px-4 pb-6 pt-14">
          {/* Start light gantry: five pods, each with two red lights */}
          <div className="flex items-center justify-center gap-2 sm:gap-4" aria-hidden="true">
            {Array.from({ length: LIGHT_COUNT }, (_, i) => {
              const on = stage === 'sequence' && i < lit;
              return (
                <div key={i} className="flex flex-col gap-2 rounded-xl bg-black px-2 py-2.5 ring-1 ring-white/10 sm:gap-3 sm:px-3 sm:py-3">
                  {[0, 1].map((row) => (
                    <span
                      key={row}
                      className={cn(
                        'block h-9 w-9 rounded-full sm:h-14 sm:w-14',
                        on ? 'bg-red-600 shadow-[0_0_24px_6px_rgba(220,38,38,0.55)]' : 'bg-gray-800'
                      )}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          <div className="min-h-28 text-center" aria-live="polite">
            {stage === 'idle' && (
              <>
                <p className="text-2xl md:text-3xl font-bold tracking-tight">{t('startTitle')}</p>
                <p className="mt-2 text-sm text-white/60">{t('startHint')}</p>
              </>
            )}

            {(stage === 'sequence' || stage === 'go') && (
              <p className="text-sm uppercase tracking-[0.2em] text-white/40">{t('waitForLightsOut')}</p>
            )}

            {stage === 'jump' && (
              <>
                <p className="text-3xl md:text-4xl font-bold text-amber-300">{t('jumpStart')}</p>
                <p className="mt-2 text-sm text-white/60">{t('jumpStartHint')}</p>
              </>
            )}

            {stage === 'result' && lastTime !== null && (
              <div className="flex flex-col items-center">
                <p className="text-6xl md:text-7xl font-bold tabular-nums">
                  {formatSeconds(lastTime)}
                  <span className="ml-1 text-2xl font-medium text-white/50">s</span>
                </p>
                <p className="mt-2 text-sm text-white/70">{t(`rating.${rateAgainstF1(lastTime)}`)}</p>

                {/* Your time against the typical F1 start range */}
                <div className="mt-5 w-64 sm:w-80">
                  <div className="relative h-2 rounded-full bg-white/10">
                    <span
                      className="absolute inset-y-0 rounded-full bg-red-500/50"
                      style={{ left: `${scalePercent(F1_RANGE_MS.min)}%`, width: `${scalePercent(F1_RANGE_MS.max) - scalePercent(F1_RANGE_MS.min)}%` }}
                    />
                    <span
                      className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gray-950 bg-white"
                      style={{ left: `${scalePercent(lastTime)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-white/45">
                    <span>0.1 s</span>
                    <span className="text-red-300/80">{t('f1Range')}</span>
                    <span>0.6 s</span>
                  </div>
                </div>

                <p className="mt-4 text-xs text-white/50">{t('again')}</p>
              </div>
            )}
          </div>

          {(stage === 'result' || stage === 'jump') && (
            <p className="text-xs text-white/50">
              {submittedAverage !== null && stage === 'result'
                ? t('leaderboardSubmitted', { time: formatSeconds(submittedAverage) })
                : t('leaderboardProgress', { count: setTimes.length, total: LEADERBOARD_SET_SIZE })}
            </p>
          )}

          {history.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-white/50">{t('recent')}</span>
              {history.map((ms, i) => (
                <span
                  key={`${i}-${ms}`}
                  className={cn('rounded-md px-2 py-1 tabular-nums', ms === best ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-white/80')}
                >
                  {formatSeconds(ms)}
                </span>
              ))}
              {average !== null && history.length > 1 && (
                <span className="text-white/50">
                  {t('average')}: <span className="tabular-nums text-white/80">{formatSeconds(average)}</span>
                </span>
              )}
              {stage === 'result' && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={openShareCard}
                  className="ml-1 h-7 gap-1.5 border-white/25 bg-transparent px-2.5 text-xs text-white hover:bg-white/10 hover:text-white"
                >
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('share')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <ProgressShareModal
        isOpen={shareCard !== null}
        onClose={() => setShareCard(null)}
        card={shareCard}
        fileName="f1-reaction-test.png"
      />
    </>
  );
}
