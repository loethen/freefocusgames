'use client';

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getGame, Game } from "@/data/games";
import { useTranslations } from "next-intl";
import {
    ArrowRight,
    Blocks,
    Grid3x3,
    Orbit,
    Palette,
    Play,
    TrendingUp,
    Zap,
    type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameCategoryLabel } from "@/components/game-card";


// One featured game with its cover, beside a quiet list of popular games.
// The list uses matching line icons instead of covers, whose mixed art styles clash at small sizes.
const FEATURED_GAME_ID = 'double-decision';
const POPULAR_GAMES: { id: string; icon: LucideIcon }[] = [
    { id: 'rotating-schulte-table', icon: Orbit },
    { id: 'dual-n-back', icon: Grid3x3 },
    { id: 'reaction-time', icon: Zap },
    { id: 'stroop-effect-test', icon: Palette },
    { id: 'block-memory-challenge', icon: Blocks },
];

export default function FeaturedBentoGrid() {
    const t = useTranslations("home");
    const gamesT = useTranslations("games");
    const buttonsT = useTranslations("buttons");

    const featuredGame = getGame(FEATURED_GAME_ID);
    const popularGames = POPULAR_GAMES
        .map(({ id, icon }) => ({ game: getGame(id), icon }))
        .filter((item): item is { game: Game; icon: LucideIcon } => !!item.game);

    if (!featuredGame) return null;

    const featuredGameIdKey = getGameIdKey(featuredGame.id);
    const featuredTitle = gamesT(`${featuredGameIdKey}.title`);
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

            <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[1.35fr_1fr]">
                <Link
                    href={`/games/${featuredGame.slug}`}
                    className="group flex flex-col overflow-hidden rounded-[2rem] border border-border bg-card transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {featuredGame.coverImage && (
                        <span className="relative block aspect-video overflow-hidden bg-muted/60">
                            <Image
                                src={featuredGame.coverImage}
                                alt=""
                                fill
                                sizes="(max-width: 1023px) 92vw, 55vw"
                                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
                            />
                        </span>
                    )}
                    <span className="flex flex-1 flex-col gap-2 p-5 sm:p-7">
                        <GameCategoryLabel game={featuredGame} />
                        <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{featuredTitle}</h3>
                        <p className="line-clamp-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                            {featuredDescription}
                        </p>
                        <span className="mt-auto inline-flex h-10 w-fit items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity group-hover:opacity-90">
                            <Play className="mr-2 h-4 w-4" fill="currentColor" aria-hidden="true" />
                            {buttonsT('start')}
                        </span>
                    </span>
                </Link>

                <ul className="flex flex-col overflow-hidden rounded-[2rem] bg-muted/50 p-2">
                    {popularGames.map(({ game, icon }) => (
                        <li key={game.id} className="flex flex-1">
                            <PopularGameRow game={game} icon={icon} />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function PopularGameRow({ game, icon: Icon }: { game: Game; icon: LucideIcon }) {
    const gamesT = useTranslations("games");
    const idKey = getGameIdKey(game.id);

    return (
        <Link
            href={`/games/${game.slug}`}
            className="group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 transition-colors hover:bg-background/80 focus-visible:bg-background/80 focus-visible:outline-none sm:px-5"
        >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-foreground/70 shadow-sm transition-colors group-hover:text-foreground">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <h3 className="truncate text-base font-semibold tracking-tight">{gamesT(`${idKey}.title`)}</h3>
                <span className="line-clamp-1 text-sm text-muted-foreground">{gamesT(`${idKey}.description`)}</span>
            </span>
            <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
            />
        </Link>
    );
}

// Helper to convert snake-case ID to camelCase for translation keys
function getGameIdKey(id: string): string {
    return id.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}
