import { Link } from "@/i18n/navigation";
import { getGameCategories } from "@/data/games";
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
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategory, type Category } from "@/data/categories";
import { useTranslations } from "next-intl";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
    Brain,
    BrainCircuit,
    Focus,
    Zap,
    PuzzlePiece: Puzzle,
    Eye,
    Target,
    Split,
    Shuffle,
    Map,
    Gamepad2,
    Wind,
};

interface GameCategoriesProps {
    gameId: string;
    className?: string;
}

// Category chips for a single game.
export default function GameCategories({ gameId, className }: GameCategoriesProps) {
    const t = useTranslations("categories");
    const displayCategories: Category[] = getGameCategories(gameId)
        .map(categoryId => getCategory(categoryId))
        .filter((category): category is Category => category !== undefined);

    if (displayCategories.length === 0) return null;

    return (
        <div className={cn("flex flex-nowrap gap-2 overflow-hidden", className)}>
            {displayCategories.map((category) => {
                const translatedName = t(`categoryNames.${category.id}`, {
                    defaultMessage: category.name,
                });
                const Icon = category.icon ? CATEGORY_ICONS[category.icon] : undefined;

                return (
                    <Link
                        title={translatedName}
                        aria-label={translatedName}
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="px-2 py-1 bg-muted rounded-md hover:bg-muted transition-colors flex items-center gap-1 text-xs whitespace-nowrap flex-shrink-0"
                    >
                        {Icon && <Icon className="h-4 w-4" />}
                        {translatedName}
                    </Link>
                );
            })}
        </div>
    );
}
