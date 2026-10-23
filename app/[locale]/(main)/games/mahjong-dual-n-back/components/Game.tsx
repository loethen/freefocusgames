'use client';

import dynamic from 'next/dynamic'
import { NextIntlClientProvider, useMessages, useLocale } from 'next-intl';

// Dynamically import the game component to prevent SSR issues
const GameComponent = dynamic(() => import('./GameComponent'), {
    ssr: false, // Disable server-side rendering
    loading: () => (
        <div className="w-full h-full flex items-center justify-center text-white">
            <div>Loading game...</div>
        </div>
    )
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