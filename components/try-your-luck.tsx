'use client';

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, Shuffle } from "lucide-react";

import { getGame, type Game } from "@/data/games";
import GameCard from "@/components/game-card";
import { Button } from "@/components/ui/button";

// Keep this list focused on games that are fun to discover, even when they are
// not part of the homepage's most-search-oriented sections.
const TRY_YOUR_LUCK_GAME_IDS = [
    "counting-boxes",
    "baby-animal-matching",
    "focus-sudoku",
    "larger-number",
    "memory-matching-game",
    "free-short-term-memory-test",
    "fish-trace",
] as const;

const INITIAL_GAME_IDS = TRY_YOUR_LUCK_GAME_IDS.slice(0, 3);
const PICKS_PER_REFRESH = 3;

function shuffle<T>(items: readonly T[]): T[] {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
}

function pickNewGameIds(currentIds: readonly string[]): string[] {
    const availableIds = TRY_YOUR_LUCK_GAME_IDS.filter((id) => !currentIds.includes(id));
    return shuffle(availableIds).slice(0, PICKS_PER_REFRESH);
}

export default function TryYourLuck() {
    const t = useTranslations("home");
    const [gameIds, setGameIds] = useState<string[]>([...INITIAL_GAME_IDS]);

    const refreshGames = () => {
        setGameIds((currentIds) => pickNewGameIds(currentIds));
    };

    const selectedGames = gameIds
        .map((id) => getGame(id))
        .filter((game): game is Game => Boolean(game));

    return (
        <section aria-labelledby="try-your-luck-title" className="space-y-5 no-ads-inside sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 id="try-your-luck-title" className="flex items-center gap-2 text-2xl font-semibold">
                        <Shuffle className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                        {t("tryLuck.title")}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {t("tryLuck.subtitle")}
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={refreshGames}
                    aria-label={t("tryLuck.refreshAriaLabel")}
                    className="w-fit gap-2 rounded-full"
                >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {t("tryLuck.refresh")}
                </Button>
            </div>

            <div
                aria-live="polite"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 md:gap-8"
            >
                {selectedGames.map((game) => (
                    <GameCard
                        key={game.id}
                        game={game}
                        preview={game.preview}
                        className="h-full"
                    />
                ))}
            </div>
        </section>
    );
}
