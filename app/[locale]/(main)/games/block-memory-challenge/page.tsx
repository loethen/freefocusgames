import { SITE_BASE_URL } from "@/lib/site-constants";
import { Metadata } from "next";
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
import { BlockMemoryLeaderboard, RecallDirectionProvider } from "./components/RecallDirection";

const coverImage = "/games/block-memory-challenge-cover.png";

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
            images: [{
                url: coverImage,
                width: 1200,
                height: 675,
                alt: t("title"),
            }],
        },
        twitter: {
            card: "summary_large_image",
            title: t("ogTitle") || `${t("title")} - ${t("subtitle")}`,
            description: t("ogDescription") || t("description"),
            images: [coverImage],
        },
        alternates: generateAlternates(locale, "games/block-memory-challenge"),
    }
}

export default function BlockMemoryPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    const baseUrl = SITE_BASE_URL;
    const t = useTranslations("games.blockMemoryChallenge");
    const benefitsT = useTranslations("games.blockMemoryChallenge.benefits");
    const howToPlayT = useTranslations("games.blockMemoryChallenge.howToPlay");
    const faqT = useTranslations("games.blockMemoryChallenge.faq");
    const scienceT = useTranslations("games.blockMemoryChallenge.science");

    const faq = ["online", "backward", "corsi", "corsiSpan"].map((key) => ({
        question: faqT(`${key}.question`),
        answer: faqT(`${key}.answer`)
    }));

    const structuredData = [
        {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": t("title"),
            "description": t("metaDescription"),
            "keywords": t("metaKeywords").split(",").map(keyword => keyword.trim()),
            "url": `${baseUrl}/games/block-memory-challenge`,
            "image": `${baseUrl}${coverImage}`,
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web Browser",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "featureList": [
                "Challenge mode starting with a 3-step sequence",
                "Practice mode with adjustable starting sequence length",
                "Forward and backward sequence recall inspired by the Corsi block-tapping test",
                "Separate forward and backward leaderboards ranked by longest completed sequence",
                "Visual working memory training"
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
        <RecallDirectionProvider>
        <GamePageTemplate
            gameId="block-memory-challenge"
            title={t("title")}
            subtitle={t("subtitle")}
            gameComponent={<PatternRecallGame />}
            howToPlay={
                <>
                    <p>{howToPlayT("intro")}</p>
                    <p>{howToPlayT("step4")}</p>
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline">{howToPlayT("watchDemo")}</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogTitle>{howToPlayT("demo")}</DialogTitle>
                                <GamePreview />
                            </DialogContent>
                        </Dialog>
                    </div>
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
                        title: "Corsi Block-Tapping Test",
                        url: "https://en.wikipedia.org/wiki/Corsi_block-tapping_test",
                        description: scienceT("authorityLinks.corsi")
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
            leaderboardFormatterType="steps"
            leaderboardComponent={<BlockMemoryLeaderboard />}
            structuredData={structuredData}
        />
        </RecallDirectionProvider>
    );
}
