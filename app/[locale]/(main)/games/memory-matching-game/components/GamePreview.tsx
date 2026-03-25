'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type PreviewPhase = 0 | 1 | 2 | 3

const PAIR_SYMBOL = '△'
const FIRST_PAIR_INDEX = 1
const SECOND_PAIR_INDEX = 5
const phaseDurations: Record<PreviewPhase, number> = {
    0: 900,
    1: 650,
    2: 750,
    3: 1100,
}

export function GamePreview() {
    const t = useTranslations('games.memoryMatchingGame.preview')
    const [phase, setPhase] = useState<PreviewPhase>(0)

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setPhase((currentPhase) => ((currentPhase + 1) % 4) as PreviewPhase)
        }, phaseDurations[phase])

        return () => window.clearTimeout(timeoutId)
    }, [phase])

    const cards = useMemo(() => {
        return Array.from({ length: 6 }, (_, index) => {
            const isFirstPairCard = index === FIRST_PAIR_INDEX
            const isSecondPairCard = index === SECOND_PAIR_INDEX
            const isFlipped =
                (isFirstPairCard && phase >= 1) ||
                (isSecondPairCard && phase >= 2)
            const isMatched =
                (isFirstPairCard || isSecondPairCard) && phase === 3

            return {
                id: index,
                symbol: isFirstPairCard || isSecondPairCard ? PAIR_SYMBOL : '?',
                isFlipped,
                isMatched,
            }
        })
    }, [phase])

    const statusLabel = phase === 3
        ? t('statusMatched')
        : phase === 0
            ? t('statusIdle')
            : t('statusFlipping')

    return (
        <div className="h-full w-full overflow-hidden rounded-[20px] border border-border bg-card shadow-sm">
            <div className="relative h-full bg-linear-to-br from-background via-background to-muted/30 p-2.5">
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/8 blur-2xl" />
                <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-primary/6 blur-3xl" />

                <div className="relative flex h-full min-h-0 flex-col">
                    <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                {t('eyebrow')}
                            </div>
                            <div className="mt-0.5 text-sm font-semibold text-foreground">
                                {t('title')}
                            </div>
                        </div>
                        <div className="rounded-full border border-border bg-background/80 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-sm">
                            {statusLabel}
                        </div>
                    </div>

                    <div className="flex min-h-0 flex-1 items-center justify-center rounded-[18px] border border-border/80 bg-background/70 px-2.5 py-2 backdrop-blur-sm">
                        <div className="grid w-full max-w-[156px] grid-cols-3 gap-2">
                            {cards.map((card) => (
                                <div
                                    key={card.id}
                                    className="aspect-square"
                                >
                                    <div
                                        className={cn(
                                            'relative h-full w-full rounded-[14px] border shadow-sm transition-colors duration-300',
                                            card.isFlipped
                                                ? card.isMatched
                                                    ? 'border-primary/35 bg-primary/8 ring-1 ring-primary/20'
                                                    : 'border-border bg-card'
                                                : 'border-border bg-muted/45'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'absolute inset-0 flex items-center justify-center text-base font-semibold text-muted-foreground/55 transition-opacity duration-200',
                                                card.isFlipped && 'opacity-0'
                                            )}
                                        >
                                            <span className="translate-y-[-0.03em]">?</span>
                                        </span>
                                        <span
                                            className={cn(
                                                'absolute inset-0 flex items-center justify-center text-base font-semibold transition-opacity duration-200',
                                                card.isMatched ? 'text-primary' : 'text-card-foreground',
                                                card.isFlipped ? 'opacity-100' : 'opacity-0'
                                            )}
                                        >
                                            <span className="translate-y-[-0.03em]">
                                                {card.symbol}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
