import { getCategoryBySlug, categories } from "@/data/categories";
import { getGame, getGamesByCategory } from "@/data/games";
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
  "double-decision-games": "double-decision",
  "memory-games": "memory-matching-game",
};

type HubGroup = { id: string; games: string[] };

// Hub categories target a broad search term, so they get their own title and
// grouped content. Copy lives under categories.hubs.<category id>.
const HUBS: Record<string, { types: HubGroup[]; audiences: HubGroup[]; faq: string[] }> = {
  "memory-games": {
    types: [
      { id: "matching", games: ["memory-matching-game", "baby-animal-matching"] },
      { id: "sequence", games: ["block-memory-challenge", "frog-memory-leap"] },
      { id: "recall", games: ["digit-span-test", "free-short-term-memory-test"] },
      { id: "nBack", games: ["dual-n-back", "mahjong-dual-n-back"] },
      { id: "spatial", games: ["counting-boxes"] },
    ],
    audiences: [
      { id: "adults", games: ["memory-matching-game", "dual-n-back"] },
      { id: "seniors", games: ["free-short-term-memory-test", "baby-animal-matching"] },
      { id: "kids", games: ["baby-animal-matching", "frog-memory-leap"] },
    ],
    faq: ["free", "best", "improve", "howOften"],
  },
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
  const hubKey = HUBS[category.id] ? `hubs.${category.id}` : null;
  const metaTitle = hubKey ? t(`${hubKey}.metaTitle`) : t('categoryMetaTitle', { categoryName });
  const metaDescription = hubKey
    ? t(`${hubKey}.metaDescription`)
    : t('categoryMetaDescription', { categoryName, categoryDescription });

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
    title: metaTitle,
    description: metaDescription,
    keywords: translatedKeywords.split(",").map((keyword) => keyword.trim()).filter(Boolean),
    openGraph: {
      title: hubKey ? metaTitle : t('categoryOgTitle', { categoryName }),
      description: hubKey ? metaDescription : t('categoryOgDescription', { categoryName }),
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

  const hub = HUBS[category.id];
  // Hubs list games in the same order as their type groups.
  const hubOrder = hub ? hub.types.flatMap((group) => group.games) : [];
  const games = getGamesByCategory(category.id).sort((a, b) =>
    hub ? hubOrder.indexOf(a.id) - hubOrder.indexOf(b.id) : 0
  );
  const primaryGame = games.find((game) => game.id === PRIMARY_GAME_BY_CATEGORY[category.id]) ?? games[0];

  // 获取服务器端翻译
  const t = await getTranslations({ locale, namespace: 'categories' });
  const allT = await getTranslations({ locale });
  const categoryName = t(`categoryNames.${category.id}`, { defaultMessage: category.name });
  const categoryDescription = t(`categoryDescriptions.${category.id}`, { defaultMessage: category.description });
  const categoryGamesHeading = t('categoryGamesHeading', { categoryName: categoryName });
  const categoriesTitle = t('title');
  const categoryIntro = hub
    ? t.rich(`hubs.${category.id}.intro`, {
        wm: (chunks) => (
          <Link href="/categories/working-memory" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
            {chunks}
          </Link>
        ),
      })
    : t('categoryIntro', { categoryName });
  const gameTitle = (id: string) => allT(`games.${gameTitleKey(id)}.title`);
  const pageUrl = generateAlternates(locale, `categories/${category.slug}`).canonical;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: categoryGamesHeading,
      numberOfItems: games.length,
      itemListElement: games.map((game, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: gameTitle(game.id),
        url: generateAlternates(locale, `games/${game.slug}`).canonical,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { name: allT('common.home'), url: generateAlternates(locale).canonical },
        { name: categoriesTitle, url: generateAlternates(locale, 'categories').canonical },
        { name: categoryName, url: pageUrl },
      ].map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })),
    },
  ];
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
    ? [
        ...workingMemoryReads.filter((link) => link.label),
        { href: '/categories/memory-games', label: t('hubs.memory-games.backlink') },
      ]
    : category.id === 'visual-tracking'
      ? [{
          href: '/blog/the-science-of-schulte-tables-boost-visual-attention-reading-speed',
          label: allT('games.schulteTable.science.blogArticleTitle'),
        }]
      : [];

  return (
    <LinkClickTracker fromPage={`categories/${category.slug}`} className="max-w-7xl mx-auto py-8">
      {structuredData.map((item) => (
        <script
          key={item["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
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

      {hub && (
        <div data-link-location="category_hub" className="mx-auto mt-16 max-w-3xl space-y-14">
          {(['types', 'audiences'] as const).map((part) => (
            <section key={part} aria-labelledby={`hub-${part}-title`}>
              <h2 id={`hub-${part}-title`} className="text-2xl font-bold tracking-tight">
                {t(`hubs.${category.id}.${part}Title`)}
              </h2>
              <dl className="mt-6 divide-y divide-border border-y border-border">
                {hub[part].map((group) => (
                  <div key={group.id} className="grid gap-2 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
                    <dt className="font-semibold">{t(`hubs.${category.id}.${part}.${group.id}.title`)}</dt>
                    <dd className="space-y-2 text-sm leading-7 text-muted-foreground">
                      <p>{t(`hubs.${category.id}.${part}.${group.id}.body`)}</p>
                      <p className="flex flex-wrap gap-x-4 gap-y-1">
                        {group.games.map((id) => {
                          const game = getGame(id);
                          return game ? (
                            <Link
                              key={id}
                              href={`/games/${game.slug}`}
                              className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4 hover:text-primary"
                            >
                              {gameTitle(id)}
                              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                          ) : null;
                        })}
                      </p>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          <section aria-labelledby="hub-faq-title">
            <h2 id="hub-faq-title" className="text-2xl font-bold tracking-tight">
              {t(`hubs.${category.id}.faqTitle`)}
            </h2>
            <div className="mt-6 space-y-6">
              {hub.faq.map((id) => (
                <div key={id}>
                  <h3 className="font-semibold">{t(`hubs.${category.id}.faq.${id}.q`)}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{t(`hubs.${category.id}.faq.${id}.a`)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

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
