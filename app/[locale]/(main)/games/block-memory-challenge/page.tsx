import { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { PatternRecallGame } from "./components/PatternRecallGame";
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Grid, Brain, Eye } from 'lucide-react'
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { GamePreview } from "./components/GamePreview"
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { routing } from '@/i18n/routing';
import { generateAlternates } from "@/lib/utils";
import { RANKED_LEADERBOARD_MODE } from "@/lib/leaderboard-config";

// Generate static params for all locales
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "games.blockMemoryChallenge" });

    return {
        title: t("metaTitle") || t("title"),
        description: t("metaDescription") || t("description"),
        keywords: t("metaKeywords").split(",").map(keyword => keyword.trim()),
        openGraph: {
            title: t("ogTitle") || `${t("title")} - ${t("subtitle")}`,
            description: t("ogDescription") || t("description"),
            images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
        },
        alternates: generateAlternates(locale, "games/block-memory-challenge"),
    }
}

export default function BlockMemoryPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://freefocusgames.com";
    const t = useTranslations("games.blockMemoryChallenge");
    const tCommon = useTranslations("common");
    const benefitsT = useTranslations("games.blockMemoryChallenge.benefits");
    const howToPlayT = useTranslations("games.blockMemoryChallenge.howToPlay");
    const faqT = useTranslations("games.blockMemoryChallenge.faq");
    const scienceT = useTranslations("games.blockMemoryChallenge.science");

    const faq = [
        {
            question: faqT("dailyLife.question"),
            answer: faqT("dailyLife.answer")
        },
        {
            question: faqT("learning.question"),
            answer: faqT("learning.answer")
        },
        {
            question: faqT("practice.question"),
            answer: faqT("practice.answer")
        },
        {
            question: faqT("children.question"),
            answer: faqT("children.answer")
        }
    ];

    const structuredData = [
        {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": t("title"),
            "description": t("metaDescription"),
            "url": `${baseUrl}/games/block-memory-challenge`,
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web Browser",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "featureList": [
                "Ranked mode with a fixed starting level",
                "Practice mode with adjustable sequence length",
                "Visual working memory training",
                "Anonymous leaderboard"
            ],
            "educationalUse": "Working Memory Training",
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
            gameId="block-memory-challenge"
            title={t("title")}
            subtitle={t("subtitle")}
            gameComponent={<PatternRecallGame />}
            howToPlay={
                <>
                    <Link href="/working-memory-guide" className="block mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors group">
                        <div className="flex items-center gap-3">
                            <Brain className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium text-primary">
                                {tCommon("learnMoreAboutWorkingMemory")}
                            </span>
                        </div>
                    </Link>
                    <p>{howToPlayT("intro")}</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>{howToPlayT("step1")}</li>
                        <li>{howToPlayT("step2")}</li>
                        <li>{howToPlayT("step3")}</li>
                        <li>{howToPlayT("step4")}</li>
                    </ul>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="mt-4">{howToPlayT("watchDemo")}</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogTitle>{howToPlayT("demo")}</DialogTitle>
                            <GamePreview />
                        </DialogContent>
                    </Dialog>
                </>
            }
            leaderboardIntro={<p>{t("gameUI.leaderboardDescription")}</p>}
            benefits={[
                {
                    icon: <Brain className="w-10 h-10" />,
                    title: benefitsT("workingMemory.title"),
                    description: benefitsT("workingMemory.description")
                },
                {
                    icon: <Eye className="w-10 h-10" />,
                    title: benefitsT("visualProcessing.title"),
                    description: benefitsT("visualProcessing.description")
                },
                {
                    icon: <Grid className="w-10 h-10" />,
                    title: benefitsT("patternRecognition.title"),
                    description: benefitsT("patternRecognition.description")
                }
            ]}
            science={{
                title: scienceT("title"),
                description: scienceT("description"),
                blogArticleUrl: "/blog/how-to-improve-working-memory",
                blogArticleTitle: scienceT("blogArticleTitle"),
                authorityLinks: [
                    {
                        title: "How to Improve Working Memory",
                        url: "/blog/how-to-improve-working-memory",
                        description: scienceT("authorityLinks.workingMemory")
                    },
                    {
                        title: "How to Improve Short-Term Memory",
                        url: "/blog/how-to-improve-short-term-memory",
                        description: scienceT("authorityLinks.shortTermMemory")
                    },
                    {
                        title: "Working Memory",
                        url: "https://en.wikipedia.org/wiki/Working_memory",
                        description: scienceT("authorityLinks.visualMemory")
                    }
                ]
            }}
            faq={faq}
            relatedGames={["frog-memory-leap", "schulte-table"]}
            hasLeaderboard={true}
            leaderboardFormatterType="levels"
            leaderboardMode={RANKED_LEADERBOARD_MODE}
            structuredData={structuredData}
        />
    );
}
