import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Brain, Layers, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { use } from 'react'
import { routing } from '@/i18n/routing'
import { generateAlternates } from '@/lib/utils'

// Generate static params for all locales
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'games.mahjongDualNBack' });

    return {
        title: t('metaTitle'),
        description: t('metaDescription'),
        keywords: t('metaKeywords').split(',').map(keyword => keyword.trim()).join(', '),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
        },
        alternates: generateAlternates(locale, 'games/mahjong-dual-n-back'),
    };
}

export default function MahjongDualNBackPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const t = useTranslations('games.mahjongDualNBack');

    return (
        <GamePageTemplate
            gameBackground="bg-[radial-gradient(circle,#019295_0%,#046A66_100%)]"
            gameId="mahjong-dual-n-back"
            title={t('title')}
            subtitle={t('subtitle')}
            gameComponent={<Game />}
            howToPlay={
                <>
                    <p>
                        {t('howToPlayIntro')}
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>
                            {t('howToPlay1')}
                        </li>
                        <li>
                            {t('howToPlay2')}
                        </li>
                        <li>
                            {t('howToPlay3')}
                        </li>
                        <li>
                            {t('howToPlay4')}
                        </li>
                        <li>
                            {t('howToPlay5')}
                        </li>
                        <li>
                            {t('howToPlay6')}
                        </li>
                    </ul>
                </>
            }
            benefits={[
                {
                    icon: <Brain className="w-10 h-10" />,
                    title: t('benefits.workingMemory.title'),
                    description: t('benefits.workingMemory.description'),
                },
                {
                    icon: <Layers className="w-10 h-10" />,
                    title: t('benefits.fluidIntelligence.title'),
                    description: t('benefits.fluidIntelligence.description'),
                },
                {
                    icon: <Zap className="w-10 h-10" />,
                    title: t('benefits.attentionControl.title'),
                    description: t('benefits.attentionControl.description'),
                },
            ]}
            faq={[
                {
                    question: t('faq.science.question'),
                    answer: t('faq.science.answer'),
                },
                {
                    question: t('faq.difference.question'),
                    answer: t('faq.difference.answer'),
                },
                {
                    question: t('faq.practice.question'),
                    answer: t('faq.practice.answer'),
                },
                {
                    question: t('faq.improvements.question'),
                    answer: t('faq.improvements.answer'),
                },
                {
                    question: t('faq.knowledge.question'),
                    answer: t('faq.knowledge.answer'),
                },
            ]}
            relatedGames={["dual-n-back", "block-memory-challenge"]}
        />
    );
} 
