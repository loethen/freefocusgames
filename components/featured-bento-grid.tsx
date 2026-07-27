'use client';

import { Link } from "@/i18n/navigation";
import { getGame, Game } from "@/data/games";
import { useTranslations } from "next-intl";
import {
    ArrowRight,
    Play,
    TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";


// Select specific games for the bento grid
const FEATURED_GAME_ID = 'dual-n-back';
const SECONDARY_GAME_IDS = ['schulte-table', 'sbti-test', 'reaction-time', 'stroop-effect-test', 'frog-memory-leap'];

export default function FeaturedBentoGrid() {
    const t = useTranslations("home");
    const gamesT = useTranslations("games");
    const categoriesT = useTranslations("categories");
    const buttonsT = useTranslations("buttons");

    const featuredGame = getGame(FEATURED_GAME_ID);
    const secondaryGames = SECONDARY_GAME_IDS.map(id => getGame(id)).filter((g): g is Game => !!g);

    if (!featuredGame) return null;

    const featuredGameIdKey = getGameIdKey(featuredGame.id);
    const featuredDescriptionKey = `${featuredGameIdKey}.featuredDescription`;
    const featuredDescription = gamesT.has(featuredDescriptionKey)
        ? gamesT(featuredDescriptionKey)
        : gamesT(`${featuredGameIdKey}.description`);

    return (
        <div className="space-y-6 no-ads-inside sm:space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-muted-foreground" />
                    {t("featuredGames")}
                </h2>
                <Button asChild variant="ghost" className="gap-2 rounded-full px-4">
                    <Link href="/games">
                        {buttonsT("viewAll")} <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:auto-rows-[220px]">
                <div className="group relative min-h-[480px] overflow-hidden rounded-[2rem] border border-border/70 bg-secondary/25 transition-colors hover:bg-secondary/35 lg:col-span-8 lg:row-span-2 lg:min-h-0">
                    <div className="flex h-full flex-col p-5 sm:p-9 lg:p-10">
                        <div className="flex items-start justify-between gap-4">
                            <span
                                className="font-mono text-xs tracking-[0.18em] text-muted-foreground"
                                aria-hidden="true"
                            >
                                01
                            </span>
                            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                {categoriesT(`categoryNames.${featuredGame.categories[0]}`)}
                            </span>
                        </div>

                        <div className="grid flex-1 items-center gap-6 pt-6 sm:gap-8 sm:pt-7 md:grid-cols-[0.95fr_1.05fr]">
                            <div className="order-2 md:order-1">
                                <h3 className="text-3xl font-bold tracking-tight md:text-4xl">
                                    {gamesT(`${featuredGameIdKey}.title`)}
                                </h3>
                                <p className="mt-4 line-clamp-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
                                    {featuredDescription}
                                </p>

                                <Button asChild size="lg" className="mt-7 h-11 w-full rounded-full px-7 text-sm shadow-none sm:w-fit">
                                    <Link href={`/games/${featuredGame.slug}`}>
                                        <Play className="mr-2 h-5 w-5" fill="currentColor" />
                                        {buttonsT('start')}
                                    </Link>
                                </Button>
                            </div>

                            <div className="order-1 flex min-h-[220px] items-center justify-center md:order-2 md:min-h-0">
                                <div className="relative w-full max-w-[380px] overflow-hidden rounded-3xl bg-background/70 shadow-sm">
                                    {featuredGame.preview}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {secondaryGames.map((game, index) => (
                    <GameBentoCard key={game.id} game={game} index={index + 2} />
                ))}
            </div>
        </div>
    );
}

// Sub-component for standard bento cards
function GameBentoCard({ game, index }: { game: Game; index: number }) {
    const gamesT = useTranslations("games");
    const idKey = getGameIdKey(game.id);
    const title = gamesT(`${idKey}.title`);

    return (
        <Link
            href={`/games/${game.slug}`}
            className="group relative min-h-[210px] overflow-hidden rounded-[2rem] border border-border/70 bg-card p-5 transition-colors hover:bg-secondary/20 sm:p-6 lg:col-span-4 lg:min-h-0"
        >
            <div className="flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                    <span
                        className="font-mono text-xs tracking-[0.18em] text-muted-foreground"
                        aria-hidden="true"
                    >
                        {String(index).padStart(2, "0")}
                    </span>
                    <ArrowRight
                        className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-foreground"
                        aria-hidden="true"
                    />
                </div>

                <div>
                    <h3 className="line-clamp-2 text-xl font-semibold tracking-tight">
                        {title}
                    </h3>
                    <p className="mt-3 line-clamp-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        {gamesT(`${idKey}.description`)}
                    </p>
                </div>
            </div>
        </Link>
    );
}

// Helper to convert snake-case ID to camelCase for translation keys
function getGameIdKey(id: string): string {
    return id.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}
