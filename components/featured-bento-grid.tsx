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
import { GameCategoryLabel, GameCover } from "@/components/game-card";


// One featured game beside a 2x2 grid of popular games
const FEATURED_GAME_ID = 'double-decision';
const SECONDARY_GAME_IDS = ['rotating-schulte-table', 'dual-n-back', 'reaction-time', 'stroop-effect-test'];

export default function FeaturedBentoGrid() {
    const t = useTranslations("home");
    const gamesT = useTranslations("games");
    const buttonsT = useTranslations("buttons");

    const featuredGame = getGame(FEATURED_GAME_ID);
    const secondaryGames = SECONDARY_GAME_IDS.map(id => getGame(id)).filter((g): g is Game => !!g);

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

            <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[1.15fr_1fr]">
                <Link
                    href={`/games/${featuredGame.slug}`}
                    className="group flex flex-col overflow-hidden rounded-[2rem] border border-border bg-card transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <span className="relative block aspect-[16/9] overflow-hidden bg-muted/60 lg:aspect-auto lg:flex-1 lg:min-h-[240px]">
                        <GameCover game={featuredGame} title={featuredTitle} sizes="(max-width: 1023px) 92vw, 50vw" />
                    </span>
                    <span className="flex flex-col gap-2 p-5 sm:p-6">
                        <GameCategoryLabel game={featuredGame} />
                        <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{featuredTitle}</h3>
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                            {featuredDescription}
                        </p>
                        <span className="mt-2 inline-flex h-10 w-fit items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity group-hover:opacity-90">
                            <Play className="mr-2 h-4 w-4" fill="currentColor" aria-hidden="true" />
                            {buttonsT('start')}
                        </span>
                    </span>
                </Link>

                <div className="grid grid-cols-2 gap-4 sm:gap-5">
                    {secondaryGames.map((game) => (
                        <GameBentoTile key={game.id} game={game} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function GameBentoTile({ game }: { game: Game }) {
    const gamesT = useTranslations("games");
    const title = gamesT(`${getGameIdKey(game.id)}.title`);

    return (
        <Link
            href={`/games/${game.slug}`}
            className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <span className="relative block aspect-[4/3] overflow-hidden bg-muted/60 lg:aspect-auto lg:min-h-[120px] lg:flex-1">
                <GameCover game={game} title={title} sizes="(max-width: 1023px) 46vw, 22vw" />
            </span>
            <span className="flex flex-col gap-1 p-3 sm:p-4">
                <GameCategoryLabel game={game} />
                <h3 className="line-clamp-1 text-sm font-semibold tracking-tight sm:text-base">{title}</h3>
            </span>
        </Link>
    );
}

// Helper to convert snake-case ID to camelCase for translation keys
function getGameIdKey(id: string): string {
    return id.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}
