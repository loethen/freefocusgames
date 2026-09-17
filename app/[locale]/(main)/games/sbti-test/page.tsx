import { Metadata } from 'next';
import { use } from 'react';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { GamePageTemplate } from '@/components/GamePageTemplate';
import { routing } from '@/i18n/routing';
import { generateAlternates } from '@/lib/utils';
import Game from './components/Game';
import SbtiTypeLeaderboard from './components/SbtiTypeLeaderboard';

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'sbtiTest' });

    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
        keywords: t('metadata.keywords').split(',').map((keyword) => keyword.trim()),
        openGraph: {
            title: t('metadata.title'),
            description: t('metadata.description'),
            images: [{ url: '/games/sbti-test/image/CTRL.png', width: 1200, height: 630 }],
        },
        alternates: generateAlternates(locale, 'games/sbti-test'),
    };
}

export default function SbtiTestPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);

    const t = useTranslations('sbtiTest');
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.freefocusgames.com';
    const localePrefix = locale === 'en' ? '' : `/${locale}`;
    const pageUrl = `${baseUrl}${localePrefix}/games/sbti-test`;

    const faqItems = [
        {
            question: t('faq.what.question'),
            answer: t('faq.what.answer'),
        },
        {
            question: t('faq.entry.question'),
            answer: t('faq.entry.answer'),
        },
        {
            question: t('faq.vsMbti.question'),
            answer: t('faq.vsMbti.answer'),
        },
        {
            question: t('faq.whyTrending.question'),
            answer: t('faq.whyTrending.answer'),
        },
        {
            question: t('faq.reliable.question'),
            answer: t('faq.reliable.answer'),
        },
        {
            question: t('faq.mobile.question'),
            answer: t('faq.mobile.answer'),
        },
    ];

    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: t('title'),
            description: t('metadata.description'),
            url: pageUrl,
            applicationCategory: 'GameApplication',
            operatingSystem: 'Web Browser',
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
            },
            featureList: Array.isArray(t.raw('structuredData.featureList'))
                ? t.raw('structuredData.featureList')
                : [],
            learningResourceType: 'Interactive Quiz',
            interactivityType: 'active',
        },
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.answer,
                },
            })),
        },
    ];

    return (
        <GamePageTemplate
            gameId="sbti-test"
            title={t('title')}
            subtitle={t('subtitle')}
            gameBackground="bg-muted/40"
            gameComponent={<Game />}
            howToPlay={
                <>
                    <p>{t('guide.description')}</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>{t('guide.step1')}</li>
                        <li>{t('guide.step2')}</li>
                        <li>{t('guide.step3')}</li>
                        <li>{t('guide.step4')}</li>
                    </ul>
                    <p>{t('hero.disclaimer')}</p>
                    <p>{t('credits.originalAuthor')}</p>
                </>
            }
            leaderboardIntro={<p>{t('leaderboard.description')}</p>}
            leaderboardComponent={<SbtiTypeLeaderboard />}
            faq={faqItems}
            relatedGames={['cps-test', 'stroop-effect-test', 'spacebar-clicker']}
            structuredData={structuredData}
        />
    );
}
