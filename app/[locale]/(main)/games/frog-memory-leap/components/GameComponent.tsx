'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { LilyPadSVG } from './LilyPadSVG';
import { FrogSVG } from './FrogSVG';
import { Button } from '@/components/ui/button';
import {
    GamePhase,
    PadPosition,
    getLevelParams,
    pickPadPositions,
    generateJumpSequence,
    calculateScore,
} from '../hooks/useFrogEngine';

const BEST_SCORE_KEY = 'frogMemoryBestScore';

export default function GameComponent() {
    const t = useTranslations('games.frogMemoryLeap.gameUI');
    const containerRef = useRef<HTMLDivElement>(null);

    // Game state
    const [phase, setPhase] = useState<GamePhase>('idle');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [message, setMessage] = useState('');
    const [roundPoints, setRoundPoints] = useState<number | null>(null);

    // Level data
    const [activePads, setActivePads] = useState<PadPosition[]>([]);
    const [jumpSeq, setJumpSeq] = useState<number[]>([]);

    // Demo playback
    const [demoIndex, setDemoIndex] = useState(-1); // which jump is being shown
    const [highlightedPadId, setHighlightedPadId] = useState<number | null>(null);

    // Player input
    const [playerIndex, setPlayerIndex] = useState(0);
    const [correctPads, setCorrectPads] = useState<Set<number>>(new Set());
    const [wrongPadId, setWrongPadId] = useState<number | null>(null);
    const [startTime, setStartTime] = useState(0);

    // Frog position (pad ID)
    const [frogPadId, setFrogPadId] = useState<number | null>(null);
    const [isJumping, setIsJumping] = useState(false);
    const [frogRotation, setFrogRotation] = useState(0); // degrees, 0 = sprite default
    const prevPadIdRef = useRef<number | null>(null);

    // Progress
    const [progressTotal, setProgressTotal] = useState(0);
    const [progressStart, setProgressStart] = useState(0);
    const [progressElapsed, setProgressElapsed] = useState(0);

    // Load best score
    useEffect(() => {
        const saved = localStorage.getItem(BEST_SCORE_KEY);
        if (saved) setBestScore(parseInt(saved, 10) || 0);
    }, []);

    // Progress bar tick
    useEffect(() => {
        if (progressTotal <= 0) return;
        let id: number;
        const tick = () => {
            const elapsed = Date.now() - progressStart;
            setProgressElapsed(Math.min(elapsed, progressTotal));
            if (elapsed < progressTotal) id = requestAnimationFrame(tick);
        };
        id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, [progressTotal, progressStart]);

    /**
     * Calculate rotation angle from one pad to another.
     * The sprite faces "down" by default, so 0° = down.
     * We calculate the angle so the frog's head points toward the target.
     */
    const calcRotation = useCallback((fromId: number, toId: number, pads: PadPosition[]) => {
        const from = pads.find(p => p.id === fromId);
        const to = pads.find(p => p.id === toId);
        if (!from || !to) return 0;
        const dx = to.px - from.px;
        const dy = to.py - from.py;
        // Calculate angle CW from north using screen coordinates (Y-down).
        // atan2(dx, -dy) gives CW angle from north:
        //   up=0°, right=90°, down=180°, left=-90°
        const rad = Math.atan2(dx, -dy);
        const targetAngle = (rad * 180) / Math.PI;
        // Sprite default heading ≈ 205° CW from north (≈ -155°),
        // i.e. head points bottom-left, slightly biased toward straight-down.
        const SPRITE_ANGLE = -155;
        let rotation = targetAngle - SPRITE_ANGLE;
        // Normalize to [-180, 180] for shortest rotation path
        rotation = ((rotation + 540) % 360) - 180;
        return rotation;
    }, []);

    /** Trigger a jump: set rotation, then simultaneously start position + sprite animation */
    const triggerJump = useCallback((targetPadId: number, pads: PadPosition[], duration = 900) => {
        const fromId = prevPadIdRef.current;
        if (fromId !== null && fromId !== targetPadId) {
            setFrogRotation(calcRotation(fromId, targetPadId, pads));
        }
        setFrogPadId(targetPadId);
        setIsJumping(true);
        prevPadIdRef.current = targetPadId;
        setTimeout(() => setIsJumping(false), duration);
    }, [calcRotation]);

    // ── Start a new round ──
    const startRound = useCallback((lvl: number) => {
        const params = getLevelParams(lvl);
        const pads = pickPadPositions(params.padCount);
        const seq = generateJumpSequence(pads, params.jumpCount);

        setActivePads(pads);
        setJumpSeq(seq);
        setFrogPadId(seq[0]);
        prevPadIdRef.current = seq[0];
        setDemoIndex(-1);
        setHighlightedPadId(null);
        setPlayerIndex(0);
        setCorrectPads(new Set());
        setWrongPadId(null);
        setRoundPoints(null);
        setIsJumping(false);
        setPhase('watching');
        setMessage(t('level', { level: lvl.toString() }));

        // Total demo time for progress bar
        const totalDemoTime = params.jumpCount * params.jumpDelay + 1500;
        setProgressTotal(totalDemoTime);
        setProgressStart(Date.now());
        setProgressElapsed(0);

        // After a brief pause, start demo
        setTimeout(() => {
            setMessage(t('watch'));
            playDemo(seq, params.jumpDelay, pads);
        }, 1500);
    }, [t]);

    // ── Play demo sequence ──
    const playDemo = (seq: number[], delay: number, pads: PadPosition[]) => {
        // Start from i=1 since frog is already placed at seq[0]
        let i = 1;
        // Highlight the starting pad briefly
        setHighlightedPadId(seq[0]);
        setTimeout(() => setHighlightedPadId(null), delay * 0.5);

        const step = () => {
            if (i < seq.length) {
                // Jump to the next pad — rotation + sprite + position all together
                triggerJump(seq[i], pads, Math.min(delay * 0.85, 900));
                setHighlightedPadId(seq[i]);

                // Clear highlight after a beat
                setTimeout(() => setHighlightedPadId(null), delay * 0.6);

                i++;
                setTimeout(step, delay);
            } else {
                // Demo done → player turn
                setTimeout(() => {
                    setPhase('playing');
                    setMessage(t('repeat'));
                    setFrogPadId(seq[0]); // reset frog to start
                    prevPadIdRef.current = seq[0];
                    setPlayerIndex(1); // player needs to click from index 1
                    setStartTime(Date.now());
                    setProgressTotal(0);
                }, 500);
            }
        };
        setTimeout(step, delay);
    };

    // ── Handle player click on pad ──
    const handlePadClick = (padId: number) => {
        if (phase !== 'playing') return;

        const expected = jumpSeq[playerIndex];

        if (padId === expected) {
            // Correct! Jump to the pad with rotation + sprite animation
            triggerJump(padId, activePads, 900);
            setCorrectPads(prev => new Set(prev).add(padId));

            const nextIdx = playerIndex + 1;
            setPlayerIndex(nextIdx);

            if (nextIdx >= jumpSeq.length) {
                // Round complete!
                handleSuccess();
            }
        } else {
            // Wrong!
            setWrongPadId(padId);
            handleFailure();
        }
    };

    // ── Success ──
    const handleSuccess = () => {
        setPhase('success');
        const elapsed = Date.now() - startTime;
        const points = calculateScore(level, elapsed);
        setRoundPoints(points);

        const newScore = score + points;
        setScore(newScore);

        if (newScore > bestScore) {
            setBestScore(newScore);
            localStorage.setItem(BEST_SCORE_KEY, String(newScore));
        }

        setMessage(t('correct'));

        // Auto advance after pause
        setTimeout(() => {
            const nextLevel = level + 1;
            setLevel(nextLevel);
            startRound(nextLevel);
        }, 2200);
    };

    // ── Failure ──
    const handleFailure = () => {
        setPhase('fail');
        setMessage(t('gameOver'));
    };

    // ── Restart ──
    const restartGame = () => {
        setLevel(1);
        setScore(0);
        startRound(1);
    };

    // ── Retry same level ──
    const retryLevel = () => {
        startRound(level);
    };

    // Get frog pixel position from pad ID
    const getFrogPosition = () => {
        if (frogPadId === null) return null;
        return activePads.find(p => p.id === frogPadId) || null;
    };

    const frogPos = getFrogPosition();
    const progressPct = progressTotal > 0 ? Math.max(0, 1 - progressElapsed / progressTotal) : 0;
    const params = getLevelParams(level);

    return (
        <div className="w-full h-full flex flex-col font-mono bg-white dark:bg-zinc-950 rounded-xl overflow-hidden">

            {/* Top HUD */}
            <div className="flex justify-between items-center px-6 py-3 bg-transparent shrink-0 z-20">
                <div className="flex items-center gap-3">
                    {phase !== 'idle' && (
                        <span className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {t('level', { level: level.toString() })}
                        </span>
                    )}
                    <div className="font-bold text-lg tracking-wide text-zinc-800 dark:text-zinc-200">
                        {phase === 'idle' ? t('start') : message}
                    </div>
                </div>
                <div className="flex gap-3 items-center">
                    {phase !== 'idle' && (
                        <div className="flex gap-3 text-sm font-bold tracking-wider">
                            <span className="text-zinc-600 dark:text-zinc-400">
                                {t('score', { score: score.toString() })}
                            </span>
                            {bestScore > 0 && (
                                <span className="text-zinc-400 dark:text-zinc-600">
                                    {t('highScore', { score: bestScore.toString() })}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Play Area */}
            <div
                ref={containerRef}
                className="relative flex-1 w-full min-h-0 overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: "url('/games/assets/frog/bg_pond.png')" }}
            >
                {/* Score popup */}
                <AnimatePresence>
                    {roundPoints !== null && roundPoints > 0 && (
                        <motion.div
                            key={`score-pop-${Date.now()}`}
                            initial={{ opacity: 1, y: 0, scale: 1 }}
                            animate={{ opacity: 0, y: -60, scale: 1.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="absolute top-1/3 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
                        >
                            <span className="text-4xl font-black text-green-400 drop-shadow-lg">
                                +{roundPoints}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Level announce */}
                <AnimatePresence>
                    {phase === 'watching' && demoIndex === -1 && (
                        <motion.div
                            key={`level-ann-${level}`}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.4 }}
                            transition={{ duration: 0.8 }}
                            className="absolute top-1/4 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
                        >
                            <span className="text-3xl font-black tracking-widest uppercase text-white/80 drop-shadow-xl">
                                {t('level', { level: level.toString() })}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Lily pads */}
                {activePads.map(pad => (
                    <div
                        key={pad.id}
                        className="absolute z-10"
                        style={{
                            left: `${pad.px}%`,
                            top: `${pad.py}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <LilyPadSVG
                            size={75}
                            isActive={frogPadId === pad.id}
                            isHighlighted={highlightedPadId === pad.id}
                            isCorrect={correctPads.has(pad.id)}
                            isWrong={wrongPadId === pad.id}
                            onClick={() => handlePadClick(pad.id)}
                        />
                    </div>
                ))}

                {/* Frog */}
                {frogPos && (
                    <motion.div
                        className="absolute z-20 pointer-events-none"
                        animate={{
                            left: `${frogPos.px}%`,
                            top: `${frogPos.py}%`,
                        }}
                        transition={{ type: 'spring', stiffness: 80, damping: 16, mass: 1 }}
                        style={{
                            transform: 'translate(-50%, -65%)',
                        }}
                    >
                        <FrogSVG size={50} isJumping={isJumping} rotation={frogRotation} />
                    </motion.div>
                )}

                {/* Idle decorative frogs */}
                {phase === 'idle' && (
                    <div className="absolute inset-0 z-5 pointer-events-none flex items-center justify-center">
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <FrogSVG size={80} />
                        </motion.div>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {progressTotal > 0 && (
                <div className="w-full h-0.5 bg-zinc-200 dark:bg-zinc-800 shrink-0 overflow-hidden">
                    <motion.div
                        className="h-full rounded-r-full bg-cyan-400"
                        style={{ width: `${progressPct * 100}%` }}
                        transition={{ duration: 0.05 }}
                    />
                </div>
            )}

            {/* Bottom Controls */}
            <div className="h-24 shrink-0 flex items-center justify-center bg-transparent relative z-20">
                <AnimatePresence mode="popLayout">
                    {phase === 'idle' && (
                        <motion.div
                            key="start-btn"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.04, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Button
                                    size="lg"
                                    onClick={() => startRound(1)}
                                    className="w-56 h-14 text-2xl font-bold uppercase tracking-widest rounded-xl shadow-md"
                                >
                                    {t('start')}
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}

                    {phase === 'watching' && (
                        <motion.div
                            key="watching-hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-wider"
                        >
                            🐸 {params.jumpCount} {t('watch')}
                        </motion.div>
                    )}

                    {phase === 'playing' && (
                        <motion.div
                            key="playing-hint"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-wider"
                        >
                            {playerIndex - 1}/{jumpSeq.length - 1}
                        </motion.div>
                    )}

                    {phase === 'fail' && (
                        <motion.div
                            key="fail-btns"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3"
                        >
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={retryLevel}
                                className="font-bold py-5 px-8 text-lg uppercase tracking-widest rounded-xl"
                            >
                                {t('tryAgain')}
                            </Button>
                            <Button
                                size="lg"
                                onClick={restartGame}
                                className="font-bold py-5 px-8 text-lg uppercase tracking-widest rounded-xl shadow-md"
                            >
                                {t('start')}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}