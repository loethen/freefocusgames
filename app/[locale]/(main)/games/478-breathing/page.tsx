import { Metadata } from 'next'
import Game from '../resonance-breathing/components/Game'
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
    const t = await getTranslations({ locale, namespace: 'games.478Breathing' });

    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
        keywords: t('metadata.keywords').split(',').map(keyword => keyword.trim()),
        openGraph: {
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
        },
        alternates: generateAlternates(locale, 'games/478-breathing'),
        other: {
            'script:ld+json': JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": t('title'),
                "description": t('metadata.description'),
                "url": `https://www.freefocusgames.com${locale === 'en' ? '' : `/${locale}`}/games/478-breathing`,
                "applicationCategory": "HealthApplication",
                "operatingSystem": "Web Browser",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                },
                "featureList": [
                    "4-7-8 Breathing Technique",
                    "Natural Sleep Aid",
                    "Dr. Weil Breathing Method",
                    "Anxiety Relief Breathing",
                    "Visual Lotus Animation Guide"
                ],
                "healthCondition": "Insomnia, Anxiety, Stress",
                "audience": {
                    "@type": "PeopleAudience",
                    "healthCondition": "Sleep Disorders, Anxiety"
                }
            })
        }
    };
}

export default function Breathing478Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const t = useTranslations('games.478Breathing');

    return (
        <GamePageTemplate
            gameId="478-breathing"
            title={t('title')}
            subtitle={t('subtitle')}
            gameComponent={<Game defaultMode="478" />}
            howToPlay={
                <>
                    <p>{t('howToPlay.intro')}</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>{t('howToPlay.step1')}</li>
                        <li>{t('howToPlay.step2')}</li>
                        <li>{t('howToPlay.step3')}</li>
                        <li>{t('howToPlay.step4')}</li>
                    </ul>
                    <div className="mt-4 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg">
                        <p className="text-sm text-indigo-800">
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
                blogArticleUrl: "/blog/the-science-of-478-breathing-sleep-anxiety-relief",
                blogArticleTitle: t('science.blogArticleTitle'),
                authorityLinks: [
                    {
                        title: "NIH: Extended Exhalation Research",
                        url: "https://pubmed.ncbi.nlm.nih.gov/28741846/",
                        description: t('science.authorityLinks.nih')
                    },
                    {
                        title: "Frontiers: 4-7-8 Protocol Study",
                        url: "https://www.frontiersin.org/articles/10.3389/fnhum.2018.00353/full",
                        description: t('science.authorityLinks.frontiers')
                    },
                    {
                        title: "Wikipedia: Integrative Medicine",
                        url: "https://en.wikipedia.org/wiki/Andrew_Weil",
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
                }
            ]}
            relatedGames={["resonance-breathing", "box-breathing", "pomodoro-timer"]}
        />
    );
}
