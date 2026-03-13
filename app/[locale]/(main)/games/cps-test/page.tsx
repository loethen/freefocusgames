import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { MousePointer2, Zap, Clock } from 'lucide-react'
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
    const t = await getTranslations({ locale, namespace: 'games.cpsTest' });

    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
        keywords: t('metadata.keywords'),
        openGraph: {
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
        },
        alternates: generateAlternates(locale, 'games/cps-test'),
    };
}

export default function CPSTestPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://freefocusgames.com";
    const t = useTranslations('games.cpsTest');
    const faq = [
        {
            question: t('faq.focus.question'),
            answer: t('faq.focus.answer'),
        },
        {
            question: t('faq.warmup.question'),
            answer: t('faq.warmup.answer'),
        },
        {
            question: t('faq.improve.question'),
            answer: t('faq.improve.answer'),
        },
        {
            question: t('faq.health.question'),
            answer: t('faq.health.answer'),
        },
        {
            question: t('faq.cpsMeaning.question'),
            answer: t('faq.cpsMeaning.answer'),
        },
        {
            question: t('faq.bestMode.question'),
            answer: t('faq.bestMode.answer'),
        },
    ];
    const structuredData = [
        {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": t('title'),
            "description": t('metadata.description'),
            "url": `${baseUrl}/games/cps-test`,
            "applicationCategory": "GameApplication",
            "operatingSystem": "Web Browser",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "featureList": [
                "1 second CPS test mode",
                "3 second CPS test mode",
                "5 second CPS test mode",
                "10 second click speed mode",
                "5 second CPS leaderboard"
            ],
            "educationalUse": "Reaction Speed Training",
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
            gameId="cps-test"
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
                    icon: <Clock className="w-10 h-10" />,
                    title: t('benefits.focus.title'),
                    description: t('benefits.focus.description'),
                },
                {
                    icon: <Zap className="w-10 h-10" />,
                    title: t('benefits.neural.title'),
                    description: t('benefits.neural.description'),
                },
                {
                    icon: <MousePointer2 className="w-10 h-10" />,
                    title: t('benefits.flow.title'),
                    description: t('benefits.flow.description'),
                },
            ]}
            science={{
                title: t('science.title'),
                description: t('science.description'),
                blogArticleUrl: locale === 'zh'
                    ? "/zh/blog/what-is-a-good-cps-test-score"
                    : "/blog/what-is-a-good-cps-test-score",
                blogArticleTitle: t('science.blogArticleTitle'),
            }}
            faq={faq}
            relatedGames={["reaction-time", "focus-reaction-test", "larger-number"]}
            hasLeaderboard={true}
            leaderboardFormatterType="cps"
            leaderboardMode="5s"
            leaderboardIntro={<p>{t('leaderboardNote')}</p>}
            structuredData={structuredData}
        />
    );
}
