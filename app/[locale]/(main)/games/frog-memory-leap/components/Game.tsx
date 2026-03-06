'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

function Loading() {
    const t = useTranslations('games.frogMemoryLeap.gameUI');
    return (
        <div className="w-full h-full flex items-center justify-center">
            <div>{t('loading')}</div>
        </div>
    );
}

const GameComponent = dynamic(() => import('./GameComponent'), {
    ssr: false,
    loading: Loading,
});

export default function Game() {
    return (
        <div className="max-w-3xl mx-auto aspect-4/3">
            <GameComponent />
        </div>
    );
}