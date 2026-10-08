'use client';

import { gameTabClass, gameTabsClass } from '@/lib/game-tab-styles'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, RotateCcw, TimerReset } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { submitScoreToLeaderboard } from '@/lib/leaderboard';

type GameState = 'IDLE' | 'RUNNING' | 'FINISHED';
type TimeMode = '5s' | '10s' | '30s';

const DURATIONS: Record<TimeMode, number> = {
    '5s': 5,
    '10s': 10,
    '30s': 30,
};

const STORAGE_KEY = 'spacebar-clicker-best-scores';

function readBestScores(): Partial<Record<TimeMode, number>> {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {};
        }
        return JSON.parse(raw) as Partial<Record<TimeMode, number>>;
    } catch {
        return {};
    }
}

function writeBestScores(scores: Partial<Record<TimeMode, number>>) {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

export default function SpacebarClickerGame() {
    const t = useTranslations('games.spacebarClicker.gameUI');
    const tModes = useTranslations('games.spacebarClicker.howToPlay.modes');

    const [mode, setMode] = useState<TimeMode>('10s');
    const [gameState, setGameState] = useState<GameState>('IDLE');
    const [timeLeft, setTimeLeft] = useState(DURATIONS['10s']);
    const [presses, setPresses] = useState(0);
    const [bestScores, setBestScores] = useState<Partial<Record<TimeMode, number>>>({});
    const [isPressed, setIsPressed] = useState(false);

    const rafRef = useRef<number | null>(null);
    const releaseTimeoutRef = useRef<number | null>(null);
    const deadlineRef = useRef(0);
    const gameStateRef = useRef<GameState>('IDLE');
    const modeRef = useRef<TimeMode>('10s');
    const pressAreaRef = useRef<HTMLButtonElement>(null);

    const duration = DURATIONS[mode];
    const elapsed = duration - timeLeft;
    const currentRate = elapsed > 0 ? presses / elapsed : 0;
    const finalRate = presses / duration;
    const bestForMode = bestScores[mode];

    useEffect(() => {
        setBestScores(readBestScores());
    }, []);

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    useEffect(() => {
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
            if (releaseTimeoutRef.current !== null) {
                window.clearTimeout(releaseTimeoutRef.current);
            }
        };
    }, []);

    const stopPressAnimation = useCallback(() => {
        if (releaseTimeoutRef.current !== null) {
            window.clearTimeout(releaseTimeoutRef.current);
        }

        releaseTimeoutRef.current = window.setTimeout(() => {
            setIsPressed(false);
        }, 80);
    }, []);

    const endGame = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        setTimeLeft(0);
        setGameState('FINISHED');
        gameStateRef.current = 'FINISHED';
    }, []);

    const updateTimer = useCallback(() => {
        const remainingMs = Math.max(0, deadlineRef.current - performance.now());
        setTimeLeft(remainingMs / 1000);

        if (remainingMs <= 0) {
            endGame();
            return;
        }

        rafRef.current = requestAnimationFrame(updateTimer);
    }, [endGame]);

    const startRound = useCallback(() => {
        const selectedMode = modeRef.current;
        const selectedDuration = DURATIONS[selectedMode];
        const now = performance.now();

        deadlineRef.current = now + selectedDuration * 1000;
        setGameState('RUNNING');
        gameStateRef.current = 'RUNNING';
        setTimeLeft(selectedDuration);
        setPresses(1);
        rafRef.current = requestAnimationFrame(updateTimer);
    }, [updateTimer]);

    const registerPress = useCallback(() => {
        setIsPressed(true);
        stopPressAnimation();

        if (gameStateRef.current === 'FINISHED') {
            return;
        }

        if (gameStateRef.current === 'IDLE') {
            startRound();
            return;
        }

        if (gameStateRef.current === 'RUNNING') {
            if (performance.now() >= deadlineRef.current) {
                endGame();
                return;
            }

            setPresses((current) => current + 1);
        }
    }, [endGame, startRound, stopPressAnimation]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
                return;
            }

            if (event.code !== 'Space' && event.key !== ' ') {
                return;
            }

            event.preventDefault();

            if (event.repeat) {
                return;
            }

            registerPress();
        };

        window.addEventListener('keydown', handleKeyDown, { passive: false });
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [registerPress]);

    useEffect(() => {
        if (gameState !== 'FINISHED') {
            return;
        }

        const currentBest = bestScores[mode];
        if (currentBest !== undefined && currentBest >= finalRate) {
            return;
        }

        const nextScores = {
            ...bestScores,
            [mode]: finalRate,
        };
        setBestScores(nextScores);
        writeBestScores(nextScores);
    }, [bestScores, finalRate, gameState, mode]);

    useEffect(() => {
        if (gameState !== 'FINISHED' || mode !== '10s') {
            return;
        }

        void submitScoreToLeaderboard('spacebar-clicker', parseFloat(finalRate.toFixed(2)), {
            mode: '10s',
        });
    }, [finalRate, gameState, mode]);

    const handleModeChange = (nextMode: TimeMode) => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        setMode(nextMode);
        setGameState('IDLE');
        gameStateRef.current = 'IDLE';
        setPresses(0);
        setTimeLeft(DURATIONS[nextMode]);
        setIsPressed(false);
    };

    const resetRound = () => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        setGameState('IDLE');
        gameStateRef.current = 'IDLE';
        setPresses(0);
        setTimeLeft(DURATIONS[modeRef.current]);
        setIsPressed(false);
        pressAreaRef.current?.focus();
    };

    const statusTitle = gameState === 'FINISHED'
        ? t('resultTitle')
        : gameState === 'RUNNING'
            ? t('keepGoing')
            : t('readyTitle');

    const statusDescription = gameState === 'FINISHED'
        ? t('resultDescription', { count: presses })
        : gameState === 'RUNNING'
            ? t('runningDescription')
            : t('readyDescription');

    const statItems = useMemo(() => {
        return [
            { label: t('stats.presses'), value: presses.toString() },
            { label: t('stats.timeLeft'), value: `${timeLeft.toFixed(2)}s` },
            { label: t('stats.rate'), value: `${currentRate.toFixed(2)} /s` },
            { label: t('stats.best'), value: bestForMode ? `${bestForMode.toFixed(2)} /s` : t('noBestYet') },
        ];
    }, [bestForMode, currentRate, presses, t, timeLeft]);

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-2 py-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className={`flex flex-wrap gap-1 rounded-lg p-1 ${gameTabsClass}`}>
                    {(['5s', '10s', '30s'] as TimeMode[]).map((candidate) => (
                        <Button
                            key={candidate}
                            variant="ghost"
                            aria-pressed={mode === candidate}
                            onClick={() => handleModeChange(candidate)}
                            disabled={gameState === 'RUNNING'}
                            className={`min-w-20 ${gameTabClass(mode === candidate)}`}
                        >
                            {tModes(candidate)}
                        </Button>
                    ))}
                </div>
                <Button variant="outline" onClick={resetRound}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t('reset')}
                </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
                {statItems.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border bg-card px-4 py-3">
                        <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            {item.label}
                        </div>
                        <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-[28px] border border-border bg-card p-4 shadow-sm">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
                            {t('eyebrow')}
                        </div>
                        <h2 className="mt-1 text-3xl font-semibold text-foreground">
                            {statusTitle}
                        </h2>
                    </div>
                    <p className="max-w-2xl text-sm text-muted-foreground md:text-right">
                        {statusDescription}
                    </p>
                </div>

                <button
                    ref={pressAreaRef}
                    type="button"
                    onPointerDown={registerPress}
                    className={cn(
                        'group relative flex h-44 w-full items-center justify-center overflow-hidden rounded-[34px] border border-border bg-background px-6 text-center shadow-[inset_0_-6px_0_rgba(15,23,42,0.05)] transition-all duration-100 md:h-56',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
                        isPressed && 'translate-y-[3px] shadow-[inset_0_2px_0_rgba(15,23,42,0.08)]'
                    )}
                    aria-label={t('pressButton')}
                >
                    <div className="absolute inset-x-6 top-6 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        <span>{t('keyboardHint')}</span>
                        <span className="tabular-nums">{mode}</span>
                    </div>

                    <div className="space-y-3">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground">
                            {gameState === 'RUNNING'
                                ? <TimerReset className="h-6 w-6" />
                                : <Keyboard className="h-6 w-6" />}
                        </div>
                        <div className="text-xs font-medium uppercase tracking-[0.55em] text-muted-foreground">
                            {t('keyLabel')}
                        </div>
                        <div className="text-3xl font-semibold tracking-[0.4em] text-foreground md:text-4xl">
                            SPACE
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {gameState === 'RUNNING' ? t('tapFaster') : t('startHint')}
                        </div>
                    </div>
                </button>
            </div>

            <Dialog open={gameState === 'FINISHED'}>
                <DialogContent
                    className="sm:max-w-2xl rounded-[28px] p-0 [&>button]:hidden"
                    onEscapeKeyDown={(event) => event.preventDefault()}
                    onInteractOutside={(event) => event.preventDefault()}
                >
                    <div className="p-6 md:p-7">
                        <DialogHeader className="text-left">
                            <DialogTitle className="text-2xl font-semibold text-foreground">
                                {t('resultTitle')}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                {t('resultDescription', { count: presses })}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-5 grid gap-3 md:grid-cols-4">
                            <div className="rounded-2xl bg-muted/40 px-4 py-4">
                                <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    {t('results.totalPresses')}
                                </div>
                                <div className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
                                    {presses}
                                </div>
                            </div>
                            <div className="rounded-2xl bg-muted/40 px-4 py-4">
                                <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    {t('results.averageRate')}
                                </div>
                                <div className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
                                    {finalRate.toFixed(2)}
                                </div>
                            </div>
                            <div className="rounded-2xl bg-muted/40 px-4 py-4">
                                <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    {t('results.duration')}
                                </div>
                                <div className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
                                    {mode}
                                </div>
                            </div>
                            <div className="rounded-2xl bg-muted/40 px-4 py-4">
                                <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    {t('results.localBest')}
                                </div>
                                <div className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
                                    {bestForMode ? bestForMode.toFixed(2) : '—'}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <Button onClick={resetRound} className="min-w-36">
                                {t('continueChallenge')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
