'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, RotateCcw, Share2 } from "lucide-react";
import { ProgressShareModal } from '@/components/ui/ProgressShareModal';
import { toast } from "sonner"; // Assuming sonner is used for toasts
import { SevenSegmentDigit, SevenSegmentDot } from './SevenSegmentDisplay';
import { submitScoreToLeaderboard } from '@/lib/leaderboard';
import {
    getProgressInsights,
    type ProgressCardData,
    recordProgressSnapshot,
} from '@/lib/progress-share';

type GameState = 'IDLE' | 'RUNNING' | 'STOPPED';
type RankKey = 'perfect' | 'excellent' | 'great' | 'good' | 'normal';

const TARGET_SECONDS = 10;
const PROGRESS_STORAGE_KEY = 'challenge-10-seconds-error';

const formatSeconds = (seconds: number) => `${seconds.toFixed(4)}s`;
const formatSignedError = (seconds: number) => `${seconds > 0 ? '+' : ''}${seconds.toFixed(4)}s`;

const getRankKey = (difference: number): RankKey => {
    if (difference < 0.00005) return 'perfect';
    if (difference < 0.01) return 'excellent';
    if (difference < 0.05) return 'great';
    if (difference < 0.1) return 'good';
    return 'normal';
};

export default function Challenge10Seconds() {
    const locale = useLocale();
    const t = useTranslations('games.challenge10Seconds');
    const tRank = useTranslations('games.challenge10Seconds.gameUI.rank');

    const [gameState, setGameState] = useState<GameState>('IDLE');
    const [time, setTime] = useState(0);
    const [diff, setDiff] = useState(0);
    const [rank, setRank] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [progressCard, setProgressCard] = useState<ProgressCardData | null>(null);

    const startTimeRef = useRef<number>(0);
    const requestRef = useRef<number>(0);
    const hasSubmittedLeaderboardRef = useRef(false);
    const hasRecordedProgressRef = useRef(false);

    useEffect(() => {
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    // Add keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent scrolling
                if (gameState === 'RUNNING') {
                    stopGame();
                } else {
                    startGame();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState]); // Re-bind when main state changes to capture latest closure

    const updateTimer = () => {
        const now = performance.now();
        const elapsed = (now - startTimeRef.current) / 1000;
        setTime(elapsed);
        requestRef.current = requestAnimationFrame(updateTimer);
    };

    const startGame = () => {
        setGameState('RUNNING');
        setDiff(0);
        setRank('');
        setProgressCard(null);
        setIsShareModalOpen(false);
        hasSubmittedLeaderboardRef.current = false;
        hasRecordedProgressRef.current = false;
        startTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(updateTimer);
    };

    const stopGame = () => {
        cancelAnimationFrame(requestRef.current);
        const now = performance.now();
        const finalTime = (now - startTimeRef.current) / 1000;
        const displayedTime = Number(finalTime.toFixed(4));
        setTime(displayedTime);
        setGameState('STOPPED');

        const difference = Math.abs(displayedTime - TARGET_SECONDS);
        setDiff(difference);

        const rankKey = getRankKey(difference);
        setRank(rankKey);

        if (!hasSubmittedLeaderboardRef.current) {
            hasSubmittedLeaderboardRef.current = true;
            void submitScoreToLeaderboard('challenge10Seconds', displayedTime * 1000);
        }

        if (!hasRecordedProgressRef.current) {
            hasRecordedProgressRef.current = true;
            const errorMs = difference * 1000;
            const history = recordProgressSnapshot(PROGRESS_STORAGE_KEY, errorMs);
            const insights = getProgressInsights(history, 'lower');

            setProgressCard({
                variant: 'score',
                title: t('gameUI.cardTitle'),
                subtitle: t('gameUI.cardSubtitle'),
                primaryLabel: t('gameUI.stopTime'),
                primaryValue: formatSeconds(displayedTime),
                trendText: t('gameUI.cardTaunt', { value: formatSignedError(difference) }),
                historyLabel: t('gameUI.cardRule'),
                history: history.map((entry) => entry.primaryValue),
                direction: 'lower',
                metrics: [
                    { label: t('gameUI.precisionError'), value: formatSignedError(difference) },
                    { label: t('gameUI.targetTime'), value: formatSeconds(TARGET_SECONDS) },
                    { label: t('gameUI.rankLabel'), value: tRank(rankKey) },
                ],
                footer: t('gameUI.cardFooter', { count: insights.sessions }),
                siteUrl: locale === 'en'
                    ? 'freefocusgames.com/games/challenge-10-seconds'
                    : `freefocusgames.com/${locale}/games/challenge-10-seconds`,
                theme: {
                    backgroundFrom: '#faf6ef',
                    backgroundTo: '#e7edf3',
                    accent: '#ff7a59',
                    panel: 'rgba(255, 255, 255, 0.76)',
                    text: '#1f2937',
                    mutedText: 'rgba(71, 85, 105, 0.76)',
                },
            });
        }

        // Optional: show toast for good results
        if (difference < 0.05) {
            toast.success(`${t('gameUI.result')}: ${displayedTime.toFixed(4)}s!`);
        }
    };

    const resetGame = () => {
        setGameState('IDLE');
        setTime(0);
        setDiff(0);
        setRank('');
        setProgressCard(null);
        setIsShareModalOpen(false);
        hasSubmittedLeaderboardRef.current = false;
        hasRecordedProgressRef.current = false;
    };

    const formatTime = (seconds: number) => {
        const fixed = seconds.toFixed(4);
        const [int, dec] = fixed.split('.');
        const paddedInt = int.padStart(2, '0');
        return `${paddedInt}.${dec}`;
    };

    const getRankColor = (rankKey: string) => {
        switch (rankKey) {
            case 'perfect': return 'text-purple-500 font-extrabold';
            case 'excellent': return 'text-green-500 font-bold';
            case 'great': return 'text-blue-500 font-bold';
            case 'good': return 'text-yellow-500 font-semibold';
            default: return 'text-gray-500';
        }
    };

    // Determine feedback text key based on diff
    const getFeedbackKey = (d: number) => {
        if (d === 0) return 'howToPlay.win';
        if (d < 0.1) return 'howToPlay.nearMiss';
        return 'howToPlay.lose';
    };

    return (
        <>
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 p-4">

            {/* Timer Display */}
            <div className="w-full h-64 md:h-80 bg-red-600 rounded-3xl shadow-2xl flex flex-col items-center justify-center relative overflow-hidden ring-8 ring-red-700 p-6">
                <div className="inline-flex bg-black rounded-lg border-4 border-gray-800 items-center justify-center gap-1 sm:gap-2 relative shadow-inner px-4 py-4">
                    {formatTime(time).split('').map((char, index) => {
                        const color = gameState === 'STOPPED'
                            ? (diff < 0.01 ? '#22c55e' : (diff < 0.1 ? '#eab308' : '#dc2626'))
                            : '#dc2626';

                        if (char === '.') {
                            return <SevenSegmentDot key={index} className="w-[12px] sm:w-[24px] h-[40px] sm:h-[80px]" color={color} />;
                        }
                        return (
                            <SevenSegmentDigit
                                key={index}
                                value={char}
                                className="w-[24px] h-[44px] sm:w-[60px] sm:h-[100px]"
                                color={color}
                            />
                        );
                    })}
                </div>
                <div className="text-red-200 text-sm mt-4 font-mono uppercase tracking-widest font-bold">10.0000 Seconds Challenge</div>

                {gameState === 'STOPPED' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-8 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm"
                    >
                        <span className="text-gray-300 mr-2">{t('gameUI.diff')}:</span>
                        <span className="font-mono text-white flex items-center gap-1">
                            {diff > 0 ? '+' : ''}{diff.toFixed(4)}s
                            {diff < 0.01 && <Trophy className="w-4 h-4 text-yellow-400 inline ml-1" />}
                        </span>
                    </motion.div>
                )}
            </div>

            {/* Controls */}
            <div className="flex gap-4">
                {gameState === 'IDLE' && (
                    <Button onClick={startGame} size="lg" className="w-48 h-16 text-xl">
                        {t('gameUI.start')}
                    </Button>
                )}

                {gameState === 'RUNNING' && (
                    <Button onClick={stopGame} size="lg" variant="destructive" className="w-64 h-24 text-3xl animate-pulse">
                        {t('gameUI.stop')}
                    </Button>
                )}

                {gameState === 'STOPPED' && (
                    <div className="flex gap-4">
                        <Button onClick={resetGame} size="lg" className="w-40 h-14 text-lg gap-2">
                            <RotateCcw className="w-5 h-5" />
                            {t('gameUI.retry')}
                        </Button>
                        <Button
                            onClick={() => setIsShareModalOpen(true)}
                            variant="outline"
                            size="lg"
                            className="w-40 h-14 text-lg gap-2"
                            disabled={!progressCard}
                        >
                            <Share2 className="w-5 h-5" />
                            {t('gameUI.shareCard')}
                        </Button>
                    </div>
                )}
            </div>

            {/* Result / Rank Display */}
            <AnimatePresence>
                {gameState === 'STOPPED' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-2 p-6 bg-secondary/30 rounded-xl"
                    >
                        <h3 className={`text-2xl ${getRankColor(rank)}`}>
                            {tRank(rank)}
                        </h3>
                        <p className="text-lg text-muted-foreground">
                            {t(getFeedbackKey(diff))}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>

            <ProgressShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                card={progressCard}
                fileName="10-second-challenge-card.png"
            />
        </>
    );
}
