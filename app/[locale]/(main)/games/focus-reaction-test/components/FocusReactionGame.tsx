'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from "sonner";
import { RotateCcw, Play, ChevronLeft, ChevronRight, Minus, Share2 } from "lucide-react";
import { useTranslations } from 'next-intl';
import { ShareModal } from '@/components/ui/ShareModal';
import { motion } from "framer-motion";
import { 
  GameState,
  Trial,
  GameResult,
  generateTrials,
  calculateStats,
  GAME_CONFIG
} from '../config';

// Arrow component using consistent styling
const ArrowIcon = ({ direction }: { direction: 'left' | 'right' | 'neutral' }) => {
  // All arrows use same color - no highlighting for target
  const iconClass = `w-8 h-8 text-foreground`;
  
  if (direction === 'left') {
    return <ChevronLeft className={iconClass} />;
  } else if (direction === 'right') {
    return <ChevronRight className={iconClass} />;
  } else {
    return <Minus className={iconClass} />;
  }
};

export default function FocusReactionGame() {
  const t = useTranslations('games.focusReactionTest.gameUI');
  
  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState<number>(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [countdown, setCountdown] = useState<number>(GAME_CONFIG.COUNTDOWN_DURATION);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [trialStartTime, setTrialStartTime] = useState<number | null>(null);
  
  const [feedbackResult, setFeedbackResult] = useState<{ correct: boolean; visible: boolean }>({ correct: false, visible: false });
  const [isProcessingResponse, setIsProcessingResponse] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  
  // Refs
  const gameRef = useRef<HTMLDivElement>(null);
  
  // Load best score from localStorage
  useEffect(() => {
    const savedBestScore = localStorage.getItem('focusReactionBestScore');
    if (savedBestScore) {
      setBestScore(parseInt(savedBestScore));
    }
  }, []);

  // Focus the game container for keyboard input
  useEffect(() => {
    if (gameRef.current && gameState === GameState.PLAYING) {
      gameRef.current.focus();
    }
  }, [gameState]);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== GameState.PLAYING || isProcessingResponse || !trialStartTime) return;
    
    let response: 'left' | 'right' | null = null;
    
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      response = 'left';
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      response = 'right';
    }
    
    if (response) {
      e.preventDefault();
      // Direct call to avoid circular dependency
      if (!trialStartTime || !trials[currentTrialIndex] || isProcessingResponse) return;
      
      setIsProcessingResponse(true);
      
      const currentTrial = trials[currentTrialIndex];
      const responseTime = Date.now() - trialStartTime;
      const isCorrect = response === currentTrial.correctResponse;
      
      console.log('Keyboard - Trial:', currentTrial);
      console.log('Keyboard - Response:', response, 'Correct:', currentTrial.correctResponse, 'IsCorrect:', isCorrect);
      
      const result: GameResult = {
        trial: { ...currentTrial, response, responseTime, isCorrect },
        reactionTime: responseTime,
        accuracy: isCorrect
      };
      
      const newResults = [...results, result];
      setResults(newResults);
      setTrialStartTime(null);
      setFeedbackResult({ correct: isCorrect, visible: true });
      
      setTimeout(() => {
        setFeedbackResult({ correct: false, visible: false });
        setIsProcessingResponse(false);
        
        if (currentTrialIndex + 1 >= trials.length) {
          const stats = calculateStats(newResults);
          if (stats && stats.accuracy > (bestScore || 0)) {
            setBestScore(stats.accuracy);
            localStorage.setItem('focusReactionBestScore', stats.accuracy.toString());
            toast.success(t('newBestScore'));
          }
          setGameState(GameState.RESULTS);
        } else {
          setCurrentTrialIndex(prev => prev + 1);
          
          setFeedbackResult({ correct: false, visible: false });
          setTrialStartTime(Date.now());
        }
      }, GAME_CONFIG.FEEDBACK_DURATION);
    }
  }, [gameState, isProcessingResponse, trialStartTime, trials, currentTrialIndex, results, bestScore, t]);

  // Add keyboard event listener
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [gameState, handleKeyDown]);

  const startTrial = useCallback(() => {
    setFeedbackResult({ correct: false, visible: false });
    setTrialStartTime(Date.now());
  }, []);

  const handleResponse = useCallback((response: 'left' | 'right') => {
    if (!trialStartTime || !trials[currentTrialIndex] || isProcessingResponse) return;
    
    setIsProcessingResponse(true);
    
    const currentTrial = trials[currentTrialIndex];
    const responseTime = Date.now() - trialStartTime;
    const isCorrect = response === currentTrial.correctResponse;
    
    // Debug logging
    console.log('Trial:', currentTrial);
    console.log('Response:', response, 'Correct:', currentTrial.correctResponse, 'IsCorrect:', isCorrect);
    
    // Create result
    const result: GameResult = {
      trial: { ...currentTrial, response, responseTime, isCorrect },
      reactionTime: responseTime,
      accuracy: isCorrect
    };
    
    const newResults = [...results, result];
    setResults(newResults);
    
    // Clear trial state
    setTrialStartTime(null);
    
    // Show feedback
    setFeedbackResult({ correct: isCorrect, visible: true });
    
    setTimeout(() => {
      setFeedbackResult({ correct: false, visible: false });
      setIsProcessingResponse(false);
      
      if (currentTrialIndex + 1 >= trials.length) {
        // Game finished
        const stats = calculateStats(newResults);
        if (stats && stats.accuracy > (bestScore || 0)) {
          setBestScore(stats.accuracy);
          localStorage.setItem('focusReactionBestScore', stats.accuracy.toString());
          toast.success(t('newBestScore'));
        }
        setGameState(GameState.RESULTS);
      } else {
        // Next trial
        setCurrentTrialIndex(prev => prev + 1);
        startTrial();
      }
    }, GAME_CONFIG.FEEDBACK_DURATION);
  }, [trials, currentTrialIndex, results, trialStartTime, isProcessingResponse, bestScore, t, startTrial]);


  const startGame = useCallback(() => {
    const newTrials = generateTrials();
    setTrials(newTrials);
    setCurrentTrialIndex(0);
    setResults([]);
    setGameState(GameState.COUNTDOWN);
    setFeedbackResult({ correct: false, visible: false });
    
    // Countdown
    let count = GAME_CONFIG.COUNTDOWN_DURATION;
    setCountdown(count);
    
    const countdownInterval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      
      if (count <= 0) {
        clearInterval(countdownInterval);
        setGameState(GameState.PLAYING);
        startTrial();
      }
    }, 1000);
  }, [startTrial]);

  const shareScore = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const resetGame = useCallback(() => {
    setGameState(GameState.START);
    setTrials([]);
    setCurrentTrialIndex(0);
    setResults([]);
    setTrialStartTime(null);
    
    setFeedbackResult({ correct: false, visible: false });
    setIsProcessingResponse(false);
    setCountdown(GAME_CONFIG.COUNTDOWN_DURATION);
  }, []);


  const progress = trials.length > 0 ? ((currentTrialIndex + 1) / trials.length) * 100 : 0;
  const stats = calculateStats(results);
  const currentTrial = trials[currentTrialIndex];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="w-full">
        <div className="p-8">
          {/* START STATE */}
          {gameState === GameState.START && (
            <div className="text-center space-y-6">
              <div className="space-y-6">
                <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  {t('instructions')}
                </p>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-6 space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4 text-blue-700 dark:text-blue-300">{t('rulesTitle')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t('rulesDescription')}</p>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="text-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <ArrowIcon direction="right" />
                        <ArrowIcon direction="right" />
                        <ArrowIcon direction="left" />
                        <ArrowIcon direction="right" />
                        <ArrowIcon direction="right" />
                      </div>
                      <div className="text-xs text-muted-foreground">{t('exampleLeft')}</div>
                    </div>
                  </div>
                </div>
                
                {bestScore && (
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-sm text-green-700 dark:text-green-300">
                      🏆 {t('bestScore')}: <span className="font-semibold">{bestScore}%</span>
                    </div>
                  </div>
                )}
              </div>
              <Button onClick={startGame} size="lg" className="px-8">
                <Play className="w-5 h-5 mr-2" />
                {t('startGame')}
              </Button>
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
                  {t('trial')} {currentTrialIndex + 1} / {trials.length}
                </div>
                <Progress value={progress} className="w-48" />
              </div>
              
              <div className="text-center py-16 relative">
                {/* Feedback display above arrows */}
                {feedbackResult.visible && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10"
                  >
                    <div className={`text-3xl font-bold ${
                      feedbackResult.correct ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {feedbackResult.correct ? '✓' : '✗'}
                    </div>
                  </motion.div>
                )}
                
                {currentTrial ? (
                  <div className="flex items-center justify-center gap-2">
                    {currentTrial.stimuli.map((direction, index) => (
                      <ArrowIcon 
                        key={`${currentTrial.id}-${index}`}
                        direction={direction}
                      />
                    ))}
                  </div>
                ) : null}
                
                <div className="mt-8 text-sm text-muted-foreground">
                  {t('focusOnCenter')}
                </div>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => handleResponse('left')}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                  disabled={isProcessingResponse || !trialStartTime}
                >
                  <ChevronLeft className="w-5 h-5" />
                  {t('left')}
                </Button>
                <Button
                  onClick={() => handleResponse('right')}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                  disabled={isProcessingResponse || !trialStartTime}
                >
                  {t('right')}
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
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
