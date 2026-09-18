import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Target, Zap, Brain } from 'lucide-react'
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
    const t = await getTranslations({ locale, namespace: 'games.focusReactionTest' });

    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
        keywords: t('metadata.keywords'),
        openGraph: {
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: [{ url: "/games/focus-reaction-test.png", width: 1200, height: 630 }],
        },
        alternates: generateAlternates(locale, 'games/focus-reaction-test'),
    };
}

export default function FocusReactionTestPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const t = useTranslations('games.focusReactionTest');

    return (
        <GamePageTemplate
            gameId="focus-reaction-test"
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
                    icon: <Target className="w-10 h-10" />,
                    title: t('benefits.selectiveAttention.title'),
                    description: t('benefits.selectiveAttention.description'),
                },
                {
                    icon: <Zap className="w-10 h-10" />,
                    title: t('benefits.processingSpeed.title'),
                    description: t('benefits.processingSpeed.description'),
                },
                {
                    icon: <Brain className="w-10 h-10" />,
                    title: t('benefits.executiveControl.title'),
                    description: t('benefits.executiveControl.description'),
                },
            ]}
            science={{
                title: t('science.title'),
                description: t('science.description'),
                blogArticleTitle: t('science.blogArticleTitle'),
                authorityLinks: [
                    {
                        title: "Eriksen Flanker Task Research",
                        url: "https://en.wikipedia.org/wiki/Flanker_task",
                        description: t('science.authorityLinks.eriksenTask')
                    },
                    {
                        title: "Selective Attention Studies",
                        url: "https://en.wikipedia.org/wiki/Selective_attention",
                        description: t('science.authorityLinks.selectiveAttention')
                    },
                    {
                        title: "Executive Control Research",
                        url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2770873/",
                        description: t('science.authorityLinks.executiveControl')
                    }
                ]
            }}
            faq={[
                {
                    question: t('faq.whatIsFlankerTask.question'),
                    answer: t('faq.whatIsFlankerTask.answer'),
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
                    question: t('faq.realWorldApplications.question'),
                    answer: t('faq.realWorldApplications.answer'),
                },
            ]}
            relatedGames={["reaction-time", "stroop-effect-test", "double-decision"]}
        />
    );
}
