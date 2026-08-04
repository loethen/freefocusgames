'use client';

import { useLocale, useTranslations } from 'next-intl';

export default function BambooCicadaGame() {
    const locale = useLocale();
    const t = useTranslations('games.bambooCicada');
    const gameLocale = locale === 'zh' ? 'zh' : 'en';

    return (
        <div className="overflow-hidden rounded-lg bg-[#0a1028]">
            <iframe
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
