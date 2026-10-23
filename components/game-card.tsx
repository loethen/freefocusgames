import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Game } from "@/data/games";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Small accent per category. Covers share one neutral stage, so colour only
// appears on this dot and the page stays calm even with many categories.
const CATEGORY_DOT: Record<string, string> = {
    "working-memory": "#7F77DD",
    "visual-tracking": "#1D9E75",
    "sustained-attention": "#378ADD",
    "selective-attention": "#D4537E",
    "divided-attention": "#BA7517",
    "reaction-time": "#D85A30",
    "cognitive-flexibility": "#639922",
    "spatial-memory": "#0F6E56",
    "adhd-games": "#993556",
    "brain-games-for-kids": "#EF9F27",
    relaxation: "#5DCAA5",
    "personality-tests": "#F0997B",
};

interface GameCardProps {
    game: Game;
    variant?: "standard" | "compact";
    isNew?: boolean;
    className?: string;
}

function gameTitleKey(id: string) {
    return id.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase()).replace(/-/g, "");
}

function GameCover({ game, title, sizes }: { game: Game; title: string; sizes: string }) {
    if (game.coverImage) {
        return (
            <Image
                src={game.coverImage}
                alt=""
                fill
                sizes={sizes}
                className={cn(
                    "transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none",
                    // Contained covers have their own white backdrop; multiply blends it into the stage.
                    game.coverFit === "contain"
                        ? "object-contain p-4 mix-blend-multiply dark:mix-blend-normal"
                        : "object-cover"
                )}
            />
        );
    }
    if (game.preview) {
        return (
            <div className="h-full w-full [&>*]:!h-full [&>*]:!min-h-0 [&>*]:!w-full [&>*]:!rounded-none">
                {game.preview}
            </div>
        );
    }
    return (
        <span className="flex h-full items-end p-4 text-lg font-semibold leading-tight text-foreground/70">
            {title}
        </span>
    );
}

export default function GameCard({ game, variant = "standard", isNew = false, className }: GameCardProps) {
    const t = useTranslations("games");
    const categoryT = useTranslations("categories.categoryNames");
    const titleKey = gameTitleKey(game.id);
    const title = t(`${titleKey}.title`);
    const category = game.categories.find((id) => categoryT.has(id));

    const categoryLabel = category && (
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORY_DOT[category] ?? "#888780" }}
            />
            <span className="truncate">{categoryT(category)}</span>
        </span>
    );

    if (variant === "compact") {
        return (
            <Link
                href={`/games/${game.slug}`}
                className={cn(
                    "group flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card pr-4 transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    className
                )}
            >
                <span className="relative h-16 w-16 shrink-0 overflow-hidden bg-muted/60">
                    <GameCover game={game} title={title} sizes="64px" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5 py-3">
                    {categoryLabel}
                    <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
                </span>
                <ArrowRight
                    aria-hidden="true"
                    className="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                />
            </Link>
        );
    }

    return (
        <Link
            href={`/games/${game.slug}`}
            className={cn(
                "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                className
            )}
        >
            <span className="relative block aspect-[16/10] overflow-hidden bg-muted/60">
                <GameCover
                    game={game}
                    title={title}
                    sizes="(max-width: 639px) 92vw, (max-width: 1279px) 46vw, 31vw"
                />
            </span>
            <span className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
                <span className="flex items-center gap-2">
                    {categoryLabel}
                    {isNew && (
                        <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            {t("newBadge")}
                        </span>
                    )}
                </span>
                <h3 className="flex items-center gap-1.5 text-lg font-semibold tracking-tight text-foreground">
                    {title}
                    <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                    />
                </h3>
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {t(`${titleKey}.description`)}
                </p>
            </span>
        </Link>
    );
}
