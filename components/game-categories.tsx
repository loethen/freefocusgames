import { Link } from "@/i18n/navigation";
import { getGameCategories, getGamesByCategory } from "@/data/games";
import {
    Brain,
    BrainCircuit,
    Focus,
    Zap,
    Puzzle,
    Eye,
    Target,
    Split,
    Shuffle,
    Map,
    Gamepad2,
    Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { categories, getCategory, type Category } from "@/data/categories";
import { useTranslations } from "next-intl";

const iconMap: Record<string, React.ReactNode> = {
    Brain: <Brain className="h-4 w-4" />,
    BrainCircuit: <BrainCircuit className="h-4 w-4" />,
    Focus: <Focus className="h-4 w-4" />,
    Zap: <Zap className="h-4 w-4" />,
    PuzzlePiece: <Puzzle className="h-4 w-4" />,
    Eye: <Eye className="h-4 w-4" />,
    Target: <Target className="h-4 w-4" />,
    Split: <Split className="h-4 w-4" />,
    Shuffle: <Shuffle className="h-4 w-4" />,
    Map: <Map className="h-4 w-4" />,
    Gamepad2: <Gamepad2 className="h-4 w-4" />,
    Wind: <Wind className="h-4 w-4" />,
};

interface GameCategoriesProps {
    gameId: string;
    className?: string;
    displayAll?: boolean;
    showDescription?: boolean;
}

export default function GameCategories({
    gameId,
    className,
    displayAll = false,
    showDescription = false,
}: GameCategoriesProps) {
    const t = useTranslations("categories");
    const displayCategories: Category[] =
        gameId === "all" || displayAll 
            ? categories 
            : getGameCategories(gameId)
                .map(categoryId => getCategory(categoryId))
                .filter((category): category is Category => category !== undefined);

    if (displayCategories.length === 0) return null;

    if (gameId === "all" || displayAll) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayCategories.map((category) => {
                    const translatedName = t(`categoryNames.${category.id}`, {
                        defaultMessage: category.name,
                    });
                    const translatedDescription = t(`categoryDescriptions.${category.id}`, {
                        defaultMessage: category.description,
                    });
                    const gameCount = getGamesByCategory(category.id).length;

                    return (
                        <Link
                            title={translatedName}
                            aria-label={translatedName}
                            key={category.id}
                            href={`/categories/${category.slug}`}
                            className="block rounded-2xl border bg-card p-6 hover:bg-muted/30 hover:border-primary/30 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    {category.icon && (
                                        <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0">
                                            {iconMap[category.icon] || (
                                                <div className="w-4 h-4" />
                                            )}
                                        </div>
                                    )}
                                    <h2 className="font-semibold leading-snug">
                                        {translatedName}
                                    </h2>
                                </div>
                                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                    {t("gameCount", { count: gameCount })}
                                </span>
                            </div>
                            {showDescription && (
                                <p className="text-sm text-muted-foreground leading-6">
                                    {translatedDescription}
                                </p>
                            )}
                            <div className="mt-4 text-sm font-medium text-primary">
                                {t("browseCategory")}
                            </div>
                        </Link>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={cn("flex flex-nowrap gap-2 overflow-hidden", className)}>
            {displayCategories.map((category) => {
                const translatedName = t(`categoryNames.${category.id}`, {
                    defaultMessage: category.name,
                });

                return (
                    <Link
                        title={translatedName}
                        aria-label={translatedName}
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="px-2 py-1 bg-muted rounded-md hover:bg-muted transition-colors flex items-center gap-1 text-xs whitespace-nowrap flex-shrink-0"
                    >
                        {category.icon && iconMap[category.icon]}
                        {translatedName}
                    </Link>
                );
            })}
        </div>
    );
}
