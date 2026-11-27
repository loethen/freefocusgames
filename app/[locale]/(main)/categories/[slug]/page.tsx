import { getCategoryBySlug, categories } from "@/data/categories";
import { getGame, getGamesByCategory } from "@/data/games";
import GameCard from "@/components/game-card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from "@/i18n/routing";
import { getBlogPost } from "@/lib/blog";
import { buildFaqSchema } from "@/lib/schema";
import { generateAlternates } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import LinkClickTracker from "@/components/link-click-tracker";
import { ArrowRight, Play } from "lucide-react";
import Image from "next/image";
import { filterGamesForLocale, isPathAvailable } from '@/lib/locale-availability';
import ReactionTimeGame from "@/app/[locale]/(main)/games/reaction-time/components/ReactionTimeGame";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CategoryGameRail } from "@/components/category-game-rail";

export const dynamic = "force-static";
export const revalidate = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    categories
      .filter((category) => isPathAvailable(locale, `categories/${category.slug}`))
      .map((category) => ({
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

// Grid order for categories whose registry order buries the best match.
// Games not listed here follow in registry order.
const CATEGORY_GAME_ORDER: Record<string, string[]> = {
  "reaction-time": [
    "reaction-time",
    "f1-reaction-test",
    "challenge10Seconds",
    "psychomotor-vigilance-test",
    "double-decision",
    "larger-number",
    "focus-reaction-test",
    "stroop-effect-test",
    "cps-test",
    "spacebar-clicker",
  ],
};

type HubGroup = { id: string; games: string[] };

// Hub categories target a broad search term, so they get their own title and
// grouped content. Copy lives under categories.hubs.<category id>.
const HUBS: Record<string, { types: HubGroup[]; audiences: HubGroup[]; faq: string[] }> = {
  "reaction-time": {
    types: [
      { id: "simple", games: ["reaction-time", "f1-reaction-test", "challenge10Seconds", "psychomotor-vigilance-test"] },
      { id: "choice", games: ["double-decision", "larger-number", "focus-reaction-test", "stroop-effect-test"] },
      { id: "clicking", games: ["cps-test", "spacebar-clicker"] },
    ],
    audiences: [
      { id: "gamers", games: ["reaction-time", "f1-reaction-test", "cps-test"] },
      { id: "sports", games: ["reaction-time", "double-decision", "focus-reaction-test"] },
      { id: "quickBreaks", games: ["challenge10Seconds", "spacebar-clicker", "stroop-effect-test"] },
    ],
    faq: ["free", "goodTime", "whichGame", "improve"],
  },
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

// Categories with dedicated psychology-grounded definitions inside the existing About section.
const CUSTOM_INTRO_CATEGORIES = new Set([
  "working-memory",
  "adhd-games",
  "cognitive-flexibility",
]);

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
  const listOrder = CATEGORY_GAME_ORDER[category.id];
  const order = listOrder ?? (hub ? hubOrder : null);
  const rank = (id: string) => {
    if (!order) return 0;
    const index = order.indexOf(id);
    return index === -1 ? order.length : index;
  };
  // A partially translated locale (Japanese) lists only its own games.
  const games = filterGamesForLocale(locale, getGamesByCategory(category.id)).sort(
    (a, b) => rank(a.id) - rank(b.id)
  );
  const primaryGame = games.find((game) => game.id === PRIMARY_GAME_BY_CATEGORY[category.id]) ?? games[0];
  const isReactionHub = category.id === 'reaction-time';

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
        test: (chunks) => (
          <Link href="/games/reaction-time" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
            {chunks}
          </Link>
        ),
      })
    : CUSTOM_INTRO_CATEGORIES.has(category.id)
      ? t(`categoryIntros.${category.id}`)
      : t('categoryIntro', { categoryName });
  const gameTitle = (id: string) => allT(`games.${gameTitleKey(id)}.title`);
  const pageUrl = generateAlternates(locale, `categories/${category.slug}`).canonical;
  const faqSchemaItems = hub
    ? hub.faq.map((id) => ({
        question: t(`hubs.${category.id}.faq.${id}.q`),
        answer: t(`hubs.${category.id}.faq.${id}.a`),
      }))
    : [];
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
    ...(faqSchemaItems.length > 0 ? [buildFaqSchema(faqSchemaItems)] : []),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { name: allT('common.home'), url: generateAlternates(locale).canonical },
        ...(isPathAvailable(locale, 'categories')
          ? [{ name: categoriesTitle, url: generateAlternates(locale, 'categories').canonical }]
          : []),
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
  const reactionPosts = isReactionHub
    ? await Promise.all(
        ['what-is-a-good-reaction-time', 'how-to-improve-reaction-time'].map((slug) =>
          getBlogPost(slug, locale)
        )
      )
    : [];
  const reactionReadingCards = isReactionHub
    ? [
        reactionPosts[0]?.title
          ? {
              href: '/blog/what-is-a-good-reaction-time',
              eyebrow: t('hubs.reaction-time.guides.dataEyebrow'),
              title: reactionPosts[0].title,
              description: reactionPosts[0].excerpt,
              cta: t('hubs.reaction-time.guides.readMore'),
            }
          : null,
        reactionPosts[1]?.title
          ? {
              href: '/blog/how-to-improve-reaction-time',
              eyebrow: t('hubs.reaction-time.guides.guideEyebrow'),
              title: reactionPosts[1].title,
              description: reactionPosts[1].excerpt,
              cta: t('hubs.reaction-time.guides.readMore'),
            }
          : null,
        {
          href: '/benchmarks',
          eyebrow: t('hubs.reaction-time.guides.benchmarksEyebrow'),
          title: t('hubs.reaction-time.benchmarksLink'),
          description: t('hubs.reaction-time.guides.benchmarksDescription'),
          cta: t('hubs.reaction-time.guides.viewBenchmarks'),
        },
      ].filter((card): card is NonNullable<typeof card> => card !== null && isPathAvailable(locale, card.href))
    : [];
  const readingLinks = (category.id === 'working-memory'
    ? [
        ...workingMemoryReads.filter((link) => link.label),
        { href: '/categories/memory-games', label: t('hubs.memory-games.backlink') },
      ]
    : category.id === 'visual-tracking'
      ? [{
          href: '/blog/the-science-of-schulte-tables-boost-visual-attention-reading-speed',
          label: allT('games.schulteTable.science.blogArticleTitle'),
        }]
      : []).filter((link) => isPathAvailable(locale, link.href));
  const hubGroups = (part: 'types' | 'audiences') => (hub?.[part] ?? [])
    .map((group) => ({ ...group, games: group.games.filter((id) => {
      const game = getGame(id);
      return !!game && isPathAvailable(locale, `games/${game.slug}`);
    }) }))
    .filter((group) => group.games.length > 0);

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

      <header className={`mx-auto mt-10 ${isReactionHub ? 'mb-8' : 'mb-12'} max-w-3xl text-center`}>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {categoryGamesHeading}
        </h1>
        <p className="mt-4 leading-7 text-foreground/80">{categoryDescription}</p>

        {!isReactionHub && primaryGame && (
          <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/games/${primaryGame.slug}`}
              data-link-location="category_primary_cta"
              className="group inline-flex items-center gap-4 rounded-2xl bg-primary p-2 pr-6 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              {/* The game's cover at full 16:9, so it is clear the button opens that game */}
              <span className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-xl bg-background">
                {primaryGame.coverImage && (
                  <Image
                    src={primaryGame.coverImage}
                    alt=""
                    fill
                    priority
                    sizes="128px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </span>
              <span className="inline-flex items-center gap-2">
                <Play className="h-5 w-5" fill="currentColor" aria-hidden="true" />
                {t('playNow', { game: allT(`games.${gameTitleKey(primaryGame.id)}.title`) })}
              </span>
            </Link>
            {isPathAvailable(locale, 'get-started') && (
              <Link
                href="/get-started"
                data-link-location="category_game_picker"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {t('notSure')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        )}
      </header>

      {isReactionHub && (
        <section aria-label={allT('games.reactionTime.title')} className="mx-auto mb-12 max-w-4xl">
          <ReactionTimeGame variant="embedded" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <Link
              href="/games/reaction-time"
              data-link-location="category_primary_cta"
              className="inline-flex items-center gap-1.5 font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              {t('hubs.reaction-time.fullTestLink')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {isPathAvailable(locale, 'get-started') && (
              <Link
                href="/get-started"
                data-link-location="category_game_picker"
                className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
              >
                {t('notSure')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </section>
      )}

      <section aria-labelledby="category-games-title" data-link-location="category_grid">
        <h2 id="category-games-title" className="mb-5 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {t('gridTitle', { count: games.length, categoryName })}
        </h2>
        {isReactionHub ? (
          <div className="space-y-10">
            {hubGroups('types').map((group, groupIndex) => (
              <CategoryGameRail
                key={group.id}
                title={t(`hubs.reaction-time.types.${group.id}.title`)}
                description={t(`hubs.reaction-time.types.${group.id}.body`)}
                gameIds={group.games}
                priorityCount={groupIndex === 0 ? 3 : 0}
                prevLabel={allT('home.featuredPrev')}
                nextLabel={allT('home.featuredNext')}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {games.map((game, index) => (
              <GameCard key={game.id} game={game} priority={index < 3} />
            ))}
          </div>
        )}
      </section>

      {hub && isReactionHub && (
        <>
          <div aria-hidden="true" className="mx-auto my-14 h-px w-16 bg-border" />
          <div data-link-location="category_hub" className="mt-0 space-y-16">
          <section aria-labelledby="hub-audiences-title" className="mx-auto max-w-5xl">
            <h2 id="hub-audiences-title" className="text-2xl font-bold tracking-tight">
              {t(`hubs.${category.id}.audiencesTitle`)}
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {hubGroups('audiences').map((group) => (
                <div
                  key={group.id}
                  className="flex flex-col justify-between rounded-2xl bg-muted/40 p-5 sm:p-6"
                >
                  <div>
                    <h3 className="text-base font-semibold">
                      {t(`hubs.${category.id}.audiences.${group.id}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {t(`hubs.${category.id}.audiences.${group.id}.body`)}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.games.map((id) => {
                      const game = getGame(id);
                      return game ? (
                        <Link
                          key={id}
                          href={`/games/${game.slug}`}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          {gameTitle(id)}
                          <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        </Link>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="hub-faq-title" className="mx-auto max-w-3xl">
            <h2 id="hub-faq-title" className="text-2xl font-bold tracking-tight">
              {t(`hubs.${category.id}.faqTitle`)}
            </h2>
            <Accordion type="single" collapsible defaultValue="faq-0" className="mt-5">
              {hub.faq.map((id, index) => (
                <AccordionItem key={id} value={`faq-${index}`} className="border-border/60">
                  <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline">
                    {t(`hubs.${category.id}.faq.${id}.q`)}
                  </AccordionTrigger>
                  <AccordionContent forceMount className="text-sm leading-7 text-muted-foreground">
                    {t(`hubs.${category.id}.faq.${id}.a`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
          </div>
        </>
      )}

      {hub && !isReactionHub && (
        <div data-link-location="category_hub" className="mx-auto mt-16 max-w-3xl space-y-14">
          {(['types', 'audiences'] as const).map((part) => (
            <section key={part} aria-labelledby={`hub-${part}-title`}>
              <h2 id={`hub-${part}-title`} className="text-2xl font-bold tracking-tight">
                {t(`hubs.${category.id}.${part}Title`)}
              </h2>
              <dl className="mt-6 divide-y divide-border border-y border-border">
                {hubGroups(part).map((group) => (
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

      {isReactionHub ? (
        <section
          aria-labelledby="category-about-title"
          data-link-location="category_about"
          className="mx-auto mt-16 max-w-5xl rounded-3xl bg-muted/40 p-6 sm:p-8 lg:p-10"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="category-about-title" className="text-2xl font-bold tracking-tight text-foreground">
                {t('aboutTitle', { categoryName })}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                {categoryIntro}
              </p>
            </div>
            {isPathAvailable(locale, 'categories') && (
              <Link
                href="/categories"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {t('backToAll')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>

          {reactionReadingCards.length > 0 && (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {reactionReadingCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group flex flex-col justify-between rounded-2xl bg-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {card.eyebrow}
                    </div>
                    <h3 className="mt-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                      {card.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    {card.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : (
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
          {isPathAvailable(locale, 'categories') && (
            <p>
              <Link href="/categories" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
                {t('backToAll')}
              </Link>
            </p>
          )}
        </section>
      )}
    </LinkClickTracker>
  );
} 
