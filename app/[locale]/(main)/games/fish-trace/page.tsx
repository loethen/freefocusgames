import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Eye, Focus, Target } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { use } from 'react'
import { routing } from '@/i18n/routing'
import { generateAlternates } from '@/lib/utils'

const coverImage = '/games/fish-trace-cover.png';

// Generate static params for all locales
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'games.fishTrace' });

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
        alternates: generateAlternates(locale, 'games/fish-trace'),
        other: {
            'script:ld+json': JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": t('title'),
                "description": t('metadata.description'),
                "url": `https://www.freefocusgames.com${locale === 'en' ? '' : `/${locale}`}/games/fish-trace`,
                "image": `https://www.freefocusgames.com${coverImage}`,
                "applicationCategory": "GameApplication",
                "operatingSystem": "Web Browser",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                }
            })
        },
    };
}

export default function FishTracePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const t = useTranslations('games.fishTrace');

    return (
        <GamePageTemplate
            gameId="fish-trace"
            title={t('title')}
            subtitle={t('subtitle')}
            gameComponent={<Game />}
            howToPlay={
                <>
                    <p>
                        {t('howToPlay.intro')}
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
                    icon: <Eye className="w-10 h-10" />,
                    title: t('benefits.visualTracking.title'),
                    description: t('benefits.visualTracking.description'),
                },
                {
                    icon: <Focus className="w-10 h-10" />,
                    title: t('benefits.sustainedAttention.title'),
                    description: t('benefits.sustainedAttention.description'),
                },
                {
                    icon: <Target className="w-10 h-10" />,
                    title: t('benefits.selectiveAttention.title'),
                    description: t('benefits.selectiveAttention.description'),
                },
            ]}
            faq={[
                {
                    question: t('faq.visualTracking.question'),
                    answer: t('faq.visualTracking.answer'),
                },
                {
                    question: t('faq.children.question'),
                    answer: t('faq.children.answer'),
                },
                {
                    question: t('faq.trainingDuration.question'),
                    answer: t('faq.trainingDuration.answer'),
                },
                {
                    question: t('faq.readingDifficulties.question'),
                    answer: t('faq.readingDifficulties.answer'),
                },
            ]}
            relatedGames={["frog-memory-leap", "schulte-table", "block-memory-challenge"]}
            hasLeaderboard={true}
            leaderboardFormatterType="pts"
        />
    );
} 
