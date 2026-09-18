import { Metadata } from 'next'
import PomodoroTimer from './components/PomodoroTimer'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Brain, Coffee, BarChart3, Clock } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { use } from 'react';
import { generateAlternates } from '@/lib/utils';
import { routing } from '@/i18n/routing';

const coverImage = '/games/pomodoro-timer-cover.png';

// Generate static params for all locales
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'games' });

    return {
        title: t('pomodoroTimer.metaTitle'),
        description: t('pomodoroTimer.metaDescription'),
        keywords: t('pomodoroTimer.metaKeywords').split(',').map(keyword => keyword.trim()),
        openGraph: {
            title: t('pomodoroTimer.ogTitle'),
            description: t('pomodoroTimer.ogDescription'),
            images: [{
                url: coverImage,
                width: 1200,
                height: 675,
                alt: t('pomodoroTimer.title'),
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title: t('pomodoroTimer.ogTitle'),
            description: t('pomodoroTimer.ogDescription'),
            images: [coverImage],
        },
        alternates: generateAlternates(locale, 'games/pomodoro-timer'),
    };
}

export default function PomodoroTimerPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const t = useTranslations('games');
    const benefitsT = useTranslations('games.pomodoroTimer.benefits');
    const faqT = useTranslations('games.pomodoroTimer.faq');

    return (
        <GamePageTemplate
            gameId="pomodoro-timer"
            title={t("pomodoroTimer.title")}
            subtitle={t("pomodoroTimer.subtitle")}
            gameComponent={
                <div className="relative">
                    <PomodoroTimer />
                </div>
            }
            howToPlay={
                <>
                    <p>{t("pomodoroTimer.howToPlay.step1")}</p>
                    <p className="mt-2">{t("pomodoroTimer.howToPlay.step2")}</p>
                    <p className="mt-2">{t("pomodoroTimer.howToPlay.step3")}</p>
                    <p className="mt-2">{t("pomodoroTimer.howToPlay.step4")}</p>

                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">{t("pomodoroTimer.howToPlay.defaultSettings.title")}</h4>
                        <ul className="text-sm space-y-1 list-disc pl-5">
                            <li>{t("pomodoroTimer.howToPlay.defaultSettings.focus")}</li>
                            <li>{t("pomodoroTimer.howToPlay.defaultSettings.shortBreak")}</li>
                            <li>{t("pomodoroTimer.howToPlay.defaultSettings.longBreak")}</li>
                            <li>{t("pomodoroTimer.howToPlay.defaultSettings.cycle")}</li>
                        </ul>
                    </div>
                </>
            }
            benefits={[
                {
                    icon: <Brain className="w-10 h-10" />,
                    title: benefitsT("focusImprovement.title"),
                    description: benefitsT("focusImprovement.description"),
                },
                {
                    icon: <Clock className="w-10 h-10" />,
                    title: benefitsT("timeManagement.title"),
                    description: benefitsT("timeManagement.description"),
                },
                {
                    icon: <Coffee className="w-10 h-10" />,
                    title: benefitsT("burnoutPrevention.title"),
                    description: benefitsT("burnoutPrevention.description"),
                },
                {
                    icon: <BarChart3 className="w-10 h-10" />,
                    title: benefitsT("productivityBoost.title"),
                    description: benefitsT("productivityBoost.description"),
                },
            ]}
            science={{
                title: t('pomodoroTimer.science.title'),
                description: t('pomodoroTimer.science.description'),
                blogArticleUrl: '/blog/how-to-improve-focus-and-concentration',
                blogArticleTitle: t('pomodoroTimer.science.blogArticleTitle'),
                authorityLinks: [
                    {
                        title: "The Pomodoro Technique",
                        url: "https://en.wikipedia.org/wiki/Pomodoro_Technique",
                        description: t('pomodoroTimer.science.authorityLinks.technique')
                    },
                    {
                        title: "Time Management and Productivity Research",
                        url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6388606/",
                        description: t('pomodoroTimer.science.authorityLinks.timeManagement')
                    },
                    {
                        title: "Attention Span and Focus Training",
                        url: "https://en.wikipedia.org/wiki/Attention_span",
                        description: t('pomodoroTimer.science.authorityLinks.attention')
                    }
                ]
            }}
            faq={[
                {
                    question: faqT("whatIsPomodoro.question"),
                    answer: faqT("whatIsPomodoro.answer"),
                },
                {
                    question: faqT("whyBreaks.question"),
                    answer: faqT("whyBreaks.answer"),
                },
                {
                    question: faqT("customize.question"),
                    answer: faqT("customize.answer"),
                },
                {
                    question: faqT("bestFor.question"),
                    answer: faqT("bestFor.answer"),
                },
                {
                    question: faqT("howManyPerDay.question"),
                    answer: faqT("howManyPerDay.answer"),
                },
            ]}
            relatedGames={["schulte-table", "dual-n-back", "fish-trace"]}
        />
    );
}
