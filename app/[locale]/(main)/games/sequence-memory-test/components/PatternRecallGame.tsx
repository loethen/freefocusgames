'use client'

import { gameTabClass, gameTabsClass } from '@/lib/game-tab-styles'
import { useState, useEffect, useReducer, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PlayCircle, Trophy, Loader2, Minus, Plus, Check, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import { submitScoreToLeaderboard } from '@/lib/leaderboard'
import {
    BLOCK_MEMORY_CHALLENGE_START,
    BLOCK_MEMORY_PRACTICE_MIN,
    BLOCK_MEMORY_PRACTICE_MAX,
    blockMemoryLeaderboardMode,
    blockMemoryBestKey,
    blockMemoryExpectedBlock,
    BLOCK_MEMORY_RULES_VERSION,
    blockMemoryReducer,
    generateBlockMemoryPattern,
    initialBlockMemoryState,
    type BlockMemoryMode,
} from '@/lib/block-memory-game'
import { RecallDirectionToggle, useRecallDirection } from './RecallDirection'

const BEST_KEYS = ['challenge', 'practice'].flatMap((mode) =>
    (['forward', 'backward'] as const).map((direction) => blockMemoryBestKey(mode as BlockMemoryMode, direction)))

export function PatternRecallGame() {
    const t = useTranslations('games.blockMemoryChallenge.gameUI')
    const [game, dispatch] = useReducer(blockMemoryReducer, initialBlockMemoryState)
    const [mode, setMode] = useState<BlockMemoryMode>('challenge')
    const { direction } = useRecallDirection()
    const [startLength, setStartLength] = useState(BLOCK_MEMORY_CHALLENGE_START)
    const [bestLengths, setBestLengths] = useState<Record<string, number>>({})
    const submitted = useRef(false)
    const bestBeforeRun = useRef(0)
    const resultHeading = useRef<HTMLHeadingElement>(null)
    const isIdle = game.status === 'idle'
    const isStarting = game.status === 'starting'
    const activeMode = isIdle ? mode : game.mode
    const activeDirection = isIdle ? direction : game.direction
    const bestLength = bestLengths[blockMemoryBestKey(activeMode, activeDirection)] ?? 0
    const resultKind = game.completedLength === 0
        ? 'firstRound'
        : game.completedLength > bestBeforeRun.current ? 'newBest' : 'completed'

    useEffect(() => {
        if (game.status === 'failed') resultHeading.current?.focus({ preventScroll: true })
    }, [game.status])

    useEffect(() => {
        try {
            localStorage.removeItem('memoryBlocksBestScore')
            const readBest = (key: string) => {
                const value = Number(localStorage.getItem(key))
                return Number.isInteger(value) && value > 0 ? value : 0
            }
            setBestLengths(Object.fromEntries(BEST_KEYS.map((key) => [key, readBest(key)])))
        } catch {
            // A blocked localStorage must not prevent playing.
        }
    }, [])

    useEffect(() => {
        const key = blockMemoryBestKey(game.mode, game.direction)
        if (game.completedLength <= (bestLengths[key] ?? 0)) return
        const nextBest = game.completedLength
        setBestLengths((current) => ({ ...current, [key]: Math.max(current[key] ?? 0, nextBest) }))
        try {
            localStorage.setItem(key, String(nextBest))
        } catch {
            // Keep the best result for this session when storage is unavailable.
        }
    }, [game.completedLength, game.mode, game.direction, bestLengths])

    // Every phase owns one cancellable timer. Restarting or unmounting clears it.
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined
        switch (game.status) {
            case 'starting':
                timer = setTimeout(() => dispatch({ type: 'ready' }), 300)
                break
            case 'preparing':
                timer = setTimeout(() => dispatch({ type: 'prepare-tick', remaining: game.prepareSeconds }), 1000)
                break
            case 'showing':
            case 'gap':
                timer = setTimeout(() => dispatch({ type: 'display-tick' }), game.status === 'showing' ? 800 : 200)
                break
            case 'correct':
                timer = setTimeout(() => dispatch({ type: 'feedback-end' }), 180)
                break
            case 'guessing':
                if (game.selectedBlock !== null) {
                    timer = setTimeout(() => dispatch({ type: 'clear-selection', inputIndex: game.inputIndex }), 180)
                }
                break
            case 'complete':
                timer = setTimeout(() => dispatch({ type: 'next-round', pattern: generateBlockMemoryPattern(game.length + 1) }), 500)
                break
        }
        return () => clearTimeout(timer)
    }, [game.status, game.displayIndex, game.inputIndex, game.length, game.selectedBlock, game.prepareSeconds])

    useEffect(() => {
        if (game.status !== 'failed' || game.mode !== 'challenge' || game.completedLength === 0 || submitted.current) return
        submitted.current = true
        void submitScoreToLeaderboard('block-memory-challenge', game.completedLength, {
            mode: blockMemoryLeaderboardMode(game.direction),
            details: { startingLength: BLOCK_MEMORY_CHALLENGE_START, rulesVersion: BLOCK_MEMORY_RULES_VERSION, direction: game.direction },
        })
    }, [game.status, game.mode, game.direction, game.completedLength])

    const startGame = () => {
        if (game.status !== 'idle' && game.status !== 'failed') return
        submitted.current = false
        const nextMode = isIdle ? mode : game.mode
        const nextDirection = isIdle ? direction : game.direction
        bestBeforeRun.current = bestLengths[blockMemoryBestKey(nextMode, nextDirection)] ?? 0
        const length = nextMode === 'challenge' ? BLOCK_MEMORY_CHALLENGE_START : startLength
        dispatch({ type: 'start', mode: nextMode, direction: nextDirection, pattern: generateBlockMemoryPattern(length) })
    }

    const statusText = game.status === 'showing' || game.status === 'gap'
        ? t('watchSequence')
        : game.status === 'guessing' || game.status === 'correct'
            ? t(game.direction === 'backward' ? 'repeatBackward' : 'repeatSequence')
            : game.status === 'complete' ? t('wellDone') : ''
    const isFinished = game.status === 'failed'

    return (
        <div className="space-y-6 max-w-md mx-auto py-4">
            {!isIdle && !isStarting && (
                <div className="flex flex-wrap justify-between items-center gap-2" aria-live="polite">
                    <div className="flex gap-4 items-center">
                        <div className="text-lg font-medium">{t('sequenceLength', { count: game.length })}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Trophy className="w-4 h-4" aria-hidden="true" />
                            <span>{t('completedSequence', { count: game.completedLength })}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                            {isFinished && bestLength > 0
                                ? `${t('personalBest')}: ${t('sequenceLength', { count: bestLength })}`
                                : statusText}
                        </span>
                    </div>
                </div>
            )}

            <div className={cn('relative', (isIdle || isStarting) && 'min-h-[440px]')}>
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                    {Array.from({ length: 9 }, (_, blockId) => {
                        const isHighlighted = game.status === 'showing' && game.pattern[game.displayIndex] === blockId
                        const isError = isFinished && game.selectedBlock === blockId
                        const isCorrectTarget = isFinished && blockMemoryExpectedBlock(game) === blockId
                        return (
                            <button
                                key={blockId}
                                type="button"
                                aria-label={`${t('blockLabel', { count: blockId + 1 })}${isError ? `: ${t('wrongChoice')}` : isCorrectTarget ? `: ${t('correctChoice')}` : ''}`}
                                aria-disabled={game.status !== 'guessing'}
                                tabIndex={['guessing', 'correct'].includes(game.status) ? 0 : -1}
                                onClick={() => dispatch({ type: 'select', blockId })}
                                className={cn(
                                    'aspect-square rounded-lg bg-foreground/5 transition-[background-color,transform] duration-150 ease-out motion-reduce:transition-none touch-manipulation select-none [-webkit-tap-highlight-color:transparent]',
                                    'flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                    game.status === 'guessing'
                                        ? 'cursor-pointer active:scale-[0.98] active:bg-black active:duration-75 motion-reduce:active:scale-100'
                                        : 'cursor-default',
                                    isHighlighted && 'bg-primary',
                                    isCorrectTarget && 'bg-black',
                                    isError && 'bg-destructive/30',
                                )}
                            >
                                {isError && <X className="h-6 w-6 text-destructive" aria-hidden="true" />}
                                {isCorrectTarget && <Check className="h-6 w-6 text-white" aria-hidden="true" />}
                            </button>
                        )
                    })}
                </div>

                {game.status === 'preparing' && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/90" role="status" aria-live="polite">
                        <p className="text-sm text-muted-foreground">{t(game.completedLength > 0 ? 'nextRound' : 'getReady')}</p>
                        <p className="text-5xl font-semibold tabular-nums" aria-label={t('countdown', { count: game.prepareSeconds })}>
                            {game.prepareSeconds}
                        </p>
                    </div>
                )}

                {(isIdle || isStarting) && bestLength > 0 && (
                    <div className="absolute right-4 top-4 z-10 flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{t('personalBest')}</span>
                        <span className="font-semibold tabular-nums">{t('sequenceLength', { count: bestLength })}</span>
                    </div>
                )}

                {(isIdle || isStarting) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-background/95 px-6 pb-6 pt-16">
                        <div className="w-full max-w-[320px] space-y-6">
                            <div className="space-y-3">
                                <div className={cn("flex w-full rounded-lg p-1", gameTabsClass)} role="group" aria-label={t('modeLabel')}>
                                    {(['challenge', 'practice'] as const).map((option) => (
                                        <Button
                                            key={option}
                                            type="button"
                                            variant="ghost"
                                            aria-pressed={activeMode === option}
                                            disabled={isStarting}
                                            onClick={() => setMode(option)}
                                            className={cn('flex-1 h-12 shadow-none', gameTabClass(activeMode === option))}
                                        >
                                            {t(option === 'challenge' ? 'rankedMode' : 'practiceMode')}
                                        </Button>
                                    ))}
                                </div>
                                <p className="text-center text-sm text-muted-foreground">
                                    {t(activeMode === 'challenge' ? 'rankedDescription' : 'practiceDescription')}
                                </p>
                            </div>
                            <div className="space-y-5">
                                <RecallDirectionToggle disabled={isStarting} variant="radio" />
                                {activeMode === 'practice' && (
                                    <div className="flex w-full items-center justify-between gap-3">
                                        <Label htmlFor="start-level" className="text-sm font-normal text-muted-foreground">
                                            {t('startLevelLabel')}
                                        </Label>
                                        <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background">
                                            <Button
                                                type="button" variant="ghost" className="h-11 w-11 rounded-none p-0"
                                                aria-label={t('decreaseStartLevel')}
                                                onClick={() => setStartLength((current) => Math.max(BLOCK_MEMORY_PRACTICE_MIN, current - 1))}
                                                disabled={isStarting || startLength <= BLOCK_MEMORY_PRACTICE_MIN}
                                            ><Minus className="h-4 w-4" /></Button>
                                            <output
                                                id="start-level"
                                                className="flex h-11 w-12 items-center justify-center border-x border-border text-base font-semibold tabular-nums"
                                            >
                                                {startLength}
                                            </output>
                                            <Button
                                                type="button" variant="ghost" className="h-11 w-11 rounded-none p-0"
                                                aria-label={t('increaseStartLevel')}
                                                onClick={() => setStartLength((current) => Math.min(BLOCK_MEMORY_PRACTICE_MAX, current + 1))}
                                                disabled={isStarting || startLength >= BLOCK_MEMORY_PRACTICE_MAX}
                                            ><Plus className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Button size="lg" onClick={startGame} className="h-12 w-full gap-2 shadow-none" disabled={isStarting}>
                                {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                                {isStarting ? t('starting') : t('startGame')}
                            </Button>
                        </div>
                    </div>
                )}

                {game.status === 'failed' && (
                    <div
                        role="dialog"
                        aria-modal="false"
                        aria-labelledby="block-memory-result-title"
                        aria-describedby="block-memory-result-description"
                        className="absolute inset-0 flex flex-col overflow-y-auto rounded-lg bg-background/90 p-4"
                    >
                        <div className="my-auto mx-auto w-full max-w-sm shrink-0 space-y-4 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground">{t(game.direction)} · {t('highestLevelReached')}</p>
                                <p className="mt-1 text-4xl font-semibold tabular-nums">
                                    {t('sequenceLength', { count: game.completedLength })}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 id="block-memory-result-title" ref={resultHeading} tabIndex={-1} className="text-xl font-semibold outline-none">
                                    {t(`result.${resultKind}.title`)}
                                </h3>
                                <p id="block-memory-result-description" className="text-sm leading-relaxed text-muted-foreground">
                                    {t(`result.${resultKind}.description`)}
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                <Button onClick={startGame} className="shadow-none">{t('playAgain')}</Button>
                                <Button variant="ghost" onClick={() => dispatch({ type: 'reset' })}>{t('changeMode')}</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
