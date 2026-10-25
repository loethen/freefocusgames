import { getCategoryBySlug, categories } from "@/data/categories";
import { getGamesByCategory } from "@/data/games";
import GameCard from "@/components/game-card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from "@/i18n/routing";
import { getBlogPost } from "@/lib/blog";
import { generateAlternates } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import LinkClickTracker from "@/components/link-click-tracker";
import { ArrowRight, Play } from "lucide-react";

export const dynamic = "force-static";
export const revalidate = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    categories.map((category) => ({
      locale,
      slug: category.slug,
    }))
  );
}

function gameTitleKey(id: string) {
  return id.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase()).replace(/-/g, "");
}

// The game a visitor should land in first; other categories use their first listed game.
const PRIMARY_GAME_BY_CATEGORY: Record<string, string> = {
  "reaction-time": "reaction-time",
  "working-memory": "dual-n-back",
  "visual-tracking": "schulte-table",
};

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
  const primaryGame = games.find((game) => game.id === PRIMARY_GAME_BY_CATEGORY[category.id]) ?? games[0];

  // 获取服务器端翻译
  const t = await getTranslations({ locale, namespace: 'categories' });
  const allT = await getTranslations({ locale });
  const categoryName = t(`categoryNames.${category.id}`, { defaultMessage: category.name });
  const categoryDescription = t(`categoryDescriptions.${category.id}`, { defaultMessage: category.description });
  const categoryGamesHeading = t('categoryGamesHeading', { categoryName: categoryName });
  const categoriesTitle = t('title');
  const categoryIntro = t('categoryIntro', { categoryName });
  // Guides and articles that belong to this topic cluster; the games themselves are in the grid.
  const workingMemoryReads = category.id === 'working-memory'
    ? await Promise.all(
        ['interactive-dual-n-back-tutorial-complete-guide', 'digit-span-test-explained'].map(async (slug) => ({
          href: `/blog/${slug}`,
          label: (await getBlogPost(slug, locale))?.title ?? '',
        }))
      )
    : [];
  const readingLinks = category.id === 'working-memory'
    ? workingMemoryReads.filter((link) => link.label)
    : category.id === 'visual-tracking'
      ? [{
          href: '/blog/the-science-of-schulte-tables-boost-visual-attention-reading-speed',
          label: allT('games.schulteTable.science.blogArticleTitle'),
        }]
      : [];

  return (
    <LinkClickTracker fromPage={`categories/${category.slug}`} className="max-w-7xl mx-auto py-8">
      <Breadcrumbs
        items={[
          { label: categoriesTitle, href: "/categories" },
          { label: categoryName },
        ]}
      />

      <header className="mx-auto mt-10 mb-12 max-w-3xl text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {categoryGamesHeading}
        </h1>
        <p className="mt-4 leading-7 text-foreground/80">{categoryDescription}</p>

        {primaryGame && (
          <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/games/${primaryGame.slug}`}
              data-link-location="category_primary_cta"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Play className="h-5 w-5" fill="currentColor" aria-hidden="true" />
              {t('playNow', { game: allT(`games.${gameTitleKey(primaryGame.id)}.title`) })}
            </Link>
            <Link
              href="/get-started"
              data-link-location="category_game_picker"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('notSure')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </header>

      <section aria-labelledby="category-games-title" data-link-location="category_grid">
        <h2 id="category-games-title" className="mb-5 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {t('gridTitle', { count: games.length, categoryName })}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="category-about-title"
        data-link-location="category_about"
        className="mx-auto mt-16 max-w-2xl space-y-3 text-sm leading-7 text-muted-foreground"
      >
        <h2 id="category-about-title" className="text-base font-semibold text-foreground">
          {t('aboutTitle', { categoryName })}
        </h2>
        <p>{categoryIntro}</p>
        {readingLinks.length > 0 && (
          <ul className="space-y-1">
            {readingLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex items-center gap-1.5 font-medium text-foreground underline underline-offset-4 hover:text-primary">
                  {link.label}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p>
          <Link href="/categories" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
            {t('backToAll')}
          </Link>
        </p>
      </section>
    </LinkClickTracker>
  );
} 
