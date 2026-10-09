import { Metadata } from "next";
import { Eye, Shuffle, Brain } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GamePageTemplate } from "@/components/GamePageTemplate";
import { generateAlternates } from "@/lib/utils";
import { SITE_BASE_URL } from "@/lib/site-constants";
import { routing } from "@/i18n/routing";
import TrailMakingGame from "./Game";
import TrailMakingWorksheet from "./Worksheet";
import { TRAIL_LEADERBOARD_MODE } from "@/lib/trail-making";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "games.trailMakingTest" });
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    keywords: t.raw("seoKeywords") as string[],
    alternates: generateAlternates(locale, "games/trail-making-test"),
    openGraph: {
      title,
      description,
      url: generateAlternates(locale, "games/trail-making-test").canonical,
      images: [
        {
          url: "/games/trail-making-test-cover-v2.png",
          width: 1200,
          height: 675,
          alt: t("title"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/games/trail-making-test-cover-v2.png"],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "games.trailMakingTest" });
  const common = await getTranslations({ locale, namespace: "common" });
  const base = SITE_BASE_URL;
  const prefix = locale === "en" ? "" : `/${locale}`;
  const url = `${base}${prefix}/games/trail-making-test`;
  const faq = ["parts", "scoring", "meaning", "mobile", "print"].map((key) => ({
    question: t(`faq.${key}.question`),
    answer: t(`faq.${key}.answer`),
  }));
  return (
    <GamePageTemplate
      gameId="trail-making-test"
      title={t("title")}
      subtitle={t("subtitle")}
      gameComponent={<TrailMakingGame />}
      howToPlay={
        <>
          <ol className="list-decimal pl-5 space-y-2">
            <li>{t("howToPlay.choose")}</li>
            <li>{t("howToPlay.progress")}</li>
            <li>{t("howToPlay.interruption")}</li>
          </ol>
        </>
      }
      shareActions={<TrailMakingWorksheet sourceUrl={url} />}
      hasLeaderboard
      leaderboardTitle={t("leaderboard.title")}
      leaderboardIntro={t("leaderboard.description")}
      leaderboardMode={TRAIL_LEADERBOARD_MODE}
      leaderboardFormatterType="sec3"
      benefitsTitle={t("benefits.title")}
      benefits={[
        { icon: <Eye className="h-10 w-10" />, title: t("benefits.search.title"), description: t("benefits.search.description") },
        { icon: <Shuffle className="h-10 w-10" />, title: t("benefits.switching.title"), description: t("benefits.switching.description") },
        { icon: <Brain className="h-10 w-10" />, title: t("benefits.tracking.title"), description: t("benefits.tracking.description") },
      ]}
      science={{
        title: t("science.title"),
        description: (
          <>
            <p>{t("science.task")}</p>
            <p className="mt-3">{t("science.practice")}</p>
            <p className="mt-3">{t("science.limitations")}</p>
          </>
        ),
        authorityLinks: [
          {
            title: "Wikipedia: Trail Making Test",
            url: "https://en.wikipedia.org/wiki/Trail_Making_Test",
            description: t("science.reference"),
          },
        ],
      }}
      faq={faq}
      relatedGames={[
        "schulte-table",
        "stroop-effect-test",
        "digit-span-test",
      ]}
      structuredData={[
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: common("home"),
              item: `${base}${prefix || "/"}`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: common("games"),
              item: `${base}${prefix}/games`,
            },
            { "@type": "ListItem", position: 3, name: t("title"), item: url },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: t("title"),
          url,
          applicationCategory: "GameApplication",
          operatingSystem: "Web browser",
          inLanguage: locale,
          isAccessibleForFree: true,
          description: t("metaDescription"),
          keywords: t.raw("seoKeywords") as string[],
          featureList: t.raw("features") as string[],
        },
      ]}
    />
  );
}
