import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Brain, Target, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { use } from 'react'
import { generateAlternates } from '@/lib/utils'
import { routing } from '@/i18n/routing'

const coverImage = '/games/stroop-effect-cover.png';

// Generate static params for all locales
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'games.stroopEffectTest' });

    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
        keywords: t('metadata.keywords'),
        openGraph: {
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: [{ url: coverImage, width: 1200, height: 675, alt: t('title') }],
        },
        twitter: {
            card: 'summary_large_image',
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: [coverImage],
        },
        alternates: generateAlternates(locale, 'games/stroop-effect-test'),
    };
}

export default function StroopEffectTestPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const t = useTranslations('games.stroopEffectTest');

    return (
        <GamePageTemplate
            gameId="stroop-effect-test"
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
            leaderboardIntro={<p>{t('gameUI.leaderboardDescription')}</p>}
            benefits={[
                {
                    icon: <Brain className="w-10 h-10" />,
                    title: t('benefits.cognitiveFlexibility.title'),
                    description: t('benefits.cognitiveFlexibility.description'),
                },
                {
                    icon: <Target className="w-10 h-10" />,
                    title: t('benefits.selectiveAttention.title'),
                    description: t('benefits.selectiveAttention.description'),
                },
                {
                    icon: <Zap className="w-10 h-10" />,
                    title: t('benefits.conflictResolution.title'),
                    description: t('benefits.conflictResolution.description'),
                },
            ]}
            science={{
                title: t('science.title'),
                description: t('science.description'),
                blogArticleUrl: "/blog/the-science-of-stroop-effect-cognitive-flexibility-training",
                blogArticleTitle: t('science.blogArticleTitle'),
            }}
            faq={[
                {
                    question: t('faq.whatIsStroop.question'),
                    answer: t('faq.whatIsStroop.answer'),
                },
                {
                    question: t('faq.whyDifficult.question'),
                    answer: t('faq.whyDifficult.answer'),
                },
                {
                    question: t('faq.howToImprove.question'),
                    answer: t('faq.howToImprove.answer'),
                },
                {
                    question: t('faq.realWorldApps.question'),
                    answer: t('faq.realWorldApps.answer'),
                },
            ]}
            hasLeaderboard={true}
            leaderboardFormatterType="sec3"
        />
    );
} 
