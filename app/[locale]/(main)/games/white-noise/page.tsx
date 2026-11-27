import { SITE_BASE_URL } from "@/lib/site-constants";
import type { Metadata } from 'next';
import { use } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import WhiteNoiseFlyover from './components/WhiteNoiseFlyover';
import WhiteNoiseExplore from './components/WhiteNoiseExplore';
import { GamePageTemplate } from '@/components/GamePageTemplate';
import { generateAlternates } from '@/lib/utils';
import { pageLocaleParams } from '@/lib/locale-availability';
import { getLocaleMeta } from '@/lib/locale-meta';

const coverImage = '/games/white-noise-cover.png';

export function generateStaticParams() {
    return pageLocaleParams('games/white-noise');
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'games.whiteNoise' });

    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
        keywords: t('metadata.keywords'),
        openGraph: {
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            type: 'website',
            locale: getLocaleMeta(locale).openGraph,
            images: [{ url: coverImage, width: 1200, height: 675, alt: t('heading') }],
        },
        twitter: {
            card: 'summary_large_image',
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: [coverImage],
        },
        alternates: generateAlternates(locale, 'games/white-noise'),
    };
}

export default function WhiteNoisePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const t = useTranslations('games.whiteNoise');
    const localePrefix = locale === 'en' ? '' : `/${locale}`;
    const pageUrl = `${SITE_BASE_URL}${localePrefix}/games/white-noise`;
    const schemaLang = getLocaleMeta(locale).schema;
    const sounds = ['wind', 'stream', 'deep'] as const;
    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: t('heading'),
            description: t('metadata.description'),
            url: pageUrl,
            inLanguage: schemaLang,
            applicationCategory: 'MultimediaApplication',
            operatingSystem: 'Web Browser',
            isAccessibleForFree: true,
            offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
            image: `${SITE_BASE_URL}${coverImage}`,
            featureList: sounds.map((id) => t(`sounds.${id}.name`)).join(', '),
        },
    ];

    return (
        <GamePageTemplate
            gameId="white-noise"
            title={t('heading')}
            subtitle={t('subtitle')}
            gameComponent={<WhiteNoiseFlyover />}
            frameless
            hideShare
            belowGameContent={<WhiteNoiseExplore />}
            structuredData={structuredData}
        />
    );
}
