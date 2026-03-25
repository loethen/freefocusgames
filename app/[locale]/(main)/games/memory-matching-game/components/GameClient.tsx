'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { Play, RefreshCcw, Settings2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShareModal } from '@/components/ui/ShareModal'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { submitScoreToLeaderboard } from '@/lib/leaderboard'
import MemoryCard from './MemoryCard'

type ThemeId = 'shapes' | 'letters' | 'numbers'
type DifficultyId = 'easy' | 'medium' | 'hard'

interface DeckCard {
    id: number
    pairId: string
    symbol: string
    isFlipped: boolean
    isMatched: boolean
}

const themeConfigs: Record<ThemeId, { symbols: string[] }> = {
    shapes: {
        symbols: ['△', '□', '◇', '○', '✦', '⬢', '✚', '∞', '◐', '✳', '⬟', '◉'],
    },
    letters: {
        symbols: ['A', 'E', 'H', 'K', 'M', 'Q', 'R', 'S', 'T', 'W', 'X', 'Z'],
    },
    numbers: {
        symbols: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '14', '16'],
    },
}

const difficultyConfigs: Record<DifficultyId, { cols: number; rows: number; pairs: number }> = {
    easy: { cols: 4, rows: 4, pairs: 8 },
    medium: { cols: 5, rows: 4, pairs: 10 },
    hard: { cols: 6, rows: 4, pairs: 12 },
}

function shuffle<T>(items: T[]) {
    const next = [...items]
    for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1))
        ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
    }
    return next
}

function createDeck(themeId: ThemeId, difficultyId: DifficultyId): DeckCard[] {
    const theme = themeConfigs[themeId]
    const difficulty = difficultyConfigs[difficultyId]
    const selectedSymbols = theme.symbols.slice(0, difficulty.pairs)
    const pairs = selectedSymbols.flatMap((symbol, index) => [
        {
            id: index * 2,
            pairId: `${themeId}-${symbol}`,
            symbol,
            isFlipped: false,
            isMatched: false,
        },
        {
            id: index * 2 + 1,
            pairId: `${themeId}-${symbol}`,
            symbol,
            isFlipped: false,
            isMatched: false,
        },
    ])

    return shuffle(pairs).map((card, index) => ({ ...card, id: index }))
}

