import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Brain, Eye, Target } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { use } from 'react';
import { routing } from '@/i18n/routing';
import { generateAlternates } from '@/lib/utils';

// Generate static params for all locales
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

// 将静态元数据改为动态生成函数
export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'games.countingBoxes' });

    return {
        title: t('metaTitle'),
        description: t('metaDescription'),
        keywords: t('metaKeywords').split(',').map(keyword => keyword.trim()),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
        },
        alternates: generateAlternates(locale, 'games/counting-boxes'),
    };
}

export default function CountingBoxesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const t = useTranslations('games.countingBoxes');

    return (
        <GamePageTemplate
            gameBackground="bg-[#f5f5f5]"
            gameId="counting-boxes"
            title={t("title")}
            subtitle={t("subtitle")}
            gameComponent={<Game />}
            howToPlay={
                <>
                    <p>{t("howToPlayIntro")}</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>{t("howToPlay1")}</li>
                        <li>{t("howToPlay2")}</li>
                        <li>{t("howToPlay3")}</li>
                        <li>{t("howToPlay4")}</li>
                    </ul>
                </>
            }
            benefits={[
                {
                    icon: <Brain className="w-10 h-10" />,
                    title: t("benefits.workingMemory.title"),
                    description: t("benefits.workingMemory.description"),
                },
                {
                    icon: <Eye className="w-10 h-10" />,
                    title: t("benefits.visualTracking.title"),
                    description: t("benefits.visualTracking.description"),
                },
                {
                    icon: <Target className="w-10 h-10" />,
                    title: t("benefits.spatialMemory.title"),
                    description: t("benefits.spatialMemory.description"),
                },
            ]}
            faq={[
                {
                    question: t("faq.howToPlay.question"),
                    answer: t("faq.howToPlay.answer"),
                },
                {
                    question: t("faq.difficulty.question"),
                    answer: t("faq.difficulty.answer"),
                },
                {
                    question: t("faq.benefits.question"),
                    answer: t("faq.benefits.answer"),
                },
                {
                    question: t("faq.practice.question"),
                    answer: t("faq.practice.answer"),
                },
            ]}
            relatedGames={["block-memory-challenge", "schulte-table"]}
        />
    );
} 
