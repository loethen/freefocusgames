'use client';

import dynamic from 'next/dynamic'
import { NextIntlClientProvider, useMessages, useLocale, useTranslations } from 'next-intl';

function GameLoadingState() {
    const t = useTranslations('games.dualNBack.loading');

    return (
        <div className="mx-auto flex min-h-[420px] w-full max-w-4xl items-center justify-center rounded-2xl border bg-muted/30 p-6 text-center">
            <div className="max-w-xl">
                <h2 className="mb-3 text-2xl font-semibold">
                    {t('title')}
                </h2>
                <p className="mb-3 text-sm leading-6 text-muted-foreground sm:text-base">
                    {t('description')}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                    {t('tip')}
                </p>
            </div>
        </div>
    );
}

// Dynamically import the game component to prevent SSR issues
const GameComponent = dynamic(() => import('./GameComponent'), {
    ssr: false, // Disable server-side rendering
    loading: GameLoadingState
});

export default function Game() {
    // 获取当前语言和消息
    const locale = useLocale();
    const messages = useMessages();
    
    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <GameComponent />
        </NextIntlClientProvider>
    );
} 