function formatDuration(ms: number) {
    const totalSeconds = ms / 1000
    if (totalSeconds < 60) {
        return `${totalSeconds.toFixed(1)}s`
    }

    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`
}

export default function GameClient() {
    const t = useTranslations('games.memoryMatchingGame')
    const uiT = useTranslations('games.memoryMatchingGame.gameUI')
    const [selectedTheme, setSelectedTheme] = useState<ThemeId>('shapes')
    const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyId>('easy')
    const [isCompactBoard, setIsCompactBoard] = useState(false)
    const [deck, setDeck] = useState<DeckCard[]>([])
    const [moves, setMoves] = useState(0)
    const [elapsedMs, setElapsedMs] = useState(0)
    const [bestTimeMs, setBestTimeMs] = useState<number | null>(null)
    const [hasStarted, setHasStarted] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
    const [isResolving, setIsResolving] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [newBest, setNewBest] = useState(false)
    const startedAtRef = useRef(Date.now())
    const openCardIdsRef = useRef<number[]>([])
    const resolveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const hasSubmittedLeaderboardRef = useRef(false)

    const currentDifficulty = difficultyConfigs[selectedDifficulty]
    const displayCols = isCompactBoard ? Math.min(4, currentDifficulty.cols) : currentDifficulty.cols
    const displayRows = Math.ceil((currentDifficulty.pairs * 2) / displayCols)
    const isLeaderboardRun = selectedTheme === 'shapes' && selectedDifficulty === 'easy'
    const matchedPairs = useMemo(
        () => deck.filter((card) => card.isMatched).length / 2,
        [deck]
    )
    const boardWidth = useMemo(() => {
        const ratio = displayCols / displayRows
        const pixelCap =
            displayCols <= 4
                ? 520
                : selectedDifficulty === 'medium'
                    ? 620
                    : 700

        return `min(100%, ${pixelCap}px, calc((100svh - 270px) * ${ratio}))`
    }, [displayCols, displayRows, selectedDifficulty])

    const initializeBoard = useCallback((themeId: ThemeId, difficultyId: DifficultyId) => {
        if (resolveTimeoutRef.current) {
            clearTimeout(resolveTimeoutRef.current)
            resolveTimeoutRef.current = null
        }

        setDeck(createDeck(themeId, difficultyId))
        openCardIdsRef.current = []
        setMoves(0)
        setElapsedMs(0)
        setHasStarted(false)
        setIsComplete(false)
        setIsResolving(false)
        setNewBest(false)
        hasSubmittedLeaderboardRef.current = false
        startedAtRef.current = 0

        if (typeof window !== 'undefined') {
            const storedValue = window.localStorage.getItem(`memoryMatchBest_${themeId}_${difficultyId}`)
            setBestTimeMs(storedValue ? Number(storedValue) : null)
        }
    }, [])

    useEffect(() => {
        initializeBoard(selectedTheme, selectedDifficulty)
    }, [initializeBoard, selectedDifficulty, selectedTheme])

    useEffect(() => {
        if (deck.length === 0 || !hasStarted || isComplete) {
            return undefined
        }

        const interval = window.setInterval(() => {
            setElapsedMs(Date.now() - startedAtRef.current)
        }, 100)

        return () => window.clearInterval(interval)
    }, [deck.length, hasStarted, isComplete])

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined
        }

        const mediaQuery = window.matchMedia('(max-width: 639px)')
        const syncCompactBoard = () => setIsCompactBoard(mediaQuery.matches)

        syncCompactBoard()
        mediaQuery.addEventListener('change', syncCompactBoard)

        return () => mediaQuery.removeEventListener('change', syncCompactBoard)
    }, [])

    useEffect(() => {
        if (deck.length === 0 || !hasStarted || isComplete || !deck.every((card) => card.isMatched)) {
            return
        }

        const finishedMs = Date.now() - startedAtRef.current
        setElapsedMs(finishedMs)
        setIsComplete(true)

        const isRecord = bestTimeMs === null || finishedMs < bestTimeMs
        if (isRecord && typeof window !== 'undefined') {
            window.localStorage.setItem(
                `memoryMatchBest_${selectedTheme}_${selectedDifficulty}`,
                String(finishedMs)
            )
            setBestTimeMs(finishedMs)
        }
        setNewBest(isRecord)
        confetti({
            particleCount: 140,
            spread: 90,
            origin: { y: 0.55 },
            zIndex: 200,
        })

        if (isLeaderboardRun && !hasSubmittedLeaderboardRef.current) {
            hasSubmittedLeaderboardRef.current = true
            void submitScoreToLeaderboard('memory-matching-game', finishedMs)
        }
    }, [bestTimeMs, deck, hasStarted, isComplete, isLeaderboardRun, selectedDifficulty, selectedTheme])

    useEffect(() => {
        return () => {
            if (resolveTimeoutRef.current) {
                clearTimeout(resolveTimeoutRef.current)
            }
        }
    }, [])

    const resolvePair = useCallback((cardIds: number[]) => {
        setDeck((currentDeck) => {
            const [firstCard, secondCard] = cardIds.map((cardId) =>
                currentDeck.find((card) => card.id === cardId)
            )

            if (!firstCard || !secondCard) {
                return currentDeck
            }

            if (firstCard.pairId === secondCard.pairId) {
                return currentDeck.map((card) =>
                    cardIds.includes(card.id) ? { ...card, isMatched: true } : card
                )
            }

            return currentDeck.map((card) =>
                cardIds.includes(card.id) ? { ...card, isFlipped: false } : card
            )
        })

        openCardIdsRef.current = []
        setIsResolving(false)
        resolveTimeoutRef.current = null
    }, [])

    const handleSelectCard = (cardId: number) => {
        if (!hasStarted || isResolving || isComplete) {
            return
        }

        const currentCard = deck.find((card) => card.id === cardId)
        if (!currentCard || currentCard.isFlipped || currentCard.isMatched) {
            return
        }

        setDeck((currentDeck) =>
            currentDeck.map((card) =>
                card.id === cardId ? { ...card, isFlipped: true } : card
            )
        )

        const nextOpenIds = [...openCardIdsRef.current, cardId]
        openCardIdsRef.current = nextOpenIds

        if (nextOpenIds.length === 2) {
            setIsResolving(true)
            setMoves((currentMoves) => currentMoves + 1)
            resolveTimeoutRef.current = setTimeout(() => {
                resolvePair(nextOpenIds)
            }, 650)
        }
    }

    const handleReset = () => {
        initializeBoard(selectedTheme, selectedDifficulty)
    }

    const handleStart = () => {
        startedAtRef.current = Date.now()
        setElapsedMs(0)
        setHasStarted(true)
    }

    return (
        <div className="relative text-foreground">
            <div className="relative px-1 py-2 sm:px-2 sm:py-3">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                            {uiT('instructions')}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleReset}
                            className="gap-2"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            {uiT('controls.reset')}
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button type="button" variant="outline" size="sm" className="gap-2">
                                    <Settings2 className="h-4 w-4" />
                                    {uiT('controls.settings')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>{uiT('settings.title')}</DialogTitle>
                                    <DialogDescription>{uiT('settings.description')}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-5">
                                    <div>
                                        <div className="mb-2 text-sm font-medium text-foreground">
                                            {uiT('controls.theme')}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(['shapes', 'letters', 'numbers'] as ThemeId[]).map((themeId) => (
                                                <button
                                                    key={themeId}
                                                    type="button"
                                                    onClick={() => setSelectedTheme(themeId)}
                                                    className={cn(
                                                        'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                                                        selectedTheme === themeId
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-border bg-background text-foreground hover:bg-muted'
                                                    )}
                                                >
                                                    {uiT(`themes.${themeId}`)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-2 text-sm font-medium text-foreground">
                                            {uiT('controls.difficulty')}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(['easy', 'medium', 'hard'] as DifficultyId[]).map((difficultyId) => (
                                                <button
                                                    key={difficultyId}
                                                    type="button"
                                                    onClick={() => setSelectedDifficulty(difficultyId)}
                                                    className={cn(
                                                        'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                                                        selectedDifficulty === difficultyId
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-border bg-background text-foreground hover:bg-muted'
                                                    )}
                                                >
                                                    {uiT(`difficulties.${difficultyId}`)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!isComplete}
                            onClick={() => setShowShareModal(true)}
                            className="gap-2"
                        >
                            <Share2 className="h-4 w-4" />
                            {uiT('shareResults')}
                        </Button>
                    </div>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                    {[
                        { label: uiT('stats.moves'), value: String(moves) },
                        { label: uiT('stats.best'), value: bestTimeMs ? formatDuration(bestTimeMs) : '—' },
                        { label: uiT('stats.pairs'), value: `${matchedPairs}/${currentDifficulty.pairs}` },
                        { label: uiT('stats.time'), value: formatDuration(elapsedMs), isTime: true },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-sm backdrop-blur-[1px]"
                        >
                            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                {item.label}
                            </div>
                            <div className={cn(
                                'font-semibold text-foreground',
                                item.isTime && 'min-w-[4.75rem] tabular-nums text-right'
                            )}>
                                {item.value}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded-full border border-border bg-background/70 px-3 py-1 backdrop-blur-[1px]">
                        {uiT('controls.theme')}: {uiT(`themes.${selectedTheme}`)}
                    </span>
                    <span className="rounded-full border border-border bg-background/70 px-3 py-1 backdrop-blur-[1px]">
                        {uiT('controls.difficulty')}: {uiT(`difficulties.${selectedDifficulty}`)}
                    </span>
                </div>

                <div
                    className="relative mx-auto w-full"
                    style={{ maxWidth: boardWidth }}
                >
                    <div
                        className="grid gap-2 sm:gap-3"
                        style={{ gridTemplateColumns: `repeat(${displayCols}, minmax(0, 1fr))` }}
                    >
                        {deck.map((card) => (
                            <MemoryCard
                                key={card.id}
                                card={card}
                                disabled={isResolving}
                                onSelect={handleSelectCard}
                                ariaLabel={uiT('revealCard', { symbol: card.symbol })}
                            />
                        ))}
                    </div>

                    {!hasStarted && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/88 p-4 backdrop-blur-[2px]">
                            <div className="max-w-sm rounded-[28px] border border-border bg-card px-6 py-7 text-center shadow-sm">
                                <h3 className="text-2xl font-semibold text-foreground">
                                    {uiT('startTitle')}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    {uiT('startDescription')}
                                </p>
                                <Button type="button" onClick={handleStart} className="mt-5 gap-2">
                                    <Play className="h-4 w-4" />
                                    {uiT('controls.start')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {isComplete && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-6 text-card-foreground shadow-xl">
                        <div className="mb-2 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                            {uiT(`themes.${selectedTheme}`)} · {uiT(`difficulties.${selectedDifficulty}`)}
                        </div>
                        <h3 className="text-3xl font-semibold">
                            {uiT('completeTitle')}
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                            {uiT('completeDescription', {
                                pairs: currentDifficulty.pairs,
                                moves,
                            })}
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-border bg-background/70 p-4">
                                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                                    {uiT('stats.time')}
                                </div>
                                <div className="mt-1 text-2xl font-semibold">
                                    {formatDuration(elapsedMs)}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border bg-background/70 p-4">
                                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                                    {uiT('stats.moves')}
                                </div>
                                <div className="mt-1 text-2xl font-semibold">
                                    {moves}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4 text-sm text-muted-foreground">
                            <div className="flex items-center justify-between gap-4">
                                <span>{uiT('stats.best')}</span>
                                <span className="font-medium text-foreground">
                                    {bestTimeMs ? formatDuration(bestTimeMs) : formatDuration(elapsedMs)}
                                </span>
                            </div>
                            {newBest && (
                                <div className="mt-2 text-sm font-medium text-primary">
                                    {uiT('newBest')}
                                </div>
                            )}
                        </div>

                        <p className="mt-4 text-sm text-muted-foreground">
                            {isLeaderboardRun ? uiT('leaderboardEligible') : uiT('leaderboardDefaultOnly')}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button type="button" onClick={handleReset}>
                                {uiT('playAgain')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowShareModal(true)}
                            >
                                {uiT('shareResults')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                title={t('title')}
                shareText={uiT('shareText', {
                    difficulty: uiT(`difficulties.${selectedDifficulty}`),
                    theme: uiT(`themes.${selectedTheme}`),
                    moves,
                    time: formatDuration(elapsedMs),
                })}
            />
        </div>
    )
}
