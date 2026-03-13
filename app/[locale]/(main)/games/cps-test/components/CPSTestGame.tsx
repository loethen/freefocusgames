'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share, MousePointer2 } from "lucide-react";
import { useTranslations } from 'next-intl';
import { ShareModal } from '@/components/ui/ShareModal';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { submitScoreToLeaderboard } from '@/lib/leaderboard';

type GameState = 'IDLE' | 'READY' | 'RUNNING' | 'FINISHED';
type TimeMode = '1s' | '3s' | '5s' | '10s';


export default function CPSTestGame() {
    const t = useTranslations('games.cpsTest.gameUI');
    const tModes = useTranslations('games.cpsTest.howToPlay.modes');
    const tRank = useTranslations('games.cpsTest.gameUI.rank');
    const tStats = useTranslations('games.cpsTest.statistics');

    // State
    const [gameState, setGameState] = useState<GameState>('IDLE');
    const [mode, setMode] = useState<TimeMode>('5s');
    const [startTime, setStartTime] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<number>(5);
    const [clicks, setClicks] = useState<number>(0);
    const [ripples, setRipples] = useState<{ id: number, x: number, y: number }[]>([]);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [pageUrl, setPageUrl] = useState('');

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const clickAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setPageUrl(window.location.href);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (gameState === 'FINISHED') {
            if (mode === '5s') {
                submitScoreToLeaderboard(
                    "cps-test",
                    parseFloat((clicks / getDuration(mode)).toFixed(2)),
                    { mode: '5s' }
                );
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState]);

    const getDuration = (m: TimeMode) => parseInt(m.replace('s', ''));

    const handleModeChange = (newMode: TimeMode) => {
        setMode(newMode);
        setGameState('READY');
        setClicks(0);
        setTimeLeft(getDuration(newMode));
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const endGame = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setGameState('FINISHED');
    }, []);

    const startGame = () => {
        setGameState('RUNNING');
        setStartTime(Date.now());
        const duration = getDuration(mode);
        setClicks(1); // Count first click

        timerRef.current = setInterval(() => {
            setStartTime(prevStart => {
                const now = Date.now();
                const elapsed = (now - prevStart) / 1000;
                const remaining = Math.max(0, duration - elapsed);

                setTimeLeft(remaining);

                if (remaining <= 0) {
                    endGame();
                    return prevStart;
                }

                // Record stat for chart
                // We can't access current clicks easily in interval without ref or functional update
                // Simplified: stats are added on click or we use a separate effect.
                // Let's just track elapsed time for now.
                return prevStart;
            });
        }, 100);
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        // Determine coordinates
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        // Add ripple
        const rect = clickAreaRef.current?.getBoundingClientRect();
        if (rect) {
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            const id = Date.now();
            setRipples(prev => [...prev, { id, x, y }]);
            setTimeout(() => {
                setRipples(prev => prev.filter(r => r.id !== id));
            }, 600);
        }

        if (gameState === 'FINISHED') return;

        if (gameState === 'IDLE' || gameState === 'READY') {
            startGame();
        } else if (gameState === 'RUNNING') {
            setClicks(prev => {
                const newClicks = prev + 1;
                // Update history rarely to avoid chart lag, or use Time as X axis
                const now = Date.now();
                const elapsed = (now - startTime) / 1000;
                if (elapsed > 0) {
                    // We could record data points here
                }
                return newClicks;
            });
        }
    };


    const getRank = (cps: number) => {
        if (cps < 5) return { key: 'turtle', color: 'text-green-400' };
        if (cps < 7) return { key: 'rabbit', color: 'text-blue-400' };
        if (cps < 9) return { key: 'cheetah', color: 'text-yellow-400' };
        if (cps < 12) return { key: 'eagle', color: 'text-purple-400' };
        return { key: 'godlike', color: 'text-red-500' };
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8">
            {/* Mode Selection */}
            <div className="flex flex-wrap gap-2 justify-center">
                {(['1s', '3s', '5s', '10s'] as TimeMode[]).map((m) => (
                    <Button
                        key={m}
                        variant={mode === m ? "default" : "outline"}
                        onClick={() => handleModeChange(m)}
                        disabled={gameState === 'RUNNING'}
                        className="w-16"
                    >
                        {m}
                    </Button>
                ))}
            </div>

            {/* Main Game Area */}
            <div
                ref={clickAreaRef}
                className={`
          w-full h-64 md:h-96 rounded-2xl shadow-2xl relative overflow-hidden cursor-pointer select-none
          transition-colors duration-200 touch-manipulation
          ${gameState === 'RUNNING' ? 'bg-blue-600 active:bg-blue-700' : 'bg-gray-800 hover:bg-gray-700'}
        `}
                onMouseDown={handleClick}
                onTouchStart={handleClick}
            >
                {/* Ripples */}
                <AnimatePresence>
                    {ripples.map(ripple => (
                        <motion.span
                            key={ripple.id}
                            initial={{ scale: 0, opacity: 0.5 }}
                            animate={{ scale: 4, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            style={{
                                left: ripple.x,
                                top: ripple.y,
                                position: 'absolute',
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                transform: 'translate(-50%, -50%)',
                                pointerEvents: 'none'
                            }}
                        />
                    ))}
                </AnimatePresence>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
                    {gameState === 'IDLE' || gameState === 'READY' ? (
                        <div className="text-center">
                            <MousePointer2 className="w-12 h-12 mx-auto mb-4 animate-bounce" />
                            <h2 className="text-3xl font-bold mb-2">{t('clickToStart')}</h2>
                            <p className="text-gray-300">{tModes(mode)}</p>
                        </div>
                    ) : gameState === 'RUNNING' ? (
                        <div className="text-center">
                            <div className="text-6xl font-mono font-bold tabular-nums">
                                {timeLeft.toFixed(2)}
                            </div>
                            <p className="text-xl mt-2 text-blue-200">{t('clicks')}: {clicks}</p>
                            <p className="text-lg text-blue-300 opacity-80">CPS: {(clicks / (getDuration(mode) - timeLeft)).toFixed(1)}</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <h2 className="text-4xl font-bold mb-2">{t('resultTitle')}</h2>
                            <p className="text-gray-300 mb-4">{t('clickToStart')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Section */}
            {gameState === 'FINISHED' && (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('score')}</p>
                                <p className="text-5xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                                    {(clicks / getDuration(mode)).toFixed(2)}
                                </p>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('clicks')}</p>
                                <p className="text-4xl font-bold text-gray-800 dark:text-white mt-2">{clicks}</p>
                                <p className="text-sm text-gray-500 mt-1">{t('time')}: {mode}</p>
                            </div>

                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">{tRank('title')}</p>
                                <p className={`text-2xl font-bold mt-2 ${getRank(clicks / getDuration(mode)).color}`}>
                                    {tRank(getRank(clicks / getDuration(mode)).key)}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4 mt-8">
                            <Button onClick={() => handleModeChange(mode)} size="lg">
                                {t('playAgain')}
                            </Button>
                            <Button onClick={() => setIsShareModalOpen(true)} variant="outline" size="lg" className="gap-2">
                                <Share className="w-4 h-4" />
                                {t('share')}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}

            {/* Social Proof / Stats */}
            <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 opacity-60">
                <div className="text-center p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tStats('worldRecord')}</p>
                    <p className="font-bold">14.1 CPS</p>
                </div>
                <div className="text-center p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tStats('average')}</p>
                    <p className="font-bold">6.5 CPS</p>
                </div>
                <div className="text-center p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tStats('proGamer')}</p>
                    <p className="font-bold">10+ CPS</p>
                </div>
                <div className="text-center p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tStats('modes')}</p>
                    <p className="font-bold">{tStats('types')}</p>
                </div>
            </div>

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                title={t('score')}
                url={pageUrl}
            />
        </div>
    );
}
