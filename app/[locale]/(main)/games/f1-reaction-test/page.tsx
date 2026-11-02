import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Gauge, Hand, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { use } from 'react'
import { generateAlternates } from '@/lib/utils'
import { routing } from '@/i18n/routing'
import { SITE_BASE_URL } from '@/lib/site-constants'

const coverImage = "/games/f1-reaction-test-cover.png";

// Generate static params for all locales
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'games.f1ReactionTest' });

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
        alternates: generateAlternates(locale, 'games/f1-reaction-test'),
    };
}

export default function F1ReactionTestPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const t = useTranslations('games.f1ReactionTest');

    const faq = ["howItWorks", "goodTime", "jumpStart", "randomPause", "worldRecord", "official"].map((key) => ({
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
            "url": `${SITE_BASE_URL}${locale === "en" ? "" : `/${locale}`}/games/f1-reaction-test`,
            "image": `${SITE_BASE_URL}${coverImage}`,
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web Browser",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "featureList": [
                "Five start lights that come on one second apart",
                "Random 0.2–3 second pause before lights out",
                "Jump start detection, including presses within 0.1 s of lights out",
                "Reaction time in seconds compared with the typical F1 start range",
                "Personal best and last five attempts"
            ],
            "educationalUse": "Reaction Time Training",
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
            gameId="f1-reaction-test"
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
                    icon: <Zap className="w-10 h-10" />,
                    title: t('benefits.reactionSpeed.title'),
                    description: t('benefits.reactionSpeed.description'),
                },
                {
                    icon: <Hand className="w-10 h-10" />,
                    title: t('benefits.impulseControl.title'),
                    description: t('benefits.impulseControl.description'),
                },
                {
                    icon: <Gauge className="w-10 h-10" />,
                    title: t('benefits.consistency.title'),
                    description: t('benefits.consistency.description'),
                },
            ]}
            science={{
                title: t('science.title'),
                description: t('science.description'),
            }}
            faq={faq}
            relatedGames={["reaction-time", "psychomotor-vigilance-test", "challenge10Seconds"]}
            structuredData={structuredData}
        />
    );
}
