'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from "sonner";
import { Share, RotateCcw, Play } from "lucide-react";
import { useTranslations } from 'next-intl';
import { ProgressShareModal } from '@/components/ui/ProgressShareModal';
import { motion, AnimatePresence } from "framer-motion";
import { submitScoreToLeaderboard } from '@/lib/leaderboard';
import {
  getProgressInsights,
  ProgressCardData,
  recordProgressSnapshot,
} from '@/lib/progress-share';
import {
  COLORS,
  GAME_CONFIG,
  GameState,
  StroopTrial,
  GameResult,
  generateTrial
} from '../config';

const LEADERBOARD_MISTAKE_PENALTY_MS = 250;

export default function StroopGame() {
  const t = useTranslations('games.stroopEffectTest.gameUI');
  const pageT = useTranslations('games.stroopEffectTest');
  const commonT = useTranslations('common.leaderboard');
  const shareT = useTranslations('common.progressShare');

  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [currentTrial, setCurrentTrial] = useState<StroopTrial | null>(null);
  const [trialStartTime, setTrialStartTime] = useState<number | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [results, setResults] = useState<GameResult[]>([]);
  const [countdown, setCountdown] = useState<number>(3);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [totalElapsedMs, setTotalElapsedMs] = useState<number | null>(null);
  const [progressCard, setProgressCard] = useState<ProgressCardData | null>(null);

  // Refs
  const gameRef = useRef<HTMLDivElement>(null);
  const hasSubmittedLeaderboardRef = useRef(false);
  const hasRecordedProgressRef = useRef(false);
  const sessionStartedAtRef = useRef<number | null>(null);

  const formatDuration = useCallback((ms: number) => {
    const absoluteMs = Math.abs(ms);
    const prefix = ms < 0 ? '-' : '';
    return `${prefix}${(absoluteMs / 1000).toFixed(3)} ${commonT('unitSec')}`;
  }, [commonT]);

  // Load best time from localStorage and set page URL
  useEffect(() => {
    const savedBestTime = localStorage.getItem('stroopBestTime');
    if (savedBestTime) {
      setBestTime(parseInt(savedBestTime));
    }
  }, []);

  // Calculate statistics
  const getStats = useCallback(() => {
    if (results.length === 0) return null;

    const correctResults = results.filter(r => r.isCorrect);
    const accuracy = (correctResults.length / results.length) * 100;
    const avgReactionTime = correctResults.length > 0
      ? correctResults.reduce((sum, r) => sum + r.reactionTime, 0) / correctResults.length
      : 0;
    const congruentResults = correctResults.filter(r => r.trial.isCongruent);
    const incongruentResults = correctResults.filter(r => !r.trial.isCongruent);
    const mistakeCount = results.length - correctResults.length;

    return {
      accuracy: Math.round(accuracy),
      avgReactionTime: Math.round(avgReactionTime),
      congruentAvg: congruentResults.length > 0 ? Math.round(congruentResults.reduce((sum, r) => sum + r.reactionTime, 0) / congruentResults.length) : 0,
      incongruentAvg: incongruentResults.length > 0 ? Math.round(incongruentResults.reduce((sum, r) => sum + r.reactionTime, 0) / incongruentResults.length) : 0,
      mistakeCount,
      adjustedScore: Math.round(avgReactionTime + (mistakeCount * LEADERBOARD_MISTAKE_PENALTY_MS)),
      stroopEffect: incongruentResults.length > 0 && congruentResults.length > 0 ?
        Math.round((incongruentResults.reduce((sum, r) => sum + r.reactionTime, 0) / incongruentResults.length) -
          (congruentResults.reduce((sum, r) => sum + r.reactionTime, 0) / congruentResults.length)) : 0
    };
  }, [results]);

  const startRound = useCallback((roundNumber: number) => {
    if (roundNumber > GAME_CONFIG.rounds) {
      if (sessionStartedAtRef.current !== null) {
        setTotalElapsedMs(Date.now() - sessionStartedAtRef.current);
      }
      setCurrentRound(roundNumber);
      setGameState(GameState.SUMMARY);
      return;
    }

    if (roundNumber === 1 && sessionStartedAtRef.current === null) {
      sessionStartedAtRef.current = Date.now();
    }

    const isCongruent = Math.random() < GAME_CONFIG.difficulties.medium.congruentRatio;
    const trial = generateTrial(COLORS, isCongruent);

    setCurrentRound(roundNumber);
    setCurrentTrial(trial);
    setGameState(GameState.PLAYING);
    setTrialStartTime(Date.now());
  }, []);

  // Start game
  const startGame = useCallback(() => {
    setGameState(GameState.COUNTDOWN);
    setCurrentRound(1);
    setResults([]);
    setCountdown(3);
    setTotalElapsedMs(null);
    setProgressCard(null);
    hasSubmittedLeaderboardRef.current = false;
    hasRecordedProgressRef.current = false;
    sessionStartedAtRef.current = null;

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startRound(1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [startRound]);

  // Handle color selection
  const handleColorSelect = useCallback((colorName: string) => {
    if (gameState !== GameState.PLAYING || !currentTrial || !trialStartTime) return;

    const reactionTime = Date.now() - trialStartTime;
    const isCorrect = colorName === currentTrial.correctAnswer;

    const result: GameResult = {
      trial: currentTrial,
      userAnswer: colorName,
      reactionTime,
      isCorrect
    };

    setResults(prev => [...prev, result]);

    // Show result briefly
    setGameState(GameState.RESULT);

    // Update best time if this is a new best
    if (isCorrect && (bestTime === null || reactionTime < bestTime)) {
      setBestTime(reactionTime);
      localStorage.setItem('stroopBestTime', reactionTime.toString());
      toast(`${t('newBestTime')}: ${formatDuration(reactionTime)}`);
    }

    // Move to next round after brief delay
    setTimeout(() => {
      startRound(currentRound + 1);
    }, 1000);
  }, [gameState, currentRound, currentTrial, trialStartTime, bestTime, t, startRound, formatDuration]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING) return;

      const color = COLORS.find(c => c.keyCode === event.code);
      if (color) {
        handleColorSelect(color.name);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, handleColorSelect]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState(GameState.START);
    setCurrentTrial(null);
    setCurrentRound(1);
    setResults([]);
    setCountdown(3);
    setTotalElapsedMs(null);
    setProgressCard(null);
    hasRecordedProgressRef.current = false;
    sessionStartedAtRef.current = null;
  }, []);

  // Share results
  const shareResults = useCallback(() => {
    if (progressCard) {
      setIsShareModalOpen(true);
    }
  }, [progressCard]);

  const stats = getStats();
  const progress = ((currentRound - 1) / GAME_CONFIG.rounds) * 100;

  useEffect(() => {
    if (gameState !== GameState.SUMMARY || !stats || hasSubmittedLeaderboardRef.current) {
      return;
    }

    hasSubmittedLeaderboardRef.current = true;
    void submitScoreToLeaderboard('stroop-effect-test', stats.adjustedScore);
  }, [gameState, stats]);

  useEffect(() => {
    if (gameState !== GameState.SUMMARY || !stats || hasRecordedProgressRef.current) {
      return;
    }

    hasRecordedProgressRef.current = true;
    const history = recordProgressSnapshot('stroop-effect-test', stats.avgReactionTime);
    const insights = getProgressInsights(history, 'lower');
    const deltaText = insights.previous && insights.deltaFromPrevious !== null
      ? (
        insights.isImprovement
          ? shareT('fasterThanLast', { value: formatDuration(Math.round(insights.deltaFromPrevious)) })
          : shareT('slowerThanLast', { value: formatDuration(Math.round(insights.deltaFromPrevious)) })
      )
      : shareT('firstTrackedSession');

    setProgressCard({
      title: pageT('title'),
      subtitle: t('gameComplete'),
      primaryLabel: t('avgReactionTime'),
      primaryValue: formatDuration(stats.avgReactionTime),
      trendText: deltaText,
      historyLabel: shareT('sessionsTracked', { count: insights.sessions }),
      history: history.map((entry) => entry.primaryValue),
      direction: 'lower',
      metrics: [
        { label: t('accuracy'), value: `${stats.accuracy}%` },
        { label: t('stroopEffect'), value: formatDuration(stats.stroopEffect) },
        { label: shareT('sessionTime'), value: formatDuration(totalElapsedMs ?? results.reduce((sum, result) => sum + result.reactionTime, 0)) },
      ],
      footer: shareT('sessionsTracked', { count: insights.sessions }),
      theme: {
        backgroundFrom: '#3d1f68',
        backgroundTo: '#120d2e',
        accent: '#ffb24b',
        panel: 'rgba(18, 10, 40, 0.78)',
        text: '#fff9f0',
        mutedText: 'rgba(255, 238, 214, 0.72)',
      },
    });
  }, [formatDuration, gameState, pageT, results, shareT, stats, t, totalElapsedMs]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-4" ref={gameRef}>
      <AnimatePresence mode="wait">
        {gameState === GameState.START && (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{t('title')}</h2>
              <p className="text-muted-foreground max-w-md">
                {t('instructions')}
              </p>
            </div>
            <Button onClick={startGame} size="lg" className="px-8">
              <Play className="w-5 h-5 mr-2" />
              {t('startGame')}
            </Button>
            {bestTime && (
              <p className="text-sm text-muted-foreground">
                {t('bestTime')}: {formatDuration(bestTime)}
              </p>
            )}
          </motion.div>
        )}

        {gameState === GameState.COUNTDOWN && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center"
          >
            <div className="text-6xl font-bold text-primary mb-4">
              {countdown}
            </div>
            <p className="text-muted-foreground">{t('getReady')}</p>
          </motion.div>
        )}

        {gameState === GameState.PLAYING && currentTrial && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-6 w-full max-w-2xl"
          >
            <div className="mb-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                {t('round')} {currentRound} / {GAME_CONFIG.rounds}
              </p>
            </div>

            <Card className="p-8 bg-white border-2">
              <CardContent className="p-0">
                <div className="mb-8">
                  <p className="text-lg mb-4">{t('identifyColor')}</p>
                  <div
                    className="text-6xl font-bold uppercase tracking-wider"
                    style={{ color: currentTrial.color }}
                  >
                    {t(`colors.${currentTrial.word}`)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {COLORS.map((color) => (
                    <Button
                      key={color.name}
                      onClick={() => handleColorSelect(color.name)}
                      variant="outline"
                      className="h-16 font-semibold text-lg transition-all hover:scale-105 hover:bg-muted"
                    >
                      {color.key}. {t(`colors.${color.name}`)}
                    </Button>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground mt-4">
                  {t('keyboardShortcut')}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {gameState === GameState.RESULT && results.length > 0 && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center space-y-4"
          >
            <div className={`text-4xl font-bold ${results[results.length - 1].isCorrect ? 'text-green-500' : 'text-red-500'}`}>
              {results[results.length - 1].isCorrect ? '✓' : '✗'}
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold">
                {results[results.length - 1].isCorrect ? t('correct') : t('incorrect')}
              </p>
              <p className="text-muted-foreground">
                {t('reactionTime')}: {formatDuration(results[results.length - 1].reactionTime)}
              </p>
            </div>
          </motion.div>
        )}

        {gameState === GameState.SUMMARY && stats && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6 w-full max-w-md"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{t('gameComplete')}</h2>
              <p className="text-muted-foreground">{t('yourResults')}</p>
            </div>

            <Card className="p-6">
              <CardContent className="p-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.accuracy}%</div>
                    <div className="text-sm text-muted-foreground">{t('accuracy')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{formatDuration(stats.avgReactionTime)}</div>
                    <div className="text-sm text-muted-foreground">{t('avgReactionTime')}</div>
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="text-sm text-muted-foreground">{t('totalTime')}</div>
                  <div className="mt-1 text-2xl font-bold text-foreground">
                    {formatDuration(totalElapsedMs ?? results.reduce((sum, result) => sum + result.reactionTime, 0))}
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="text-sm text-muted-foreground">{t('leaderboardTime')}</div>
                  <div className="mt-1 text-2xl font-bold text-primary">{formatDuration(stats.adjustedScore)}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('leaderboardTimeDescription', {
                      penalty: formatDuration(LEADERBOARD_MISTAKE_PENALTY_MS),
                    })}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-500">{formatDuration(stats.stroopEffect)}</div>
                    <div className="text-sm text-muted-foreground">{t('stroopEffect')}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('stroopEffectDescription')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{formatDuration(stats.congruentAvg)}</div>
                    <div className="text-muted-foreground">{t('congruent')}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{formatDuration(stats.incongruentAvg)}</div>
                    <div className="text-muted-foreground">{t('incongruent')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-center">
              <Button onClick={shareResults} variant="outline" className="flex-1">
                <Share className="w-4 h-4 mr-2" />
                {shareT('button')}
              </Button>
              <Button onClick={resetGame} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('playAgain')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProgressShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        card={progressCard}
        fileName="stroop-progress.png"
      />
    </div>
  );
}
