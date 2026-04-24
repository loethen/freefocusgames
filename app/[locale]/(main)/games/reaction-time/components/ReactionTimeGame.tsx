'use client';

import React, { MouseEvent, useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { Share, Award } from "lucide-react";
import { useTranslations } from 'next-intl';
import { ProgressShareModal } from '@/components/ui/ProgressShareModal';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { submitScoreToLeaderboard } from '@/lib/leaderboard';
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

  const getReflexAnalysisKey = (ms: number) => {
    if (ms < 200) return 'godlike';
    if (ms < 250) return 'excellent';
    if (ms < 300) return 'good';
    if (ms < 400) return 'average';
    return 'slow';
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
      setStartTime(Date.now());
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
      const now = Date.now();

      if (startTime) {
        const time = now - startTime;
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

    // If summary, reset the game
    if (gameState === GameStates.SUMMARY) {
      resetGame();
    }
  };

  const shareResults = () => {
    if (progressCard) {
      setIsShareModalOpen(true);
    }
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

  // Get background color and style based on game state
  const getBackgroundStyle = () => {
    switch (gameState) {
      case GameStates.START:
        return {
          className: "bg-blue-500",
          style: {}
        };
      case GameStates.WAITING:
        return {
          className: "bg-blue-500",
          style: {}
        };
      case GameStates.READY:
        return {
          className: "bg-green-500",
          style: {}
        };
      default:
        return {
          className: "bg-gray-800 text-white dark:bg-gray-900",
          style: {}
        };
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

  return (
    <>
      <div className="space-y-6 flex flex-col items-center w-full">
        {/* Game board */}
        <div className="relative w-full">
          <div
            className={`${bgStyle.className} w-full h-80 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.25)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer flex items-center justify-center relative select-none`}
            onClick={handleClick}
            tabIndex={0}
            ref={containerRef}
            role="button"
            aria-label={ariaLabel}
            style={bgStyle.style}
          >
            {/* Game content based on state */}
            <div className="p-4 text-center">
              {gameState === GameStates.START && (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-2xl md:text-3xl font-bold text-white">{t('startButton')}</p>
                </div>
              )}

              {gameState === GameStates.WAITING && (
                <div className="flex items-center justify-center h-full">
                  <motion.p
                    className="text-3xl md:text-4xl font-bold text-white"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {t('wait')}
                  </motion.p>
                </div>
              )}

              {gameState === GameStates.READY && (
                <div className="flex items-center justify-center h-full">
                  <motion.p
                    className="text-3xl md:text-4xl font-bold text-white"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    {t('clickNow')}
                  </motion.p>
                </div>
              )}

              {gameState === GameStates.RESULT && (
                <div className="flex flex-col items-center justify-center h-full">
                  {reactionTime === null ? (
                    <motion.p
                      className="text-xl md:text-2xl font-bold text-red-500"
                      animate={{
                        x: [0, -5, 5, -5, 5, 0],
                        transition: { duration: 0.5 }
                      }}
                    >
                      {t('tooEarly')}
                    </motion.p>
                  ) : (
                    <>
                      <motion.p
                        className="text-4xl md:text-5xl font-bold text-white"
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        {reactionTime}
                      </motion.p>
                      <p className="text-sm md:text-base text-gray-200 mt-1">{t('milliseconds')}</p>
                      <p className="text-xs md:text-sm text-gray-300 mt-3">{t('round')} {round}/{MAX_ROUNDS}</p>
                    </>
                  )}
                </div>
              )}

              {gameState === GameStates.SUMMARY && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="text-center">
                    <p className="text-sm md:text-base font-medium text-gray-300">{t('bestTime')}</p>
                    <p className="text-2xl md:text-3xl font-bold text-white">{Math.min(...results)}</p>
                    <p className="text-xs text-gray-400">{t('milliseconds')}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm md:text-base font-medium text-gray-300">{t('averageTime')}</p>
                    <p className="text-xl md:text-2xl font-bold text-white">{getAverageTime(results)}</p>
                    <p className="text-xs text-gray-400">{t('milliseconds')}</p>
                  </div>

                  {/* Reflex Analysis Section */}
                  <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm mt-1">
                    <p className="text-xs text-blue-200 uppercase tracking-wider mb-1">{t('reflexAnalysis.title')}</p>
                    <p className="text-sm md:text-base font-bold text-yellow-300">
                      {t(`reflexAnalysis.${getReflexAnalysisKey(getAverageTime(results))}`)}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={(event) => {
                        stopBoardClick(event);
                        resetGame();
                      }}
                      size="sm"
                      variant="secondary"
                      className="text-xs"
                    >
                      {t('playAgain')}
                    </Button>
                    <Button
                      onClick={(event) => {
                        stopBoardClick(event);
                        shareResults();
                      }}
                      size="sm"
                      className="flex items-center justify-center gap-1 text-xs"
                    >
                      <Share size={12} />
                      {shareT('button')}
                    </Button>
                  </div>
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
