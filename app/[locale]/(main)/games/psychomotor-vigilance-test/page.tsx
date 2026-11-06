import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Eye, Timer, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { use } from 'react'
import { generateAlternates } from '@/lib/utils'
import { SITE_BASE_URL } from '@/lib/site-constants'
import { pageLocaleParams } from '@/lib/locale-availability';

const coverImage = "/games/psychomotor-vigilance-test-cover.png";

// Generate static params for all locales
export function generateStaticParams() {
    return pageLocaleParams('games/psychomotor-vigilance-test');
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'games.psychomotorVigilanceTest' });

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
        alternates: generateAlternates(locale, 'games/psychomotor-vigilance-test'),
    };
}

export default function PsychomotorVigilanceTestPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const t = useTranslations('games.psychomotorVigilanceTest');

    const faq = ["whatIsPvt", "howLong", "lapses", "falseStart", "vsReactionTime", "official"].map((key) => ({
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
            "url": `${SITE_BASE_URL}${locale === "en" ? "" : `/${locale}`}/games/psychomotor-vigilance-test`,
            "image": `${SITE_BASE_URL}${coverImage}`,
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web Browser",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "featureList": [
                "3-minute PVT-B with 1–4 second intervals and a 355 ms lapse threshold",
                "10-minute standard PVT with 2–10 second intervals and a 500 ms lapse threshold",
                "Millisecond counter stimulus with keyboard and touch responses",
                "Median and mean reaction time, lapses, false starts and response speed",
                "Reaction time chart across the whole test"
            ],
            "educationalUse": "Sustained Attention Assessment",
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
            gameId="psychomotor-vigilance-test"
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
                    icon: <Eye className="w-10 h-10" />,
                    title: t('benefits.sustainedAttention.title'),
                    description: t('benefits.sustainedAttention.description'),
                },
                {
                    icon: <Timer className="w-10 h-10" />,
                    title: t('benefits.alertness.title'),
                    description: t('benefits.alertness.description'),
                },
                {
                    icon: <Zap className="w-10 h-10" />,
                    title: t('benefits.reactionSpeed.title'),
                    description: t('benefits.reactionSpeed.description'),
                },
            ]}
            science={{
                title: t('science.title'),
                description: t('science.description'),
            }}
            faq={faq}
            relatedGames={["reaction-time", "focus-reaction-test", "schulte-table"]}
            structuredData={structuredData}
        />
    );
}
