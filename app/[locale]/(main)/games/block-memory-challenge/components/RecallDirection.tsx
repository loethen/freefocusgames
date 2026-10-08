'use client'

import { gameTabClass, gameTabsClass } from '@/lib/game-tab-styles'
import { createContext, useContext, useId, useState, type ReactNode } from 'react'
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

export function RecallDirectionToggle({ disabled = false, variant = 'tabs' }: { disabled?: boolean; variant?: 'tabs' | 'radio' }) {
    const t = useTranslations('games.blockMemoryChallenge.gameUI')
    const { direction, setDirection } = useRecallDirection()
    const groupId = useId()

    if (variant === 'radio') {
        return (
            <fieldset disabled={disabled} className="w-full disabled:opacity-50">
                <legend className="mb-2 text-sm text-muted-foreground">{t('directionLabel')}</legend>
                <div className="grid grid-cols-2 gap-4">
                    {(['forward', 'backward'] as const).map((option) => (
                        <label key={option} className={cn('flex min-h-11 items-center gap-2.5 text-sm',
                            disabled ? 'cursor-default' : 'cursor-pointer',
                            direction === option ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                            <input type="radio" name={groupId} value={option} checked={direction === option}
                                onChange={() => setDirection(option)}
                                className="h-4 w-4 shrink-0 accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                            {t(option)}
                        </label>
                    ))}
                </div>
            </fieldset>
        )
    }

    return (
        <div className="flex w-full max-w-[280px] items-center justify-between gap-3" role="group" aria-label={t('directionLabel')}>
            <span className="text-sm text-muted-foreground">{t('directionLabel')}</span>
            <div className={cn("flex shrink-0 items-center gap-1 rounded-lg p-1", gameTabsClass)}>
                {(['forward', 'backward'] as const).map((option) => (
                    <Button key={option} type="button" variant="ghost" disabled={disabled}
                        aria-pressed={direction === option} onClick={() => setDirection(option)}
                        className={cn('h-9 px-3 font-normal', gameTabClass(direction === option),
                            direction === option && 'font-medium')}>
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
