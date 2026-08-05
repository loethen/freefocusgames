import type { Metadata } from 'next';
import { use } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import BambooCicadaGame from './components/BambooCicadaGame';
import { GamePageTemplate } from '@/components/GamePageTemplate';
import { generateAlternates } from '@/lib/utils';
import { routing } from '@/i18n/routing';

const UPSTREAM_URL = 'https://github.com/imsai-sh/zhuzhiliao';

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'games.bambooCicada' });

    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
        keywords: t('metadata.keywords'),
        openGraph: {
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            type: 'website',
            locale: locale === 'zh' ? 'zh_CN' : 'en_US',
            images: [{
                url: '/games/bamboo-cicada/preview.jpg',
                width: 1200,
                height: 630,
                alt: t('heading'),
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: ['/games/bamboo-cicada/preview.jpg'],
        },
        alternates: generateAlternates(locale, 'games/bamboo-cicada'),
    };
}

export default function BambooCicadaPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const t = useTranslations('games.bambooCicada');
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://freefocusgames.com';
    const localePrefix = locale === 'en' ? '' : `/${locale}`;
    const pageUrl = `${baseUrl}${localePrefix}/games/bamboo-cicada`;
    const faq = [
        { question: t('faq.what.question'), answer: t('faq.what.answer') },
        { question: t('faq.sound.question'), answer: t('faq.sound.answer') },
        { question: t('faq.motion.question'), answer: t('faq.motion.answer') },
        { question: t('faq.model.question'), answer: t('faq.model.answer') },
    ];
    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': ['WebApplication', 'VideoGame'],
            name: t('heading'),
            alternateName: t('title'),
            description: t('metadata.description'),
            url: pageUrl,
            inLanguage: locale === 'zh' ? 'zh-CN' : 'en',
            applicationCategory: 'GameApplication',
            operatingSystem: 'Web Browser',
            gamePlatform: ['Web Browser', 'Mobile', 'Desktop'],
            playMode: 'SinglePlayer',
            isAccessibleForFree: true,
            offers: {
                '@type': 'Offer',
                price: 0,
                priceCurrency: 'USD',
            },
            image: `${baseUrl}/games/bamboo-cicada/preview.jpg`,
            isBasedOn: UPSTREAM_URL,
        },
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            inLanguage: locale === 'zh' ? 'zh-CN' : 'en',
            mainEntity: faq.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
        },
    ];

    return (
        <GamePageTemplate
            gameId="bamboo-cicada"
            title={t('heading')}
            subtitle={t('subtitle')}
            gameComponent={<BambooCicadaGame />}
            gameBackground="bg-[#0a1028]"
            howToPlay={
                <>
                    <p>{t('howToPlay.intro')}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>{t('howToPlay.pointer')}</li>
                        <li>{t('howToPlay.auto')}</li>
                        <li>{t('howToPlay.motion')}</li>
                        <li>{t('howToPlay.model')}</li>
                    </ul>
                    <p>
                        {t('credit.prefix')}{' '}
                        <a
                            href={UPSTREAM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary underline underline-offset-4"
                        >
                            imsai-sh/zhuzhiliao
                        </a>
                        {t('credit.suffix')}
                    </p>
                </>
            }
            additionalContent={
                <div className="mx-auto max-w-3xl rounded-xl border border-border bg-muted/30 p-6">
                    <h2 className="mb-3 text-2xl font-semibold">
                        {t('about.title')}
                    </h2>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                        {t('about.description')}
                    </p>
                </div>
            }
            hasLeaderboard={true}
            leaderboardTitle={t('leaderboard.title')}
            leaderboardFormatterType="wahs"
            leaderboardMode="lifetime"
            leaderboardIntro={<p>{t('leaderboard.description')}</p>}
            faq={faq}
            relatedGames={['challenge10Seconds', 'spacebar-clicker', 'cps-test']}
            structuredData={structuredData}
        />
    );
}
