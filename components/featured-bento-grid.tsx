'use client';

import { Link } from "@/i18n/navigation";
import { getGame, Game } from "@/data/games";
import { useTranslations } from "next-intl";
import { ArrowRight, Play, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";


// Select specific games for the bento grid
const FEATURED_GAME_ID = 'dual-n-back';
const SECONDARY_GAME_IDS = ['schulte-table', 'sbti-test', 'reaction-time', 'stroop-effect-test', 'frog-memory-leap'];

// Helper icons - mapped by ID for specific ones, default for others
const GAME_ICONS: Record<string, string> = {
    'schulte-table': '⚡',
    'dual-n-back': '🧠',
    'sbti-test': '🔥',
    'reaction-time': '⏱️',
    'stroop-effect-test': '🎨',
    'frog-memory-leap': '🐸'
};

export default function FeaturedBentoGrid() {
    const t = useTranslations("home");
    const gamesT = useTranslations("games");
    const categoriesT = useTranslations("categories");
    const buttonsT = useTranslations("buttons");

    const featuredGame = getGame(FEATURED_GAME_ID);
    const secondaryGames = SECONDARY_GAME_IDS.map(id => getGame(id)).filter((g): g is Game => !!g);

    if (!featuredGame) return null;

    // Split secondary games into first column (next to main) and bottom row
    const sideGames = secondaryGames.slice(0, 2);
    const bottomGames = secondaryGames.slice(2, 5);
    const featuredGameIdKey = getGameIdKey(featuredGame.id);
    const featuredDescriptionKey = `${featuredGameIdKey}.featuredDescription`;
    const featuredDescription = gamesT.has(featuredDescriptionKey)
        ? gamesT(featuredDescriptionKey)
        : gamesT(`${featuredGameIdKey}.description`);

    return (
        <div className="space-y-8 no-ads-inside">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-orange-500" />
                    {t("featuredGames")}
                </h3>
                <Link href="/games">
                    <Button variant="ghost" className="gap-2">
                        {buttonsT("viewAll")} <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Featured Game - Spans 2 cols */}
                <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gray-50 dark:bg-zinc-900 border border-border transition-all hover:shadow-xl group">
                    <div className="flex flex-col-reverse md:flex-row h-full">
                        {/* Content Section - Left (Desktop) / Bottom (Mobile) */}
                        <div className="flex-1 p-8 flex flex-col justify-center gap-6 z-10 relative bg-white/50 dark:bg-black/20 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
                            <div>
                                <h3 className="text-3xl md:text-4xl font-bold mb-3">
                                    {gamesT(`${featuredGameIdKey}.title`)}
                                </h3>
                                <p className="text-muted-foreground text-lg line-clamp-3 mb-4">
                                    {featuredDescription}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {featuredGame.categories.map(cat => (
                                        <span key={cat} className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                                            {categoriesT(`categoryNames.${cat}`)}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <Link href={`/games/${featuredGame.slug}`}>
                                <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-lg hover:translate-y-[-2px] transition-transform w-full md:w-auto">
                                    <Play className="mr-2 h-5 w-5" fill="currentColor" />
                                    {buttonsT('start')}
                                </Button>
                            </Link>
                        </div>

                        {/* Visual Section - Right (Desktop) / Top (Mobile) */}
                        <div className="flex-1 min-h-[300px] md:min-h-[400px] flex items-center justify-center relative">
                            {/* Decorative background glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl transform scale-75 opacity-50" />

                            <div className="relative z-0 flex w-full h-full items-center justify-center p-4 md:p-6 lg:p-8 transform group-hover:scale-[1.02] transition-transform duration-700 ease-in-out">
                                {featuredGame.preview}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side Column Games (Stacked) */}
                <div className="grid grid-rows-2 gap-6 h-full">
                    {sideGames.map(game => (
                        <GameBentoCard key={game.id} game={game} />
                    ))}
                </div>

                {/* Bottom Row Games */}
                {bottomGames.length > 0 && (
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {bottomGames.map(game => (
                            <GameBentoCard key={game.id} game={game} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-component for standard bento cards
function GameBentoCard({ game }: { game: Game }) {
    const gamesT = useTranslations("games");
    const idKey = getGameIdKey(game.id);

    return (
        <Link
            href={`/games/${game.slug}`}
            className="relative group overflow-hidden rounded-3xl bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors h-[200px] lg:h-auto min-h-[180px]"
        >
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-background shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {GAME_ICONS[game.id] || '🎮'}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                        <div className="bg-background rounded-full p-2 shadow-sm">
                            <ArrowRight className="h-4 w-4" />
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-lg mb-1 line-clamp-1">
                        {gamesT(`${idKey}.title`)}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
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
