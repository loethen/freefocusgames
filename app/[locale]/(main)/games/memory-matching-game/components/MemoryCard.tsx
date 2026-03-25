'use client'

import { cn } from '@/lib/utils'

interface MemoryCardData {
    id: number
    symbol: string
    isFlipped: boolean
    isMatched: boolean
}

interface MemoryCardProps {
    card: MemoryCardData
    disabled?: boolean
    onSelect: (id: number) => void
    ariaLabel: string
}

export default function MemoryCard({ card, disabled, onSelect, ariaLabel }: MemoryCardProps) {
    const handleSelect = () => {
        if (!disabled && !card.isFlipped && !card.isMatched) {
            onSelect(card.id)
        }
    }

    return (
        <button
            type="button"
            onClick={handleSelect}
            aria-label={ariaLabel}
            disabled={disabled || card.isFlipped || card.isMatched}
            className={cn(
                'group aspect-square w-full perspective-[1200px] rounded-[24px] text-left transition-transform',
                !disabled && !card.isMatched && 'hover:-translate-y-0.5',
                card.isMatched && 'cursor-default'
            )}
        >
            <div
                className={cn(
                    'relative h-full w-full transform-3d transition-transform duration-500',
                    (card.isFlipped || card.isMatched) && 'rotate-y-180'
                )}
            >
                <div className="absolute inset-0 backface-hidden rounded-[24px] border border-border bg-background p-2 shadow-sm">
                    <div className="relative flex h-full items-center justify-center overflow-hidden rounded-[20px] border border-border bg-muted/40">
                        <span className="inline-flex translate-y-[-0.04em] items-center justify-center text-3xl leading-none font-semibold text-muted-foreground/55 sm:text-4xl">
                            ?
                        </span>
                    </div>
                </div>

                <div className="absolute inset-0 rotate-y-180 backface-hidden rounded-[24px] p-2">
                    <div
                        className={cn(
                            'relative flex h-full items-center justify-center overflow-hidden rounded-[20px] border bg-card text-card-foreground shadow-sm',
                            card.isMatched
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/15'
                                : 'border-border'
                        )}
                    >
                        <span className="relative inline-flex translate-y-[-0.04em] items-center justify-center text-3xl leading-none font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                            {card.symbol}
                        </span>
                    </div>
                </div>
            </div>
        </button>
    )
}
