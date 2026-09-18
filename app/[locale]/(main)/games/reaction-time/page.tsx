import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Zap, BrainCircuit, Gauge } from 'lucide-react'
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
    const t = await getTranslations({ locale, namespace: 'games.reactionTime' });

    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
        keywords: t('metadata.keywords'),
        openGraph: {
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
        },
        alternates: generateAlternates(locale, 'games/reaction-time'),
    };
}

export default function ReactionTimePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const t = useTranslations('games.reactionTime');

    return (
        <GamePageTemplate
            gameId="reaction-time"
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
                    icon: <Zap className="w-10 h-10" />,
                    title: t('benefits.measure.title'),
                    description: t('benefits.measure.description'),
                },
                {
                    icon: <BrainCircuit className="w-10 h-10" />,
                    title: t('benefits.baseline.title'),
                    description: t('benefits.baseline.description'),
                },
                {
                    icon: <Gauge className="w-10 h-10" />,
                    title: t('benefits.consistency.title'),
                    description: t('benefits.consistency.description'),
                },
            ]}
            faq={[
                {
                    question: t('faq.what.question'),
                    answer: t('faq.what.answer'),
                },
                {
                    question: t('faq.limitations.question'),
                    answer: t('faq.limitations.answer'),
                },
                {
                    question: t('faq.factors.question'),
                    answer: t('faq.factors.answer'),
                },
                {
                    question: t('faq.significance.question'),
                    answer: t('faq.significance.answer'),
                },
            ]}
            science={{
                title: t('science.title'),
                description: t('science.description'),
                blogArticleUrl: '/blog/how-to-improve-reaction-time',
                blogArticleTitle: t('science.blogArticleTitle'),
            }}
            relatedGames={['challenge10Seconds', 'cps-test', 'spacebar-clicker']}
            hasLeaderboard={true}
            leaderboardFormatterType="ms"
        />
    );
} 
