"use client";

import dynamic from 'next/dynamic'

const GameClient = dynamic(() => import('./GameClient'), {
    ssr: false,
    loading: () => (
        <div className="rounded-[28px] border border-border bg-card px-6 py-14 text-center text-muted-foreground">
            Loading memory board...
        </div>
    ),
})

export default function Game() {
    return <GameClient />
}
