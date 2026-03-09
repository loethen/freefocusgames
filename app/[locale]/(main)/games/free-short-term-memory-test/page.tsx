import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Brain, TrendingUp, Users, BookOpen } from 'lucide-react'
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
    const t = await getTranslations({ locale, namespace: 'games.freeShortTermMemoryTest' });

    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
        keywords: t('metadata.keywords'),
        openGraph: {
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
        },
        alternates: generateAlternates(locale, 'games/free-short-term-memory-test'),
    };
}

export default function FreeShortTermMemoryTestPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const t = useTranslations('games.freeShortTermMemoryTest');
    const tCommon = useTranslations('common');

    return (
        <GamePageTemplate
            gameId="free-short-term-memory-test"
            title={t('title')}
            subtitle={t('subtitle')}
            gameComponent={<Game />}
            howToPlay={
                <>
                    <Link href="/working-memory-guide" className="block mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors group">
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium text-primary">
                                {tCommon('learnMoreAboutWorkingMemory')}
                            </span>
                        </div>
                    </Link>
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
                        <li>
                            {t('howToPlay.step5')}
                        </li>
                    </ul>
                </>
            }
            benefits={[
                {
                    icon: <Brain className="w-10 h-10" />,
                    title: t('benefits.assessment.title'),
                    description: t('benefits.assessment.description'),
                },
                {
                    icon: <TrendingUp className="w-10 h-10" />,
                    title: t('benefits.tracking.title'),
                    description: t('benefits.tracking.description'),
                },
                {
                    icon: <Users className="w-10 h-10" />,
                    title: t('benefits.comparison.title'),
                    description: t('benefits.comparison.description'),
                },
            ]}
            faq={[
                {
                    question: t('faq.what.question'),
                    answer: t('faq.what.answer'),
                },
                {
                    question: t('faq.howLong.question'),
                    answer: t('faq.howLong.answer'),
                },
                {
                    question: t('faq.scoring.question'),
                    answer: t('faq.scoring.answer'),
                },
                {
                    question: t('faq.accuracy.question'),
                    answer: t('faq.accuracy.answer'),
                },
                {
                    question: t('faq.improve.question'),
                    answer: t('faq.improve.answer'),
                },
            ]}
            relatedGames={[
                'dual-n-back',
                'mahjong-dual-n-back',
                'block-memory-challenge',
                'frog-memory-leap'
            ]}
        />
    );
} 
