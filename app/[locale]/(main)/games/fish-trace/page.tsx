import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Eye, Focus, Target } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'

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
            images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
        }
    };
}

export default function FishTracePage() {
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
        />
    );
} 