'use client';

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from "sonner";
import { RotateCcw, Play, ChevronLeft, ChevronRight, Minus, Share2 } from "lucide-react";
import { useTranslations } from 'next-intl';
import { ShareModal } from '@/components/ui/ShareModal';
import { motion } from "framer-motion";
import {
  GameState,
  TrialPhase,
  Trial,
  GameResult,
  Response,
  generateTrials,
  generatePracticeTrials,
  calculateStats,
  GAME_CONFIG
} from '../config';

const BEST_SCORE_KEY = 'focusReactionBestScore';

// Arrow component using consistent styling
const ArrowIcon = ({ direction }: { direction: 'left' | 'right' | 'neutral' }) => {
  // All arrows use same color - no highlighting for target
  const iconClass = 'w-12 h-12 sm:w-16 sm:h-16 text-foreground';

  if (direction === 'left') {
    return <ChevronLeft className={iconClass} strokeWidth={2.5} />;
  } else if (direction === 'right') {
    return <ChevronRight className={iconClass} strokeWidth={2.5} />;
  } else {
    return <Minus className={iconClass} strokeWidth={2.5} />;
  }
};

// Event timestamps share the performance.now() clock in modern browsers;
// fall back to the current time if a browser reports something else.
function responseTime(timeStamp: number) {
  const now = performance.now();
  return timeStamp > 0 && timeStamp <= now ? timeStamp : now;
}

interface Session {
  trials: Trial[];
  index: number;
  practice: boolean;
  results: GameResult[];
}

