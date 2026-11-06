"use client";

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

function LoadingBoard() {
    const t = useTranslations('games.memoryMatchingGame.gameUI')
    return (
        <div className="rounded-[28px] border border-border bg-card px-6 py-14 text-center text-muted-foreground">
            {t('loading')}
        </div>
    )
}

const GameClient = dynamic(() => import('./GameClient'), {
    ssr: false,
    loading: () => <LoadingBoard />,
})

export default function Game() {
    return <GameClient />
}
