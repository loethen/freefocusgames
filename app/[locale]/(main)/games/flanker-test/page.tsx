import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Target, Zap, Brain } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { use } from 'react'
import { generateAlternates } from '@/lib/utils'
import { routing } from '@/i18n/routing'
import { SITE_BASE_URL } from '@/lib/site-constants'

const coverImage = "/games/flanker-test-cover.png";

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
        keywords: t('metadata.keywords').split(',').map(keyword => keyword.trim()),
        openGraph: {
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: [{ url: coverImage, width: 1200, height: 675, alt: t('title') }],
        },
        twitter: {
            card: "summary_large_image",
            title: t('metadata.ogTitle'),
            description: t('metadata.ogDescription'),
            images: [coverImage],
        },
        alternates: generateAlternates(locale, 'games/flanker-test'),
    };
}

export default function FlankerTestPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const t = useTranslations('games.focusReactionTest');

    const faq = ["whatIsFlankerTask", "congruent", "flankerEffect", "online", "nihToolbox", "howToImprove"].map((key) => ({
        question: t(`faq.${key}.question`),
        answer: t(`faq.${key}.answer`),
    }));

    const structuredData = [
        {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": t('title'),
            "description": t('metadata.description'),
            "keywords": t('metadata.keywords').split(',').map(keyword => keyword.trim()),
            "url": `${SITE_BASE_URL}${locale === "en" ? "" : `/${locale}`}/games/flanker-test`,
            "image": `${SITE_BASE_URL}${coverImage}`,
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web Browser",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "featureList": [
                "Arrow version of the Eriksen flanker task",
                "4 practice trials and 40 scored trials",
                "Congruent, incongruent and neutral trials",
                "Accuracy, average reaction time and flanker effect",
                "Keyboard and touch controls"
            ],
            "educationalUse": "Selective Attention Training",
            "learningResourceType": "Interactive Game",
            "interactivityType": "active"
        },
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faq.map((item) => ({
                "@type": "Question",
                "name": item.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": item.answer
                }
            }))
        }
    ];

    return (
        <GamePageTemplate
            gameId="focus-reaction-test"
            title={t('title')}
            subtitle={t('subtitle')}
            description={t('intro')}
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
            }}
            faq={faq}
            relatedGames={["stroop-effect-test", "reaction-time", "double-decision"]}
            structuredData={structuredData}
        />
    );
}