export default function FocusReactionGame() {
  const t = useTranslations('games.focusReactionTest.gameUI');

  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [phase, setPhase] = useState<TrialPhase>('fixation');
  const [currentTrial, setCurrentTrial] = useState<Trial | null>(null);
  const [trialNumber, setTrialNumber] = useState<number>(0);
  const [isPractice, setIsPractice] = useState<boolean>(true);
  const [results, setResults] = useState<GameResult[]>([]);
  const [countdown, setCountdown] = useState<number>(GAME_CONFIG.COUNTDOWN_DURATION);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; timedOut: boolean } | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Refs: timers read these, so they never see stale state
  const sessionRef = useRef<Session>({ trials: [], index: 0, practice: true, results: [] });
  const stimulusOnsetRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    timeoutRef.current = null;
    countdownRef.current = null;
    stimulusOnsetRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // Load best score from localStorage
  useEffect(() => {
    try {
      const savedBestScore = localStorage.getItem(BEST_SCORE_KEY);
      if (savedBestScore) {
        setBestScore(parseInt(savedBestScore));
      }
    } catch {
      // Storage unavailable (private mode, blocked cookies)
    }
  }, []);

  // Focus the game container for keyboard input
  useEffect(() => {
    if (gameRef.current && gameState === GameState.PLAYING) {
      gameRef.current.focus();
    }
  }, [gameState]);

  const finishSession = useCallback(() => {
    const session = sessionRef.current;
    if (session.practice) {
      setGameState(GameState.PRACTICE_DONE);
      return;
    }

    const finalResults = [...session.results];
    setResults(finalResults);
    const stats = calculateStats(finalResults);
    if (stats && stats.accuracy > (bestScore || 0)) {
      setBestScore(stats.accuracy);
      try {
        localStorage.setItem(BEST_SCORE_KEY, stats.accuracy.toString());
      } catch {
        // Storage unavailable; keep the score for this visit only
      }
      toast.success(t('newBestScore'));
    }
    setGameState(GameState.RESULTS);
  }, [bestScore, t]);

  const runTrial = useCallback((index: number) => {
    const session = sessionRef.current;
    session.index = index;
    stimulusOnsetRef.current = null;
    setCurrentTrial(session.trials[index]);
    setTrialNumber(index + 1);
    setFeedback(null);
    setPhase('fixation');
    timeoutRef.current = setTimeout(() => setPhase('stimulus'), GAME_CONFIG.FIXATION_DURATION);
  }, []);

  // Ends the current trial with a response, or with null when time runs out
  const finishTrial = useCallback((response: Response | null, time: number) => {
    const onset = stimulusOnsetRef.current;
    if (onset === null) return;
    stimulusOnsetRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const session = sessionRef.current;
    const trial = session.trials[session.index];
    const isCorrect = response === trial.correctResponse;

    if (!session.practice) {
      session.results.push({
        trial,
        response,
        reactionTime: response ? Math.max(0, Math.round(time - onset)) : GAME_CONFIG.TRIAL_DURATION,
        accuracy: isCorrect
      });
    }

    setFeedback({ correct: isCorrect, timedOut: response === null });
    setPhase('feedback');

    timeoutRef.current = setTimeout(() => {
      if (session.index + 1 < session.trials.length) {
        runTrial(session.index + 1);
      } else {
        finishSession();
      }
    }, GAME_CONFIG.FEEDBACK_DURATION);
  }, [runTrial, finishSession]);

  // Start timing on the frame that shows the arrows, then arm the time limit
  useLayoutEffect(() => {
    if (gameState !== GameState.PLAYING || phase !== 'stimulus') return;
    const frame = requestAnimationFrame(() => {
      stimulusOnsetRef.current = performance.now();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => finishTrial(null, performance.now()), GAME_CONFIG.TRIAL_DURATION);
    });
    return () => cancelAnimationFrame(frame);
  }, [gameState, phase, currentTrial, finishTrial]);

  // Handle keyboard input
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let response: Response | null = null;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        response = 'left';
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        response = 'right';
      }
      if (!response) return;
      e.preventDefault();
      if (e.repeat) return;
      finishTrial(response, responseTime(e.timeStamp));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, finishTrial]);

  const startBlock = useCallback((practice: boolean) => {
    clearTimers();
    sessionRef.current = {
      trials: practice ? generatePracticeTrials() : generateTrials(),
      index: 0,
      practice,
      results: []
    };
    setIsPractice(practice);
    setResults([]);
    setCurrentTrial(null);
    setFeedback(null);
    setGameState(GameState.COUNTDOWN);

    // Countdown
    let count = GAME_CONFIG.COUNTDOWN_DURATION;
    setCountdown(count);

    countdownRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);

      if (count <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = null;
        setGameState(GameState.PLAYING);
        runTrial(0);
      }
    }, 1000);
  }, [clearTimers, runTrial]);

  const shareScore = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const resetGame = useCallback(() => {
    clearTimers();
    setGameState(GameState.START);
    setCurrentTrial(null);
    setResults([]);
    setFeedback(null);
    setCountdown(GAME_CONFIG.COUNTDOWN_DURATION);
  }, [clearTimers]);

  const totalTrials = sessionRef.current.trials.length;
  const progress = totalTrials > 0 ? (trialNumber / totalTrials) * 100 : 0;
  const stats = calculateStats(results);
  const canRespond = phase === 'stimulus';

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="w-full">
        <div className="p-8">
          {/* START STATE */}
          {gameState === GameState.START && (
            <div className="flex flex-col items-center gap-8 py-6 text-center">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-1">
                  <ArrowIcon direction="right" />
                  <ArrowIcon direction="right" />
                  <ArrowIcon direction="left" />
                  <ArrowIcon direction="right" />
                  <ArrowIcon direction="right" />
                </div>
                <p className="text-sm text-muted-foreground">{t('exampleLeft')}</p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <Button onClick={() => startBlock(true)} size="lg" className="px-8">
                  <Play className="w-5 h-5 mr-2" />
                  {t('startGame')}
                </Button>
                {bestScore && (
                  <p className="text-sm text-muted-foreground">
                    {t('bestScore')}: <span className="font-semibold text-foreground">{bestScore}%</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* COUNTDOWN STATE */}
          {gameState === GameState.COUNTDOWN && (
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold">{t('getReady')}</h2>
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-8xl font-bold text-primary"
              >
                {countdown}
              </motion.div>
            </div>
          )}

          {/* PLAYING STATE */}
          {gameState === GameState.PLAYING && (
            <div className="space-y-6 outline-none" ref={gameRef} tabIndex={0}>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {isPractice ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      {t('practiceLabel')} {trialNumber} / {totalTrials}
                    </span>
                  ) : (
                    <>{t('trial')} {trialNumber} / {totalTrials}</>
                  )}
                </div>
                <Progress value={progress} className="w-48" />
              </div>

              <div className="text-center py-16 relative">
                {/* Feedback display above arrows */}
                {phase === 'feedback' && feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10"
                  >
                    <div className={`text-3xl font-bold ${
                      feedback.correct ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {feedback.timedOut ? (
                        <span className="text-xl">{t('tooSlow')}</span>
                      ) : feedback.correct ? '✓' : '✗'}
                    </div>
                  </motion.div>
                )}

                <div className="flex h-16 sm:h-20 items-center justify-center">
                  {phase === 'fixation' ? (
                    <span className="text-5xl font-light text-muted-foreground" aria-hidden="true">+</span>
                  ) : currentTrial ? (
                    <div className="flex items-center justify-center gap-0 sm:gap-1">
                      {currentTrial.stimuli.map((direction, index) => (
                        <ArrowIcon
                          key={`${currentTrial.id}-${index}`}
                          direction={direction}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-8 text-sm text-muted-foreground">
                  {t('focusOnCenter')}
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  onPointerDown={(e) => finishTrial('left', responseTime(e.timeStamp))}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2 touch-manipulation"
                  disabled={!canRespond}
                >
                  <ChevronLeft className="w-5 h-5" />
                  {t('left')}
                </Button>
                <Button
                  onPointerDown={(e) => finishTrial('right', responseTime(e.timeStamp))}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2 touch-manipulation"
                  disabled={!canRespond}
                >
                  {t('right')}
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* PRACTICE DONE STATE */}
          {gameState === GameState.PRACTICE_DONE && (
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold">{t('practiceDoneTitle')}</h2>
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {t('practiceDoneDescription')}
              </p>
              <Button onClick={() => startBlock(false)} size="lg" className="px-8">
                <Play className="w-5 h-5 mr-2" />
                {t('startTest')}
              </Button>
            </div>
          )}

          {/* RESULTS STATE */}
          {gameState === GameState.RESULTS && stats && (
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                  <div className="text-2xl">🎯</div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('gameComplete')}</h2>
                <p className="text-gray-600 dark:text-gray-400">{t('resultsSubtitle')}</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-blue-600 dark:text-blue-400">
                      <div className="text-2xl mb-1">🎯</div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                      stats.accuracy >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      stats.accuracy >= 75 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {stats.accuracy >= 90 ? t('ratingExcellent') : stats.accuracy >= 75 ? t('ratingGood') : t('ratingImprove')}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">{stats.accuracy}%</div>
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">{t('accuracy')}</div>
                  <div className="text-xs text-blue-600/80 dark:text-blue-400/80">
                    {stats.accuracy >= 90 ? t('accuracyHigh') :
                     stats.accuracy >= 75 ? t('accuracyGood') : t('accuracyImprove')}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30 rounded-xl p-6 border border-purple-200/50 dark:border-purple-800/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-purple-600 dark:text-purple-400">
                      <div className="text-2xl mb-1">⚡</div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                      stats.avgReactionTime <= 400 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      stats.avgReactionTime <= 600 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {stats.avgReactionTime <= 400 ? t('speedFast') : stats.avgReactionTime <= 600 ? t('speedAverage') : t('speedSlow')}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-purple-700 dark:text-purple-300 mb-2">{stats.avgReactionTime}ms</div>
                  <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">{t('avgReactionTime')}</div>
                  <div className="text-xs text-purple-600/80 dark:text-purple-400/80">
                    {stats.avgReactionTime <= 400 ? t('speedHigh') :
                     stats.avgReactionTime <= 600 ? t('speedNormal') : t('speedImprove')}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/30 rounded-xl p-6 border border-emerald-200/50 dark:border-emerald-800/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-emerald-600 dark:text-emerald-400">
                      <div className="text-2xl mb-1">🛡️</div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                      stats.flankerEffect <= 30 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      stats.flankerEffect <= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {stats.flankerEffect <= 30 ? t('ratingExcellent') : stats.flankerEffect <= 60 ? t('ratingGood') : t('ratingImprove')}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">{stats.flankerEffect}ms</div>
                  <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">{t('flankerEffect')}</div>
                  <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                    {stats.flankerEffect <= 30 ? t('interferenceLow') :
                     stats.flankerEffect <= 60 ? t('interferenceModerate') : t('interferenceHigh')}
                  </div>
                </div>
              </div>

              {/* Congruent vs incongruent breakdown */}
              <div className="rounded-xl border border-border p-5">
                <h3 className="mb-4 text-sm font-semibold text-muted-foreground">{t('breakdownTitle')}</h3>
                <div className="space-y-3">
                  {[
                    { label: t('congruentLabel'), example: '→ → → → →', rt: stats.avgCongruentRT, accuracy: stats.congruentAccuracy },
                    { label: t('incongruentLabel'), example: '← ← → ← ←', rt: stats.avgIncongruentRT, accuracy: stats.incongruentAccuracy },
                  ].map((row) => (
                    <div key={row.label} className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{row.label}</span>
                        <span className="font-mono text-sm text-muted-foreground">{row.example}</span>
                      </div>
                      <span className="text-sm tabular-nums">
                        {t('breakdownValue', { rt: row.rt, accuracy: row.accuracy })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Button
                  onClick={shareScore}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {t('share')}
                </Button>
                <Button
                  onClick={resetGame}
                  size="lg"
                  className="flex items-center gap-3 px-6 py-3"
                >
                  <RotateCcw className="w-5 h-5" />
                  {t('playAgain')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={t('title')}
        shareText={stats ? t('shareText', {
          accuracy: stats.accuracy,
          avgRT: stats.avgReactionTime,
          flankerEffect: stats.flankerEffect,
        }) : ''}
      />
    </div>
  );
}
