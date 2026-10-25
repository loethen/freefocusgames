'use client';

import React, { MouseEvent, useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { Share, Award, ArrowRight, RotateCcw } from "lucide-react";
import { useTranslations } from 'next-intl';
import { ProgressShareModal } from '@/components/ui/ProgressShareModal';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from '@/i18n/navigation';
import { submitScoreToLeaderboard } from '@/lib/leaderboard';
import { analytics } from '@/lib/analytics';
import { reactionFasterThanPercent, reactionRating } from '@/lib/reaction-time-benchmarks';
import {
  getProgressInsights,
  ProgressCardData,
  recordProgressSnapshot,
} from '@/lib/progress-share';

const MIN_WAIT_TIME = 2000;
const MAX_WAIT_TIME = 6000;
const MAX_ROUNDS = 5;

enum GameStates {
  START,
  WAITING,
  READY,
  RESULT,
  SUMMARY
}

export default function ReactionTimeGame() {
  const t = useTranslations('games.reactionTime.gameUI');
  const pageT = useTranslations('games.reactionTime');
  const shareT = useTranslations('common.progressShare');

  // State management
  const [gameState, setGameState] = useState<GameStates>(GameStates.START);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [results, setResults] = useState<number[]>([]);
  const [round, setRound] = useState<number>(1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [progressCard, setProgressCard] = useState<ProgressCardData | null>(null);

  // Refs for accessibility
  const containerRef = useRef<HTMLDivElement>(null);

  // References for timeout management
  const timeoutRef = useRef<number | null>(null);
  const hasRecordedProgressRef = useRef(false);

  // Load best time from localStorage and set page URL
  useEffect(() => {
    const savedBestTime = localStorage.getItem('reactionBestTime');
    if (savedBestTime) {
      setBestTime(parseInt(savedBestTime));
    }
  }, []);

  useEffect(() => {
    if (gameState === GameStates.SUMMARY) {
      submitScoreToLeaderboard("reaction-time", getAverageTime(results));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const getAverageTime = (results: number[]) => {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / results.length);
  };

  const clearTimeout = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const resetGame = () => {
    clearTimeout();
    setGameState(GameStates.START);
    setReactionTime(null);
    setStartTime(null);
    setProgressCard(null);
    hasRecordedProgressRef.current = false;
    if (round > MAX_ROUNDS) {
      setResults([]);
      setRound(1);
    }
  };

  const startGame = () => {
    clearTimeout();
    setGameState(GameStates.WAITING);

    // Set random wait time
    const randomWaitTime = Math.floor(Math.random() * (MAX_WAIT_TIME - MIN_WAIT_TIME)) + MIN_WAIT_TIME;

    // Change to READY state after random wait time
    timeoutRef.current = window.setTimeout(() => {
      setGameState(GameStates.READY);
      setStartTime(performance.now());
    }, randomWaitTime);
  };

  const handleClick = () => {
    // If in START state, start the game
    if (gameState === GameStates.START) {
      startGame();
      return;
    }

    // If waiting, clicked too early
    if (gameState === GameStates.WAITING) {
      clearTimeout();
      setGameState(GameStates.RESULT);
      setReactionTime(null);
      return;
    }

    // If ready, record reaction time
    if (gameState === GameStates.READY) {
      const now = performance.now();

      if (startTime) {
        const time = Math.round(now - startTime);
        setReactionTime(time);

        // Update best time if better
        if (bestTime === null || time < bestTime) {
          setBestTime(time);
          localStorage.setItem('reactionBestTime', time.toString());
          toast(t('newBestTime') + `: ${time} ${t('milliseconds')}`);
        }

        // Add to results
        const newResults = [...results, time];
        setResults(newResults);

        // Check if reached max rounds
        if (round >= MAX_ROUNDS) {
          setGameState(GameStates.SUMMARY);
        } else {
          setRound(prevRound => prevRound + 1);
          setGameState(GameStates.RESULT);
        }
      }
    }

    // If showing results, start next round or reset
    if (gameState === GameStates.RESULT) {
      startGame();
    }

  };

  const shareResults = () => {
    if (progressCard) {
      setIsShareModalOpen(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.repeat || (event.key !== ' ' && event.key !== 'Enter')) return;
    event.preventDefault();
    handleClick();
  };

  const stopBoardClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  useEffect(() => {
    if (gameState !== GameStates.SUMMARY || results.length === 0 || hasRecordedProgressRef.current) {
      return;
    }

    hasRecordedProgressRef.current = true;
    const averageTime = Math.round(results.reduce((acc, curr) => acc + curr, 0) / results.length);
    const bestRound = Math.min(...results);
    const formatMs = (value: number) => `${value} ${t('milliseconds')}`;
    const history = recordProgressSnapshot('reaction-time', averageTime);
    const insights = getProgressInsights(history, 'lower');
    const deltaText = insights.previous && insights.deltaFromPrevious !== null
      ? (
        insights.isImprovement
          ? shareT('fasterThanLast', { value: formatMs(Math.round(insights.deltaFromPrevious)) })
          : shareT('slowerThanLast', { value: formatMs(Math.round(insights.deltaFromPrevious)) })
      )
      : shareT('firstTrackedSession');

    setProgressCard({
      title: pageT('title'),
      subtitle: t('gameComplete'),
      primaryLabel: t('averageTime'),
      primaryValue: formatMs(averageTime),
      trendText: deltaText,
      historyLabel: shareT('sessionsTracked', { count: insights.sessions }),
      history: history.map((entry) => entry.primaryValue),
      direction: 'lower',
      metrics: [
        { label: t('bestTime'), value: formatMs(bestRound) },
        { label: t('round'), value: `${results.length}/${MAX_ROUNDS}` },
        { label: shareT('sessions'), value: String(insights.sessions) },
      ],
      footer: shareT('sessionsTracked', { count: insights.sessions }),
      theme: {
        backgroundFrom: '#0f3f7a',
        backgroundTo: '#062239',
        accent: '#6fe7ff',
        panel: 'rgba(8, 18, 35, 0.78)',
        text: '#f7fbff',
        mutedText: 'rgba(229, 242, 255, 0.72)',
      },
    });
  }, [gameState, pageT, results, shareT, t]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout();
    };
  }, []);

  // Focus management for accessibility
  useEffect(() => {
    if (gameState === GameStates.READY && containerRef.current) {
      containerRef.current.focus();
    }
  }, [gameState]);

  // One colour per instruction: blue invites a click, red means hold, green means go.
  const getBackgroundStyle = () => {
    switch (gameState) {
      case GameStates.START:
        return { className: "bg-sky-600 text-white", style: {} };
      case GameStates.WAITING:
        return { className: "bg-rose-600 text-white", style: {} };
      case GameStates.READY:
        return { className: "bg-emerald-500 text-white", style: {} };
      default:
        return { className: "bg-slate-900 text-white", style: {} };
    }
  };

  const bgStyle = getBackgroundStyle();
  let ariaLabel = "";

  // Set aria label for screen readers
  if (gameState === GameStates.WAITING) {
    ariaLabel = t('screenReaderWaiting');
  } else if (gameState === GameStates.READY) {
    ariaLabel = t('screenReaderReady');
  }

  const isSummary = gameState === GameStates.SUMMARY;
  const average = getAverageTime(results);
  const fasterThan = reactionFasterThanPercent(average);
  const bestRound = results.length ? Math.min(...results) : null;
  const completedRounds = results.length;

  return (
    <>
      <div className="space-y-6 flex flex-col items-center w-full">
        {/* Game board */}
        <div className="relative w-full">
          <div
            className={`${bgStyle.className} w-full min-h-80 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.25)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center relative select-none ${isSummary ? '' : 'cursor-pointer'}`}
            onClick={isSummary ? undefined : handleClick}
            onKeyDown={isSummary ? undefined : handleKeyDown}
            tabIndex={isSummary ? -1 : 0}
            ref={containerRef}
            role={isSummary ? undefined : "button"}
            aria-label={ariaLabel}
            style={bgStyle.style}
          >
            {/* Game content based on state */}
            <div className="w-full p-6 text-center">
              {gameState === GameStates.START && (
                <div className="flex flex-col items-center justify-center gap-4">
                  <p className="text-3xl md:text-4xl font-bold">{t('startTitle')}</p>
                  <p className="max-w-sm text-base text-white/85">{t('startHint', { total: MAX_ROUNDS })}</p>
                  <p className="hidden text-sm text-white/60 sm:block">{t('keyboardHint')}</p>
                </div>
              )}

              {gameState === GameStates.WAITING && (
                <p className="text-4xl md:text-5xl font-bold">{t('wait')}</p>
              )}

              {gameState === GameStates.READY && (
                <p className="text-5xl md:text-6xl font-bold">{t('clickNow')}</p>
              )}

              {gameState === GameStates.RESULT && (
                <div className="flex flex-col items-center justify-center">
                  {reactionTime === null ? (
                    <>
                      <motion.p
                        className="text-4xl md:text-5xl font-bold text-rose-400"
                        animate={{ x: [0, -6, 6, -6, 6, 0], transition: { duration: 0.4 } }}
                      >
                        {t('tooEarly')}
                      </motion.p>
                      <p className="mt-3 text-base text-white/75">{t('tooEarlyHint')}</p>
                    </>
                  ) : (
                    <motion.p
                      className="text-6xl md:text-7xl font-bold tabular-nums"
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {reactionTime}
                      <span className="ml-1 text-2xl font-medium text-white/60">ms</span>
                    </motion.p>
                  )}
                  <p className="mt-8 text-lg font-medium text-white/90">
                    {reactionTime === null ? t('retryRound') : t('nextRound')}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5" aria-label={t('roundProgress', { current: completedRounds, total: MAX_ROUNDS })}>
                    {Array.from({ length: MAX_ROUNDS }, (_, i) => (
                      <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < completedRounds ? 'bg-white' : 'bg-white/25'}`} />
                    ))}
                    <span className="ml-2 text-xs tabular-nums text-white/50">{completedRounds} / {MAX_ROUNDS}</span>
                  </div>
                </div>
              )}

              {isSummary && (
                <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 py-2">
                  <div>
                    <p className="text-sm font-medium text-white/70">{t('averageTime')}</p>
                    <p className="mt-1 text-6xl font-bold tabular-nums text-white">
                      {average}
                      <span className="ml-1 text-2xl font-medium text-white/60">ms</span>
                    </p>
                  </div>

                  <div className="w-full">
                    <p className="text-lg font-semibold text-white">
                      {t('reflexAnalysis.fasterThan', { percent: fasterThan })}
                    </p>
                    <p className="mt-0.5 text-sm text-amber-300">{t(`reflexAnalysis.${reactionRating(average)}`)}</p>
                    <div className="relative mt-4 h-2 w-full rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400">
                      <span
                        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gray-900 bg-white shadow"
                        style={{ left: `${Math.min(97, Math.max(3, fasterThan))}%` }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] text-white/50">
                      <span>{t('slower')}</span>
                      <span>{t('faster')}</span>
                    </div>
                  </div>

                  <div className="w-full">
                    <p className="mb-2 text-xs font-medium text-white/60">{t('yourRounds')}</p>
                    <div className="grid grid-cols-5 gap-2">
                      {results.map((time, i) => (
                        <span
                          key={i}
                          className={`rounded-lg px-1 py-2 text-sm font-semibold tabular-nums ${time === bestRound ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-white/85'}`}
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={(event) => {
                        stopBoardClick(event);
                        resetGame();
                      }}
                      className="flex-1 gap-2 bg-white text-gray-900 hover:bg-white/90"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      {t('playAgain')}
                    </Button>
                    <Button
                      onClick={(event) => {
                        stopBoardClick(event);
                        shareResults();
                      }}
                      variant="outline"
                      className="flex-1 gap-2 border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    >
                      <Share className="h-4 w-4" aria-hidden="true" />
                      {shareT('button')}
                    </Button>
                  </div>

                  <Link
                    href="/blog/what-is-a-good-reaction-time"
                    onClick={() => analytics.navigation.recommendation({
                      from_page: 'games/reaction-time',
                      to_page: '/blog/what-is-a-good-reaction-time',
                      game_from: 'reaction-time',
                      link_location: 'reaction_result_benchmark',
                    })}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 underline-offset-4 hover:underline"
                  >
                    {t('compareLink')}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Previous best time display (only shown on start screen) */}
        {gameState === GameStates.START && bestTime && (
          <div className="flex justify-center items-center space-x-1 text-gray-600 dark:text-gray-400 text-sm">
            <Award className="w-3 h-3" />
            <span>{t('bestTime')}: <span className="font-bold">{bestTime}</span> ms</span>
          </div>
        )}
      </div>

      <ProgressShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        card={progressCard}
        fileName="reaction-time-progress.png"
      />
    </>
  );
}
