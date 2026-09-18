import { SITE_BASE_URL } from "@/lib/site-constants";
import { Metadata } from 'next'
import { use } from 'react'
import { Keyboard, Gauge, TimerReset } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { generateAlternates } from '@/lib/utils'
import { routing } from '@/i18n/routing'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import Game from './components/Game'

const coverImage = '/games/spacebar-clicker-cover.png';

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'games.spacebarClicker' });

    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
        keywords: t('metadata.keywords'),
        openGraph: {
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: [{
                url: coverImage,
                width: 1200,
                height: 675,
                alt: t('title'),
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: [coverImage],
        },
        alternates: generateAlternates(locale, 'games/spacebar-clicker'),
    };
}

export default function SpacebarClickerPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const baseUrl = SITE_BASE_URL;
    const t = useTranslations('games.spacebarClicker');

    const faq = [
        {
            question: t('faq.measure.question'),
            answer: t('faq.measure.answer'),
        },
        {
            question: t('faq.keyboard.question'),
            answer: t('faq.keyboard.answer'),
        },
        {
            question: t('faq.mobile.question'),
            answer: t('faq.mobile.answer'),
        },
        {
            question: t('faq.cps.question'),
            answer: t('faq.cps.answer'),
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
            "url": `${baseUrl}/games/spacebar-clicker`,
            "image": `${baseUrl}${coverImage}`,
            "applicationCategory": "GameApplication",
            "operatingSystem": "Web Browser",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "featureList": [
                "5 second spacebar speed test",
                "10 second spacebar speed test",
                "30 second spacebar endurance test",
                "Keyboard and touch support",
                "Local best score tracking"
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
            gameId="spacebar-clicker"
            title={t('title')}
            subtitle={t('subtitle')}
            gameComponent={<Game />}
            howToPlay={
                <>
                    <p>{t('howToPlay.description')}</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>{t('howToPlay.step1')}</li>
                        <li>{t('howToPlay.step2')}</li>
                        <li>{t('howToPlay.step3')}</li>
                        <li>{t('howToPlay.step4')}</li>
                    </ul>
                </>
            }
            benefits={[
                {
                    icon: <Keyboard className="w-10 h-10" />,
                    title: t('benefits.rhythm.title'),
                    description: t('benefits.rhythm.description'),
                },
                {
                    icon: <Gauge className="w-10 h-10" />,
                    title: t('benefits.burst.title'),
                    description: t('benefits.burst.description'),
                },
                {
                    icon: <TimerReset className="w-10 h-10" />,
                    title: t('benefits.reset.title'),
                    description: t('benefits.reset.description'),
                },
            ]}
            science={{
                title: t('science.title'),
                description: t('science.description'),
                blogArticleUrl: "/blog/what-is-a-good-cps-test-score",
                blogArticleTitle: t('science.blogArticleTitle'),
            }}
            faq={faq}
            relatedGames={["cps-test", "reaction-time", "challenge10Seconds"]}
            hasLeaderboard={true}
            leaderboardFormatterType="cps"
            leaderboardMode="10s"
            leaderboardIntro={<p>{t('leaderboardNote')}</p>}
            structuredData={structuredData}
        />
    );
}
