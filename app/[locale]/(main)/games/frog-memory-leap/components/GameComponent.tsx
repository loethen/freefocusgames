'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { FrogPondScene, padRadiusFor } from './scene/engine';
import { PAD_TILT } from './scene/pond';
import { Button } from '@/components/ui/button';
import { Brain, CircleX, Eye, MousePointerClick, PartyPopper, Settings, Share } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { submitScoreToLeaderboard } from '@/lib/leaderboard';
import { ProgressShareModal } from '@/components/ui/ProgressShareModal';
import { getProgressInsights, recordProgressSnapshot, type ProgressCardData } from '@/lib/progress-share';
import {
    GamePhase,
    PadPosition,
    getLevelParams,
    pickPadPositions,
    generateJumpSequence,
    calculateScore,
    jumpDuration,
} from '../hooks/useFrogEngine';

interface GameSettings {
    startLevel: number;
}

const DEFAULT_SETTINGS: GameSettings = {
    startLevel: 1,
};

const BEST_SCORE_KEY = 'frogMemoryBestScore';
const SETTINGS_KEY = 'frogMemorySettings';

export default function GameComponent() {
    const t = useTranslations('games.frogMemoryLeap.gameUI');
    const pageT = useTranslations('games.frogMemoryLeap');
    const shareT = useTranslations('common.progressShare');
    const locale = useLocale();
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<FrogPondScene | null>(null);

    // Settings
    const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Game state
    const [phase, setPhase] = useState<GamePhase>('idle');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [message, setMessage] = useState('');
    const [roundPoints, setRoundPoints] = useState<number | null>(null);
    const [popKey, setPopKey] = useState(0);
    const [showLevelBanner, setShowLevelBanner] = useState(false);
    const [showTurnBanner, setShowTurnBanner] = useState(false);
    // Longest route the player has repeated correctly this run, for the share card
    const [longestRoute, setLongestRoute] = useState(0);
    const [progressCard, setProgressCard] = useState<ProgressCardData | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    // How many demo hops have played so far, for the progress dots
    const [demoStep, setDemoStep] = useState(0);

    // Level data
    const [activePads, setActivePads] = useState<PadPosition[]>([]);
    const [jumpSeq, setJumpSeq] = useState<number[]>([]);

    // Player input
    const [playerIndex, setPlayerIndex] = useState(0);
    const [startTime, setStartTime] = useState(0);

    // Progress
    const [progressTotal, setProgressTotal] = useState(0);
    const [progressStart, setProgressStart] = useState(0);
    const [progressElapsed, setProgressElapsed] = useState(0);

    // Load best score & settings
    useEffect(() => {
        const saved = localStorage.getItem(BEST_SCORE_KEY);
        if (saved) setBestScore(parseInt(saved, 10) || 0);

        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings(parsed);
                setLevel(parsed.startLevel || 1);
            } catch { /* ignore */ }
        }
    }, []);

    useEffect(() => {
        if (phase === 'fail') {
            submitScoreToLeaderboard("frog-memory-leap", score);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const saveSettings = (newSettings: GameSettings) => {
        setSettings(newSettings);
        setLevel(newSettings.startLevel);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
        setIsSettingsOpen(false);
    };

    // Canvas scene; on the start screen the frog hops about a few pads by itself
    const [padRadius, setPadRadius] = useState(40);

    useEffect(() => {
        const canvas = canvasRef.current;
        const el = containerRef.current;
        if (!canvas || !el) return;
        const scene = new FrogPondScene(canvas);
        sceneRef.current = scene;
        const idlePads = pickPadPositions(5);
        scene.setPads(idlePads);
        scene.placeFrog(idlePads[0].id);
        scene.setAmbientHops(true);
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            scene.resize(width, height);
            setPadRadius(padRadiusFor(width, height));
        });
        ro.observe(el);
        return () => {
            ro.disconnect();
            scene.destroy();
            sceneRef.current = null;
        };
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

    // Pending timers for the demo and round transitions, cleared on restart and unmount.
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const later = (fn: () => void, ms: number) => {
        timersRef.current.push(setTimeout(fn, ms));
    };
    const clearTimers = () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    };
    useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

    const padById = (pads: PadPosition[], id: number) => pads.find(p => p.id === id)!;

    // ── Start a new round ──
    const startRound = (lvl: number) => {
        clearTimers();
        const params = getLevelParams(lvl);
        const pads = pickPadPositions(params.padCount);
        const seq = generateJumpSequence(pads, params.jumpCount);

        setActivePads(pads);
        setJumpSeq(seq);
        setPlayerIndex(0);
        setDemoStep(0);
        setRoundPoints(null);
        setPhase('watching');
        setShowLevelBanner(true);
        setShowTurnBanner(false);
        setMessage(t('getReady'));

        const scene = sceneRef.current;
        scene?.setAmbientHops(false);
        scene?.setPads(pads);
        scene?.placeFrog(seq[0], true);

        // Per-jump durations based on distance
        const durations = seq.slice(1).map((id, i) => jumpDuration(padById(pads, seq[i]), padById(pads, id)));
        const INTRO = 1500;
        const START_CUE = 500;
        const PAUSE_BETWEEN = 200;
        const OUTRO = 300;
        const totalDemoTime = INTRO + START_CUE + durations.reduce((sum, d) => sum + d + PAUSE_BETWEEN, 0) + OUTRO;
        setProgressTotal(totalDemoTime);
        setProgressStart(Date.now());
        setProgressElapsed(0);

        later(() => {
            setShowLevelBanner(false);
            setMessage(t('watchStatus'));
            sceneRef.current?.cue(seq[0]);
        }, INTRO);

        let at = INTRO + START_CUE;
        durations.forEach((dur, i) => {
            later(() => {
                sceneRef.current?.hopTo(seq[i + 1], dur, true);
                setDemoStep(i + 1);
            }, at);
            at += dur + PAUSE_BETWEEN;
        });

        // Demo done → player turn, with the frog back on the start pad
        later(() => {
            setPhase('playing');
            setMessage(t('yourTurn'));
            setShowTurnBanner(true);
            sceneRef.current?.placeFrog(seq[0], true);
            sceneRef.current?.cue(seq[0]);
            setPlayerIndex(1);
            setStartTime(Date.now());
            setProgressTotal(0);
            later(() => setShowTurnBanner(false), 1100);
        }, at + OUTRO);
    };

    // ── Handle player click on pad ──
    const handlePadClick = (padId: number) => {
        if (phase !== 'playing') return;

        const expected = jumpSeq[playerIndex];

        setShowTurnBanner(false);
        if (padId === expected) {
            // Correct! Jump to the pad with distance-based duration
            const from = padById(activePads, jumpSeq[playerIndex - 1]);
            sceneRef.current?.hopTo(padId, jumpDuration(from, padById(activePads, padId)));

            const nextIdx = playerIndex + 1;
            setPlayerIndex(nextIdx);

            if (nextIdx >= jumpSeq.length) {
                // Round complete!
                handleSuccess();
            }
        } else {
            // Wrong!
            sceneRef.current?.markWrong(padId);
            sceneRef.current?.showHint(expected);
            handleFailure();
        }
    };

    // ── Success ──
    const handleSuccess = () => {
        setPhase('success');
        const elapsed = Date.now() - startTime;
        const points = calculateScore(level, elapsed);
        setRoundPoints(points);
        setPopKey(k => k + 1);

        const newScore = score + points;
        setScore(newScore);
        setLongestRoute(r => Math.max(r, jumpSeq.length - 1));

        if (newScore > bestScore) {
            setBestScore(newScore);
            localStorage.setItem(BEST_SCORE_KEY, String(newScore));
        }

        setMessage(t('levelUp', { count: getLevelParams(level + 1).jumpCount.toString() }));

        // Auto advance after pause
        later(() => {
            const nextLevel = level + 1;
            setLevel(nextLevel);
            startRound(nextLevel);
        }, 2200);
    };

    // ── Failure ──
    const handleFailure = () => {
        setPhase('fail');
        setMessage(t('wrongTitle'));
        buildShareCard();
    };

    // ── Share card: the run's score, tracked across sessions ──
    const buildShareCard = () => {
        const history = recordProgressSnapshot('frog-memory-leap', score);
        const insights = getProgressInsights(history, 'higher');
        const trendText = insights.previous && insights.deltaFromPrevious !== null
            ? (insights.isImprovement
                ? shareT('higherThanLast', { value: Math.round(insights.deltaFromPrevious) })
                : shareT('lowerThanLast', { value: Math.round(insights.deltaFromPrevious) }))
            : shareT('firstTrackedSession');

        setProgressCard({
            title: pageT('title'),
            subtitle: '',
            primaryLabel: t('shareScoreLabel'),
            primaryValue: score.toString(),
            trendText,
            historyLabel: shareT('sessionsTracked', { count: insights.sessions }),
            history: history.map(entry => entry.primaryValue),
            direction: 'higher',
            metrics: [
                { label: t('shareLevelLabel'), value: level.toString(), highlight: true },
                { label: t('shareRouteLabel'), value: t('shareRouteValue', { count: longestRoute.toString() }) },
                { label: t('shareBestLabel'), value: Math.max(bestScore, score).toString() },
            ],
            footer: t('shareChallenge'),
            siteUrl: `freefocusgames.com${locale === 'en' ? '' : `/${locale}`}/games/frog-memory-leap`,
            coverImage: '/games/frog-memory-leap-cover.png',
            description: pageT('description'),
            // A light card in the cover's palette: pond aqua, lily-pad green and the slate ink of the scene.
            theme: {
                backgroundFrom: '#bfeef3',
                backgroundTo: '#a6d78f',
                accent: '#2f8f5b',
                panel: '#ffffff',
                text: '#3c4656',
                mutedText: 'rgba(60, 70, 86, 0.62)',
                surface: '#eef7ea',
                border: 'rgba(60, 70, 86, 0.12)',
                glow: '#ffffff',
            },
        });
    };

    // ── Restart ──
    const restartGame = () => {
        setLevel(1);
        setScore(0);
        setLongestRoute(0);
        startRound(1);
    };

    // ── Retry same level ──
    const retryLevel = () => {
        startRound(level);
    };

    // Pads in reading order, so the screen-reader labels run top-left to bottom-right
    const padsInOrder = [...activePads].sort((a, b) => a.py - b.py || a.px - b.px);
    const progressPct = progressTotal > 0 ? Math.max(0, 1 - progressElapsed / progressTotal) : 0;
    const totalJumps = Math.max(0, jumpSeq.length - 1);
    const doneJumps =
        phase === 'watching' ? demoStep :
        phase === 'success' ? totalJumps :
        Math.max(0, playerIndex - 1);

    // Status line at the top: an icon and a colour per phase, so it is clear whose turn it is
    const status = {
        idle: { icon: Brain, text: t('idleStatus'), tone: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200' },
        watching: { icon: Eye, text: message, tone: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
        playing: { icon: MousePointerClick, text: message, tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
        success: { icon: PartyPopper, text: message, tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
        fail: { icon: CircleX, text: message, tone: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' },
    }[phase];
    const StatusIcon = status.icon;

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-950 rounded-xl overflow-hidden">

            {/* Top HUD */}
            <div className="flex items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-3 shrink-0 z-20">
                <div className={`flex items-center gap-1.5 md:gap-2 min-w-0 px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold ${status.tone}`}>
                    <StatusIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate" aria-live="polite">{status.text}</span>
                </div>
                <div className="ml-auto flex items-center gap-2 md:gap-3 shrink-0 text-xs md:text-sm font-semibold">
                    {phase !== 'idle' && (
                        <>
                            <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                                {t('level', { level: level.toString() })}
                            </span>
                            <span className="text-zinc-700 dark:text-zinc-200">{t('score', { score: score.toString() })}</span>
                        </>
                    )}
                    {bestScore > 0 && (
                        <span className="hidden md:inline text-zinc-400 dark:text-zinc-500">
                            {t('highScore', { score: bestScore.toString() })}
                        </span>
                    )}
                    {phase === 'idle' && (
                        <GameSettingsDialog
                            settings={settings}
                            onSave={saveSettings}
                            isOpen={isSettingsOpen}
                            onOpenChange={setIsSettingsOpen}
                            t={t}
                        />
                    )}
                </div>
            </div>

            {/* Play Area */}
            <div ref={containerRef} className="relative flex-1 w-full min-h-0 overflow-hidden bg-[#d6eef0]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" role="img" aria-label={t('sceneLabel')} />

                {/* Invisible buttons over the pads take the taps and keyboard focus */}
                {padsInOrder.map((pad, i) => (
                    <button
                        key={pad.id}
                        type="button"
                        aria-label={t('padLabel', { n: (i + 1).toString() })}
                        disabled={phase !== 'playing'}
                        onClick={() => handlePadClick(pad.id)}
                        className="absolute z-10 rounded-full cursor-pointer disabled:cursor-default outline-none focus-visible:ring-2 focus-visible:ring-slate-500/60 touch-manipulation"
                        style={{
                            left: `${pad.px}%`,
                            top: `${pad.py}%`,
                            width: padRadius * 2,
                            height: padRadius * 2 * PAD_TILT,
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                ))}

                {/* How to play, over the pond on the start screen */}
                <AnimatePresence>
                    {phase === 'idle' && (
                        <motion.div
                            key="how-to"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="absolute inset-0 z-30 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="w-full max-w-xs rounded-2xl border-2 border-slate-600/70 bg-white/95 px-5 py-4 text-slate-700 shadow-[5px_5px_0_rgba(60,70,86,0.18)]">
                                <h3 className="text-base md:text-lg font-bold text-slate-800 mb-3">{t('howTitle')}</h3>
                                <ol className="space-y-2.5 text-sm md:text-[15px] leading-snug">
                                    {[
                                        { icon: Eye, text: t('howStep1'), tone: 'bg-amber-100 text-amber-700' },
                                        { icon: Brain, text: t('howStep2'), tone: 'bg-violet-100 text-violet-700' },
                                        { icon: MousePointerClick, text: t('howStep3'), tone: 'bg-emerald-100 text-emerald-700' },
                                    ].map(({ icon: Icon, text, tone }, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${tone}`}>
                                                <Icon className="w-4 h-4" aria-hidden="true" />
                                            </span>
                                            <span className="pt-1">{text}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Score popup */}
                <AnimatePresence>
                    {roundPoints !== null && roundPoints > 0 && (
                        <motion.div
                            key={`score-pop-${popKey}`}
                            initial={{ opacity: 1, y: 0, scale: 1 }}
                            animate={{ opacity: 0, y: -60, scale: 1.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="absolute top-1/3 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
                        >
                            <span className="text-4xl font-black text-emerald-600 drop-shadow-[0_2px_0_rgba(255,255,255,0.9)]">
                                +{roundPoints}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Level and turn announcements */}
                <AnimatePresence>
                    {(showLevelBanner || showTurnBanner) && (
                        <motion.div
                            key={showLevelBanner ? `level-ann-${level}` : 'turn-ann'}
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.2 }}
                            transition={{ duration: 0.4 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none"
                        >
                            <span className={`block whitespace-nowrap rounded-2xl border-2 border-slate-600/70 px-5 py-2 text-2xl md:text-3xl font-black shadow-[4px_4px_0_rgba(60,70,86,0.18)] ${showLevelBanner ? 'bg-white/95 text-slate-700' : 'bg-emerald-50/95 text-emerald-700'}`}>
                                {showLevelBanner ? t('level', { level: level.toString() }) : t('yourTurnBanner')}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Demo progress bar */}
            {progressTotal > 0 && (
                <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 shrink-0 overflow-hidden">
                    <div
                        className="h-full rounded-r-full bg-amber-300"
                        style={{ width: `${progressPct * 100}%` }}
                    />
                </div>
            )}

            {/* Bottom Controls */}
            <div className="h-28 shrink-0 flex flex-col items-center justify-center gap-2 px-3 relative z-20">
                {phase === 'idle' && (
                    <motion.div
                        animate={{ scale: [1, 1.04, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Button
                            size="lg"
                            onClick={() => startRound(settings.startLevel)}
                            className="h-14 px-10 text-xl font-bold rounded-full shadow-md"
                        >
                            {t('start')}
                        </Button>
                    </motion.div>
                )}

                {(phase === 'watching' || phase === 'playing' || phase === 'success') && totalJumps > 0 && (
                    <>
                        <JumpDots
                            total={totalJumps}
                            done={doneJumps}
                            tone={phase === 'watching' ? 'watch' : 'play'}
                        />
                        <p className="text-xs md:text-sm text-center text-zinc-500 dark:text-zinc-400">
                            {phase === 'watching'
                                ? t('jumpsToWatch', { count: totalJumps.toString() })
                                : phase === 'playing' && doneJumps === 0
                                    ? t('startHint')
                                    : t('jumpProgress', { done: doneJumps.toString(), total: totalJumps.toString() })}
                        </p>
                    </>
                )}

                {phase === 'fail' && (
                    <motion.div
                        key="fail"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-2"
                    >
                        <p className="text-xs md:text-sm text-center text-zinc-500 dark:text-zinc-400">
                            {t('wrongHint', { level: level.toString() })}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                            <Button variant="outline" onClick={() => setIsShareModalOpen(true)} disabled={!progressCard} className="font-bold px-4 md:px-5 rounded-full">
                                <Share className="w-4 h-4 mr-1.5" aria-hidden="true" />
                                {t('share')}
                            </Button>
                            <Button variant="outline" onClick={retryLevel} className="font-bold px-4 md:px-5 rounded-full">
                                {t('tryAgain')}
                            </Button>
                            <Button onClick={restartGame} className="font-bold px-4 md:px-5 rounded-full shadow-md">
                                {t('restart')}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>

            <ProgressShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                card={progressCard}
                fileName="frog-memory-leap-score.png"
            />
        </div>
    );
}

// One dot per jump in the route: filled as the demo plays or as the player repeats it.
function JumpDots({ total, done, tone }: { total: number; done: number; tone: 'watch' | 'play' }) {
    const filled = tone === 'watch' ? 'bg-amber-300 border-amber-500' : 'bg-emerald-300 border-emerald-500';
    return (
        <div className="flex flex-wrap justify-center gap-1.5" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
                <span
                    key={i}
                    className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border-2 transition-colors duration-300 ${i < done ? filled : 'bg-white border-slate-300 dark:bg-zinc-900 dark:border-zinc-600'}`}
                />
            ))}
        </div>
    );
}

function GameSettingsDialog({
    settings,
    onSave,
    isOpen,
    onOpenChange,
    t
}: {
    settings: GameSettings;
    onSave: (settings: GameSettings) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    t: ReturnType<typeof useTranslations>;
}) {
    const [tempSettings, setTempSettings] = useState(settings);

    useEffect(() => {
        setTempSettings(settings);
    }, [settings, isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="w-10 h-10 shadow-sm rounded-full">
                    <Settings className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm font-mono rounded-xl">
                <DialogHeader>
                    <DialogTitle className="uppercase font-bold tracking-widest">{t('settings')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="startLevel" className="uppercase font-bold tracking-wider text-sm">{t('startLevel')}</Label>
                        <Input
                            id="startLevel"
                            type="number"
                            min="1"
                            max="20"
                            value={tempSettings.startLevel}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setTempSettings({
                                    ...tempSettings,
                                    startLevel: Math.min(20, Math.max(1, val))
                                });
                            }}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="uppercase font-bold text-sm tracking-wider">
                        {t('cancel')}
                    </Button>
                    <Button onClick={() => onSave(tempSettings)} className="uppercase font-bold text-sm tracking-wider">
                        {t('save')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}