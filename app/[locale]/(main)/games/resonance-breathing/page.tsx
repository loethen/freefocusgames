import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Heart, Activity, Brain, Wind } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { use } from 'react';
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
    const t = await getTranslations({ locale, namespace: 'games.resonanceBreathing' });

    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
        keywords: t('metadata.keywords').split(',').map(keyword => keyword.trim()),
        openGraph: {
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
        },
        alternates: generateAlternates(locale, 'games/resonance-breathing'),
        other: {
            'script:ld+json': JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": t('title'),
                "description": t('metadata.description'),
                "url": `https://www.freefocusgames.com${locale === 'en' ? '' : `/${locale}`}/games/resonance-breathing`,
                "applicationCategory": "HealthApplication",
                "operatingSystem": "Web Browser",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                },
                "featureList": [
                    "Guided Resonance Breathing (6 breaths/min)",
                    "Box Breathing (4-4-4-4)",
                    "4-7-8 Breathing Technique",
                    "Vagus Nerve Stimulation",
                    "HRV Improvement",
                    "Stress Relief",
                    "Customizable Breathing Pace",
                    "Navy SEAL Tactical Breathing"
                ],
                "healthCondition": "Anxiety, Stress, Insomnia",
                "audience": {
                    "@type": "PeopleAudience",
                    "healthCondition": "Stress Management"
                }
            })
        }
    };
}

export default function ResonanceBreathingPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const t = useTranslations('games.resonanceBreathing');

    return (
        <GamePageTemplate
            gameId="resonance-breathing"
            title={t('title')}
            subtitle={t('subtitle')}
            gameComponent={<Game defaultMode="resonance" />}
            howToPlay={
                <>
                    <p>{t('howToPlay.intro')}</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>{t('howToPlay.step1')}</li>
                        <li>{t('howToPlay.step2')}</li>
                        <li>{t('howToPlay.step3')}</li>
                        <li>{t('howToPlay.step4')}</li>
                    </ul>
                    <div className="mt-4 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg">
                        <p className="text-sm text-emerald-800">
                            <strong>{t('howToPlay.tipTitle')}:</strong> {t('howToPlay.tip')}
                        </p>
                    </div>
                </>
            }
            benefits={[
                {
                    icon: <Wind className="w-10 h-10" />,
                    title: t('benefits.anxiety.title'),
                    description: t('benefits.anxiety.description')
                },
                {
                    icon: <Brain className="w-10 h-10" />,
                    title: t('benefits.focus.title'),
                    description: t('benefits.focus.description')
                },
                {
                    icon: <Heart className="w-10 h-10" />,
                    title: t('benefits.cardiovascular.title'),
                    description: t('benefits.cardiovascular.description')
                },
                {
                    icon: <Activity className="w-10 h-10" />,
                    title: t('benefits.recovery.title'),
                    description: t('benefits.recovery.description')
                }
            ]}
            science={{
                title: t('science.title'),
                description: t('science.description'),
                blogArticleUrl: "/blog/the-science-of-resonance-breathing-vagus-nerve",
                blogArticleTitle: t('science.blogArticleTitle'),
                authorityLinks: [
                    {
                        title: "NIH: HRV Biofeedback Study",
                        url: "https://pubmed.ncbi.nlm.nih.gov/28741846/",
                        description: t('science.authorityLinks.nih')
                    },
                    {
                        title: "Frontiers: Slow-Paced Breathing",
                        url: "https://www.frontiersin.org/articles/10.3389/fnhum.2018.00353/full",
                        description: t('science.authorityLinks.frontiers')
                    },
                    {
                        title: "Wikipedia: Vagus Nerve",
                        url: "https://en.wikipedia.org/wiki/Vagus_nerve",
                        description: t('science.authorityLinks.wikipedia')
                    }
                ]
            }}
            faq={[
                {
                    question: t('faq.whatIs.question'),
                    answer: t('faq.whatIs.answer')
                },
                {
                    question: t('faq.howLong.question'),
                    answer: t('faq.howLong.answer')
                },
                {
                    question: t('faq.optimal.question'),
                    answer: t('faq.optimal.answer')
                },
                {
                    question: t('faq.benefits.question'),
                    answer: t('faq.benefits.answer')
                },
                {
                    question: t('faq.boxBreathing.question'),
                    answer: t('faq.boxBreathing.answer')
                },
                {
                    question: t('faq.breathing478.question'),
                    answer: t('faq.breathing478.answer')
                }
            ]}
            relatedGames={["box-breathing", "478-breathing", "pomodoro-timer"]}
        />
    );
}
