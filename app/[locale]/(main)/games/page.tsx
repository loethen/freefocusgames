import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import GamesLibraryCard from "@/components/games-library-card";
import { categories } from "@/data/categories";
import { getGames } from "@/data/games";
import { Link } from "@/i18n/navigation";
import { SITE_BASE_URL } from "@/lib/site-constants";
import { generateAlternates } from "@/lib/utils";

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: "games" });

    return {
        title: t("metaTitle"),
        description: t("metaDescription"),
        keywords: t("metaKeywords").split(",").map((keyword) => keyword.trim()),
        openGraph: {
            title: t("ogTitle"),
            description: t("ogDescription"),
            images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
        },
        alternates: generateAlternates(locale, "games"),
    };
}

const LIBRARY_ORDER = [
    "double-decision",
    "dual-n-back",
    "schulte-table",
    "reaction-time",
    "memory-matching-game",
    "block-memory-challenge",
    "stroop-effect-test",
    "focus-reaction-test",
    "frog-memory-leap",
    "mahjong-dual-n-back",
    "counting-boxes",
    "free-short-term-memory-test",
    "fish-trace",
    "larger-number",
    "focus-sudoku",
    "cps-test",
    "spacebar-clicker",
    "pomodoro-timer",
    "baby-animal-matching",
    "resonance-breathing",
    "box-breathing",
    "478-breathing",
    "challenge10Seconds",
    "sbti-test",
];

const CATEGORY_LINK_IDS = [
    "working-memory",
    "reaction-time",
    "visual-tracking",
    "sustained-attention",
    "selective-attention",
    "relaxation",
];

const CHOICE_GROUPS = [
    {
        id: "focus",
        games: [
            ["schulte-table", "schulte-table"],
            ["fish-trace", "fish-trace"],
            ["focus-reaction-test", "focus-reaction-test"],
        ],
    },
    {
        id: "memory",
        games: [
            ["dual-n-back", "dual-n-back"],
            ["block-memory-challenge", "block-memory-challenge"],
            ["frog-memory-leap", "frog-memory-leap"],
        ],
    },
    {
        id: "speed",
        games: [
            ["reaction-time", "reaction-time"],
            ["double-decision", "double-decision"],
            ["stroop-effect-test", "stroop-effect-test"],
        ],
    },
];

function gameTitleKey(id: string) {
    return id
        .replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
        .replace(/-/g, "");
}

export default async function GamesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: "games" });
    const categoryT = await getTranslations({ locale, namespace: "categories.categoryNames" });
    const orderById = new Map(LIBRARY_ORDER.map((id, index) => [id, index]));
    const games = [...getGames()].sort(
        (a, b) =>
            (orderById.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
            (orderById.get(b.id) ?? Number.MAX_SAFE_INTEGER)
    );
    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const categoryLinks = CATEGORY_LINK_IDS
        .map((id) => categoryById.get(id))
        .filter((category): category is (typeof categories)[number] => Boolean(category));
    const localePrefix = locale === "en" ? "" : `/${locale}`;
    const pageUrl = `${SITE_BASE_URL}${localePrefix}/games`;
    const getGameTitle = (id: string) => t(`${gameTitleKey(id)}.title`);

    const structuredData = [
        {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: t("heading"),
            description: t("description"),
            url: pageUrl,
            mainEntity: {
                "@type": "ItemList",
                numberOfItems: games.length,
                itemListElement: games.map((game, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    name: getGameTitle(game.id),
                    url: `${SITE_BASE_URL}${localePrefix}/games/${game.slug}`,
                })),
            },
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: t("breadcrumbHome"),
                    item: `${SITE_BASE_URL}${localePrefix || "/"}`,
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    name: t("title"),
                    item: pageUrl,
                },
            ],
        },
    ];

    return (
        <div className="mx-auto max-w-[1600px]">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <Breadcrumbs items={[{ label: t("title") }]} />

            <header className="px-2 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-14 lg:px-10">
                <p className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {t("eyebrow")}
                </p>
                <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl lg:text-6xl">
                    {t("heading")}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                    {t("description")}
                </p>
            </header>

            <nav
                aria-label={t("categoryNav.ariaLabel")}
                className="mx-2 mb-12 border-y border-border/70 py-5 sm:mx-6 lg:mx-10"
            >
                <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
                    <span className="text-sm font-medium text-foreground">
                        {t("categoryNav.label")}
                    </span>
                    {categoryLinks.map((category) => (
                        <Link
                            key={category.id}
                            href={`/categories/${category.slug}`}
                            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                        >
                            {categoryT(category.slug)}
                        </Link>
                    ))}
                    <Link
                        href="/categories"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                        {t("categoryNav.all")}
                        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </nav>

            <main className="px-2 sm:px-6 lg:px-10">
                <section aria-labelledby="all-games-title">
                    <div className="mb-7">
                        <p className="mb-2 text-sm text-muted-foreground">
                            {t("library.count", { count: games.length })}
                        </p>
                        <h2 id="all-games-title" className="text-3xl font-semibold tracking-tight">
                            {t("library.title")}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                        {games.map((game) => {
                            const titleKey = gameTitleKey(game.id);
                            const primaryCategory = game.categories
                                .map((categoryId) => categoryById.get(categoryId))
                                .find(Boolean);

                            return (
                                <GamesLibraryCard
                                    key={game.id}
                                    game={game}
                                    title={t(`${titleKey}.title`)}
                                    description={t(`${titleKey}.description`)}
                                    category={primaryCategory ? categoryT(primaryCategory.slug) : undefined}
                                    playLabel={t("play")}
                                />
                            );
                        })}
                    </div>
                </section>

                <section className="py-16 sm:py-24" aria-labelledby="choose-game-title">
                    <div className="max-w-3xl">
                        <p className="mb-3 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            {t("chooseGame.eyebrow")}
                        </p>
                        <h2 id="choose-game-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            {t("chooseGame.title")}
                        </h2>
                        <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                            {t("chooseGame.intro")}
                        </p>
                    </div>

                    <div className="mt-10 grid gap-10 border-t border-border/70 pt-8 md:grid-cols-3">
                        {CHOICE_GROUPS.map((group, index) => (
                            <article key={group.id}>
                                <p className="mb-4 font-mono text-sm text-muted-foreground">
                                    {String(index + 1).padStart(2, "0")}
                                </p>
                                <h3 className="text-xl font-semibold">
                                    {t(`chooseGame.groups.${group.id}.title`)}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    {t(`chooseGame.groups.${group.id}.description`)}
                                </p>
                                <ul className="mt-5 space-y-2.5">
                                    {group.games.map(([id, slug]) => (
                                        <li key={id}>
                                            <Link
                                                href={`/games/${slug}`}
                                                className="inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                                            >
                                                {getGameTitle(id)}
                                                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </section>

                <section
                    className="mb-12 rounded-[2rem] bg-muted/45 p-6 sm:mb-16 sm:p-9"
                    aria-labelledby="resources-title"
                >
                    <h2 id="resources-title" className="text-2xl font-semibold tracking-tight">
                        {t("resources.title")}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        {t("resources.description")}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3">
                        <Link
                            href="/working-memory-guide"
                            className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                        >
                            {t("resources.workingMemory")}
                            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                            href="/categories"
                            className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                        >
                            {t("resources.categories")}
                            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                            href="/games/pomodoro-timer"
                            className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                        >
                            {t("resources.pomodoro")}
                            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
