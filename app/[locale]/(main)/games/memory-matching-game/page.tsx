import { Metadata } from 'next'
import { Brain, Eye, Layers3 } from 'lucide-react'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import MemoryMatchingGame from './components/Game'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { useTranslations } from 'next-intl'
import { use } from 'react'
import { generateAlternates } from '@/lib/utils'
import { routing } from '@/i18n/routing'

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'games.memoryMatchingGame' })

    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
        keywords: t('metadata.keywords').split(',').map((keyword) => keyword.trim()),
        openGraph: {
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: [{ url: '/og/oglogo.png', width: 1200, height: 630 }],
        },
        alternates: generateAlternates(locale, 'games/memory-matching-game'),
    }
}

export default function MemoryMatchingGamePage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = use(params)
    setRequestLocale(locale)
    const t = useTranslations('games.memoryMatchingGame')

    return (
        <GamePageTemplate
            gameId="memory-matching-game"
            title={t('title')}
            subtitle={t('subtitle')}
            gameComponent={<MemoryMatchingGame />}
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
            leaderboardIntro={<p>{t('leaderboardNote')}</p>}
            benefits={[
                {
                    icon: <Brain className="w-10 h-10" />,
                    title: t('benefits.memory.title'),
                    description: t('benefits.memory.description'),
                },
                {
                    icon: <Eye className="w-10 h-10" />,
                    title: t('benefits.visual.title'),
                    description: t('benefits.visual.description'),
                },
                {
                    icon: <Layers3 className="w-10 h-10" />,
                    title: t('benefits.focus.title'),
                    description: t('benefits.focus.description'),
                },
            ]}
            science={{
                title: t('science.title'),
                description: t('science.description'),
                blogArticleUrl: '/working-memory-guide',
                blogArticleTitle: t('science.guideTitle'),
            }}
            faq={[
                {
                    question: t('faq.what.question'),
                    answer: t('faq.what.answer'),
                },
                {
                    question: t('faq.difficulty.question'),
                    answer: t('faq.difficulty.answer'),
                },
                {
                    question: t('faq.skills.question'),
                    answer: t('faq.skills.answer'),
                },
                {
                    question: t('faq.practice.question'),
                    answer: t('faq.practice.answer'),
                },
            ]}
            relatedGames={['block-memory-challenge', 'free-short-term-memory-test', 'schulte-table']}
            hasLeaderboard={true}
            leaderboardFormatterType="sec3"
        />
    )
}
