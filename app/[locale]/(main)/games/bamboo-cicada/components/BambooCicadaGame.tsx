'use client';

import { useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { submitScoreToLeaderboard } from '@/lib/leaderboard';

export default function BambooCicadaGame() {
    const locale = useLocale();
    const t = useTranslations('games.bambooCicada');
    const gameLocale = locale === 'zh' ? 'zh' : 'en';
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSubmittedCountRef = useRef(0);

    useEffect(() => {
        const submitCount = (count: number) => {
            if (count <= lastSubmittedCountRef.current) return;
            lastSubmittedCountRef.current = count;
            void submitScoreToLeaderboard('bamboo-cicada', count, { mode: 'lifetime' });
        };

        const handleMessage = (event: MessageEvent) => {
            if (
                event.origin !== window.location.origin ||
                event.source !== iframeRef.current?.contentWindow
            ) {
                return;
            }

            const data = event.data as {
                count?: unknown;
                reason?: unknown;
                type?: unknown;
            } | null;
            if (
                !data ||
                data.type !== 'bamboo-cicada:wah-count' ||
                !Number.isInteger(data.count) ||
                (data.count as number) <= 0
            ) {
                return;
            }

            const count = data.count as number;
            if (submitTimerRef.current) clearTimeout(submitTimerRef.current);

            // Save a checkpoint during long continuous swings; otherwise wait
            // briefly for the player to stop so one burst creates one request.
            if (count - lastSubmittedCountRef.current >= 10) {
                submitCount(count);
                return;
            }

            submitTimerRef.current = setTimeout(
                () => submitCount(count),
                data.reason === 'ready' ? 2500 : 1500
            );
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
            if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
        };
    }, []);

    return (
        <div className="overflow-hidden rounded-lg bg-[#0a1028]">
            <iframe
                ref={iframeRef}
                key={gameLocale}
                src={`/embedded/bamboo-cicada/index.html?lang=${gameLocale}`}
                title={t('iframeTitle')}
                allow="accelerometer; autoplay; gyroscope"
                className="block h-[72svh] min-h-[520px] max-h-[760px] w-full border-0 sm:min-h-[600px]"
                loading="eager"
            />
        </div>
    );
}
