'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { LeaderboardDisplay } from '@/components/leaderboard-display'
import { cn } from '@/lib/utils'
import { blockMemoryLeaderboardMode, type BlockMemoryDirection } from '@/lib/block-memory-game'

const DirectionContext = createContext<{
    direction: BlockMemoryDirection
    setDirection: (direction: BlockMemoryDirection) => void
} | null>(null)

export function RecallDirectionProvider({ children }: { children: ReactNode }) {
    const [direction, setDirection] = useState<BlockMemoryDirection>('forward')
    return <DirectionContext.Provider value={{ direction, setDirection }}>{children}</DirectionContext.Provider>
}

export function useRecallDirection() {
    const context = useContext(DirectionContext)
    if (!context) throw new Error('Recall direction requires its provider')
    return context
}

export function RecallDirectionToggle({ disabled = false }: { disabled?: boolean }) {
    const t = useTranslations('games.blockMemoryChallenge.gameUI')
    const { direction, setDirection } = useRecallDirection()
    return (
        <div className="flex w-full max-w-[280px] items-center justify-between gap-3" role="group" aria-label={t('directionLabel')}>
            <span className="text-sm text-muted-foreground">{t('directionLabel')}</span>
            <div className="flex shrink-0 items-center gap-1">
                {(['forward', 'backward'] as const).map((option) => (
                    <Button key={option} type="button" variant="ghost" disabled={disabled}
                        aria-pressed={direction === option} onClick={() => setDirection(option)}
                        className={cn('h-9 px-3 font-normal shadow-none text-muted-foreground',
                            direction === option && 'bg-foreground/10 font-medium text-foreground hover:bg-foreground/10')}>
                        {t(option)}
                    </Button>
                ))}
            </div>
        </div>
    )
}

export function BlockMemoryLeaderboard() {
    const { direction } = useRecallDirection()
    const mode = blockMemoryLeaderboardMode(direction)
    return (
        <div className="space-y-4">
            <RecallDirectionToggle />
            <LeaderboardDisplay key={mode} gameId="block-memory-challenge" formatterType="steps" mode={mode} />
        </div>
    )
}
