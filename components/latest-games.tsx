'use client';

import { Link } from "@/i18n/navigation";
import { getLatestGames } from "@/data/games";
import { useTranslations } from "next-intl";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/game-card";

export default function LatestGames() {
    const t = useTranslations("home");
    const buttonsT = useTranslations("buttons");
    const latestGames = getLatestGames(3);

    if (latestGames.length === 0) return null;

    return (
        <section className="space-y-5 no-ads-inside sm:space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                    {t("latestGames")}
                </h2>
                <Button asChild variant="ghost" className="gap-2 rounded-full px-4">
                    <Link href="/games">
                        {buttonsT("viewAll")} <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 md:gap-8">
                {latestGames.map((game) => (
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
