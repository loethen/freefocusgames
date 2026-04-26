import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { use } from 'react'
import { generateAlternates } from '@/lib/utils'
import { routing } from '@/i18n/routing'

// Generate static params for all locales
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'games.challenge10Seconds' });

    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
        keywords: t('metadata.keywords'),
        openGraph: {
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
        },
        alternates: generateAlternates(locale, 'games/challenge-10-seconds'),
    };
}

export default function Challenge10SecondsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://freefocusgames.com";
    const localePrefix = locale === 'en' ? '' : `/${locale}`;
    const pageUrl = `${baseUrl}${localePrefix}/games/challenge-10-seconds`;
    const t = useTranslations('games.challenge10Seconds');
    const faq = [
        {
            question: t('faq.what.question'),
            answer: t('faq.what.answer'),
        },
        {
            question: t('faq.trick.question'),
            answer: t('faq.trick.answer'),
        },
        {
            question: t('faq.machine.question'),
            answer: t('faq.machine.answer'),
        },
        {
            question: t('faq.reaction.question'),
            answer: t('faq.reaction.answer'),
        },
        {
            question: t('faq.impossible.question'),
            answer: t('faq.impossible.answer'),
        },
        {
            question: t('faq.latency.question'),
            answer: t('faq.latency.answer'),
        },
    ];
    const structuredData = [
        {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": t('title'),
            "description": t('metadata.description'),
            "url": pageUrl,
            "applicationCategory": "GameApplication",
            "operatingSystem": "Web Browser",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "featureList": [
                "10 second challenge online",
                "Stop the timer at exactly 10 seconds",
                "10 second timer challenge game",
                "Closest to 10 seconds leaderboard",
                "Keyboard and click controls"
            ],
            "learningResourceType": "Interactive Game",
            "interactivityType": "active"
        },
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faq.map((item) => ({
                "@type": "Question",
                "name": item.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": item.answer
                }
            }))
        }
    ];

    return (
        <GamePageTemplate
            gameId="challenge10Seconds"
            title={t('title')}
            subtitle={t('subtitle')}
            gameComponent={<Game />}
            howToPlay={
                <>
                    <p>
                        {t('howToPlay.description')}
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>
                            {t('howToPlay.step1')}
                        </li>
                        <li>
                            {t('howToPlay.step2')}
                        </li>
                        <li>
                            {t('howToPlay.step3')}
                        </li>
                        <li>
                            {t('howToPlay.step4')}
                        </li>
                    </ul>
                </>
            }
            benefits={[
                {
                    icon: <div className="text-4xl mb-2">⏱️</div>,
                    title: t('benefits.perception.title'),
                    description: t('benefits.perception.description')
                },
                {
                    icon: <div className="text-4xl mb-2">🎯</div>,
                    title: t('benefits.anticipation.title'),
                    description: t('benefits.anticipation.description')
                },
                {
                    icon: <div className="text-4xl mb-2">🧠</div>,
                    title: t('benefits.focus.title'),
                    description: t('benefits.focus.description')
                }
            ]}
            science={{
                title: t('science.title'),
                description: t('science.description'),
                blogArticleTitle: t('science.blogArticleTitle'),
                blogArticleUrl: "/blog/10-seconds-challenge-viral-game"
            }}
            faq={faq}
            relatedGames={["reaction-time", "spacebar-clicker", "cps-test"]}
            hasLeaderboard={true}
            leaderboardFormatterType="sec4"
            leaderboardIntro={<p>{t('gameUI.leaderboardDescription')}</p>}
            structuredData={structuredData}
        />
    );
}
