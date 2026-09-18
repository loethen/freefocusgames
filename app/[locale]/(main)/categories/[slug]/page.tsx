import { getCategoryBySlug, categories } from "@/data/categories";
import { getGamesByCategory } from "@/data/games";
import GameCard from "@/components/game-card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from "@/i18n/routing";
import { generateAlternates } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-static";
export const revalidate = 86400;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    categories.map((category) => ({
      locale,
      slug: category.slug,
    }))
  );
}

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const category = getCategoryBySlug(slug);

  // Load translations once with a merged namespace
  const t = await getTranslations({ locale, namespace: 'categories' });

  if (!category) notFound();

  const categoryName = t(`categoryNames.${category.id}`, { defaultMessage: category.name });
  const categoryDescription = t(`categoryDescriptions.${category.id}`, { defaultMessage: category.description });

  // 翻译关键词
  let translatedKeywords = '';
  if (category.keywords && category.keywords.length > 0) {
    try {
      // Use the same translation function by adjusting the path structure in translation files
      const translatedKeywordsArray = category.keywords.map(keyword =>
        t(`keywords.${category.id}.${keyword}`, { defaultMessage: keyword })
      );
      translatedKeywords = translatedKeywordsArray.join(", ");
    } catch {
      // 如果翻译失败，使用原始关键词
      translatedKeywords = category.keywords.join(", ");
    }
  } else {
    translatedKeywords = `${categoryName.toLowerCase()} games, brain training, cognitive enhancement`;
  }

  return {
    title: t('categoryMetaTitle', {
      categoryName: categoryName
    }),
    description: t('categoryMetaDescription', {
      categoryName: categoryName,
      categoryDescription: categoryDescription
    }),
    keywords: translatedKeywords.split(",").map((keyword) => keyword.trim()).filter(Boolean),
    openGraph: {
      title: t('categoryOgTitle', {
        categoryName: categoryName
      }),
      description: t('categoryOgDescription', {
        categoryName: categoryName
      }),
      images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
    },
    alternates: generateAlternates(locale, `categories/${slug}`),
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const games = getGamesByCategory(category.id);

  // 获取服务器端翻译
  const t = await getTranslations({ locale, namespace: 'categories' });
  const allT = await getTranslations({ locale });
  const categoryName = t(`categoryNames.${category.id}`, { defaultMessage: category.name });
  const categoryDescription = t(`categoryDescriptions.${category.id}`, { defaultMessage: category.description });
  const categoryGamesHeading = t('categoryGamesHeading', { categoryName: categoryName });
  const categoriesTitle = t('title');
  const categoryIntro = t('categoryIntro', { categoryName });
  const clusterLinks = category.id === 'reaction-time'
    ? [
        { href: '/games/challenge-10-seconds', label: allT('games.challenge10Seconds.title') },
        { href: '/games/reaction-time', label: allT('games.reactionTime.title') },
        { href: '/games/cps-test', label: allT('games.cpsTest.title') },
        { href: '/games/spacebar-clicker', label: allT('games.spacebarClicker.title') },
      ]
    : category.id === 'working-memory'
      ? [
          { href: '/games/dual-n-back', label: allT('games.dualNBack.title') },
          { href: '/games/free-short-term-memory-test', label: allT('games.freeShortTermMemoryTest.title') },
          { href: '/working-memory-guide', label: allT('workingMemoryGuide.title') },
        ]
      : category.id === 'visual-tracking'
        ? [
            { href: '/games/schulte-table', label: allT('games.schulteTable.title') },
            { href: '/games/rotating-schulte-table', label: allT('games.rotatingSchulteTable.title') },
            {
              href: '/blog/the-science-of-schulte-tables-boost-visual-attention-reading-speed',
              label: allT('games.schulteTable.science.blogArticleTitle'),
            },
          ]
        : [];

  return (
    <div className="max-w-7xl mx-auto py-8">
      <Breadcrumbs
        items={[
          { label: categoriesTitle, href: "/categories" },
          { label: categoryName },
        ]}
      />

      <h1 className="text-3xl md:text-4xl font-bold mt-12 mb-6 text-center">
        {categoryGamesHeading}
      </h1>
      <p className="mb-4 max-w-4xl mx-auto text-center leading-8 text-foreground/90">{categoryDescription}</p>
      <p className="mb-8 max-w-3xl mx-auto text-center text-sm text-muted-foreground leading-7">{categoryIntro}</p>

      {clusterLinks.length > 0 && (
        <section className="mx-auto mb-10 max-w-4xl rounded-2xl border border-border bg-muted/20 p-5 sm:p-6">
          <h2 className="text-center text-xl font-semibold">{t('startHereTitle')}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
            {t('startHereDescription', { categoryName })}
          </p>
          <nav className="mt-5" aria-label={t('startHereTitle')}>
            <ul className="flex flex-wrap justify-center gap-3">
              {clusterLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>
      )}

      <div className="mb-12 text-center">
        <Link href="/categories" className="text-sm text-primary hover:underline">
          {t('backToAll')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {games.map((game) => (
          <GameCard key={game.id} game={game} preview={game.preview} />
        ))}
      </div>
    </div>
  );
} 
