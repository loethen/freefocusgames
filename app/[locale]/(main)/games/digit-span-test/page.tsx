import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GamePageTemplate } from "@/components/GamePageTemplate";
import { generateAlternates } from "@/lib/utils";
import { SITE_BASE_URL } from "@/lib/site-constants";
import { routing } from "@/i18n/routing";
import DigitSpanGame from "./Game";
import DigitSpanLeaderboard from "./Leaderboard";
import DigitSpanWorksheet from "./Worksheet";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "games.digitSpanTest" });
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    keywords: t.raw("seoKeywords") as string[],
    alternates: generateAlternates(locale, "games/digit-span-test"),
    openGraph: {
      title,
      description,
      url: generateAlternates(locale, "games/digit-span-test").canonical,
      images: [
        {
          url: "/games/digit-span-test-cover-v2.png",
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
      images: ["/games/digit-span-test-cover-v2.png"],
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
  const t = await getTranslations({ locale, namespace: "games.digitSpanTest" });
  const common = await getTranslations({ locale, namespace: "common" });
  const base = SITE_BASE_URL;
  const prefix = locale === "en" ? "" : `/${locale}`;
  const url = `${base}${prefix}/games/digit-span-test`;
  const faq = ["modes", "scoring", "meaning", "free", "print"].map((key) => ({
    question: t(`faq.${key}.question`),
    answer: t(`faq.${key}.answer`),
  }));
  return (
    <GamePageTemplate
      gameId="digit-span-test"
      title={t("title")}
      subtitle={t("subtitle")}
      gameComponent={<DigitSpanGame />}
      howToPlay={
        <>
          <ol className="list-decimal pl-5 space-y-2">
            <li>{t("howToPlay.choose")}</li>
            <li>{t("howToPlay.progress")}</li>
            <li>{t("howToPlay.interruption")}</li>
          </ol>
        </>
      }
      shareActions={<DigitSpanWorksheet sourceUrl={url} />}
      hasLeaderboard={true}
      leaderboardIntro={<p>{t("leaderboardIntro")}</p>}
      leaderboardComponent={<DigitSpanLeaderboard />}
      science={{
        title: t("science.title"),
        description: (
          <>
            <p>{t("science.task")}</p>
            <p className="mt-3">{t("science.limitations")}</p>
          </>
        ),
        authorityLinks: [
          {
            title: "Wikipedia: Memory span",
            url: "https://en.wikipedia.org/wiki/Memory_span#Digit-span",
            description: t("science.reference"),
          },
        ],
      }}
      faq={faq}
      relatedGames={[
        "dual-n-back",
        "free-short-term-memory-test",
        "block-memory-challenge",
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
