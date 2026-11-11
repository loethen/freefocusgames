import { SITE_BASE_URL } from "@/lib/site-constants";
import type { Metadata } from 'next';
import { use } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import WhiteNoiseFlyover from './components/WhiteNoiseFlyover';
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
    const sounds = ['wind', 'stream', 'deep'] as const;
    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: t('heading'),
            description: t('metadata.description'),
            url: pageUrl,
            inLanguage: getLocaleMeta(locale).schema,
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
            howToPlay={
                <>
                    <p>{t('howToPlay.intro')}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>{t('howToPlay.steer')}</li>
                        <li>{t('howToPlay.keys')}</li>
                        <li>{t('howToPlay.river')}</li>
                        <li>{t('howToPlay.background')}</li>
                    </ul>
                </>
            }
            additionalContent={
                <div className="mx-auto max-w-3xl space-y-8 rounded-xl border border-border bg-muted/30 p-6">
                    <section>
                        <h2 className="mb-3 text-2xl font-semibold">{t('sounds.title')}</h2>
                        <dl className="space-y-3 text-lg leading-relaxed">
                            {sounds.map((id) => (
                                <div key={id}>
                                    <dt className="font-semibold">{t(`sounds.${id}.name`)}</dt>
                                    <dd className="text-muted-foreground">{t(`sounds.${id}.description`)}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                    <section>
                        <h2 className="mb-3 text-2xl font-semibold">{t('about.title')}</h2>
                        <p className="text-lg leading-relaxed text-muted-foreground">{t('about.description')}</p>
                    </section>
                </div>
            }
            relatedGames={['pomodoro-timer', 'resonance-breathing', 'box-breathing']}
            structuredData={structuredData}
        />
    );
}
