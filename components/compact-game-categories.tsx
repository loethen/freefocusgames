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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategory, type Category } from "@/data/categories";
import { useTranslations } from "next-intl";

const iconMap: Record<string, React.ReactNode> = {
    Brain: <Brain className="h-3 w-3" />,
    BrainCircuit: <BrainCircuit className="h-3 w-3" />,
    Focus: <Focus className="h-3 w-3" />,
    Zap: <Zap className="h-3 w-3" />,
    PuzzlePiece: <Puzzle className="h-3 w-3" />,
    Eye: <Eye className="h-3 w-3" />,
    Target: <Target className="h-3 w-3" />,
    Split: <Split className="h-3 w-3" />,
    Shuffle: <Shuffle className="h-3 w-3" />,
    Map: <Map className="h-3 w-3" />,
    Gamepad2: <Gamepad2 className="h-3 w-3" />,
    Wind: <Wind className="h-3 w-3" />,
};

interface CompactGameCategoriesProps {
    gameId: string;
    className?: string;
    maxDisplay?: number;
}

export default function CompactGameCategories({
    gameId,
    className,
    maxDisplay = 2,
}: CompactGameCategoriesProps) {
    const t = useTranslations("categories");
    const displayCategories: Category[] = getGameCategories(gameId)
        .map(categoryId => getCategory(categoryId))
        .filter((category): category is Category => category !== undefined);

    if (displayCategories.length === 0) return null;

    const visibleCategories = displayCategories.slice(0, maxDisplay);
    const remainingCount = displayCategories.length - maxDisplay;

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            {visibleCategories.map((category) => (
                <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="px-2 py-1 bg-muted hover:bg-muted/80 rounded-md transition-colors flex items-center gap-1 text-xs border border-border"
                >
                    {category.icon && iconMap[category.icon]}
                    <span className="whitespace-nowrap">
                        {t(`categoryNames.${category.id}`, {
                            defaultMessage: category.name,
                        })}
                    </span>
                </Link>
            ))}
            {remainingCount > 0 && (
                <div className="relative">
                    <span className="px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground border border-border cursor-pointer hover:bg-muted/80 transition-colors peer">
                        +{remainingCount}
                    </span>
                    {/* 悬停时显示剩余分类 */}
                    <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-lg p-2 opacity-0 hover:opacity-100 peer-hover:opacity-100 transition-opacity duration-200 pointer-events-none hover:pointer-events-auto peer-hover:pointer-events-auto z-10 min-w-max">
                        <div className="flex flex-col gap-1">
                            {displayCategories.slice(maxDisplay).map((category) => (
                                <Link
                                    key={category.id}
                                    href={`/categories/${category.slug}`}
                                    className="px-2 py-1 hover:bg-muted rounded text-xs flex items-center gap-1 whitespace-nowrap"
                                >
                                    {category.icon && iconMap[category.icon]}
                                    {t(`categoryNames.${category.id}`, {
                                        defaultMessage: category.name,
                                    })}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 
