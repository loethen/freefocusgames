'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";

import GameCard from "@/components/game-card";
import { getGame, type Game } from "@/data/games";
import { cn } from "@/lib/utils";

const CARD_WIDTH = "w-[82%] shrink-0 snap-start sm:w-[45%] lg:w-[29%]";

// Match the homepage Popular Games rail hover halo.
const HALO_CARD = cn(
    "h-full transition-[border-color,box-shadow,transform]",
    "hover:[box-shadow:0_0_0_3px_hsl(var(--primary)/0.08)]"
);

interface CategoryGameRailProps {
    title: string;
    description: string;
    gameIds: string[];
    priorityCount?: number;
    prevLabel: string;
    nextLabel: string;
}

/**
 * Single-row horizontal scroll rail for grouped games on category Hub pages.
 * Accepts plain gameIds so JSX previews never cross the Server-to-Client boundary.
 */
export function CategoryGameRail({
    title,
    description,
    gameIds,
    priorityCount = 0,
    prevLabel,
    nextLabel,
}: CategoryGameRailProps) {
    const railRef = useRef<HTMLUListElement>(null);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const railGames = gameIds
        .map((id) => getGame(id))
        .filter((game): game is Game => Boolean(game));

    const updateScrollState = useCallback(() => {
        const rail = railRef.current;
        if (!rail) return;
        setCanScrollPrev(rail.scrollLeft > 4);
        setCanScrollNext(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4);
    }, []);

    useEffect(() => {
        const rail = railRef.current;
        if (!rail) return;
        updateScrollState();
        rail.addEventListener("scroll", updateScrollState, { passive: true });
        window.addEventListener("resize", updateScrollState);
        return () => {
            rail.removeEventListener("scroll", updateScrollState);
            window.removeEventListener("resize", updateScrollState);
        };
    }, [updateScrollState]);

    const scrollByPage = (direction: 1 | -1) => {
        const rail = railRef.current;
        if (!rail) return;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        rail.scrollBy({
            left: direction * rail.clientWidth * 0.9,
            behavior: reduceMotion ? "auto" : "smooth",
        });
    };

    if (railGames.length === 0) return null;

    const showArrows = canScrollPrev || canScrollNext;

    return (
        <div>
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                        {description}
                    </p>
                </div>
                {showArrows && (
                    <div className="hidden items-center gap-1 sm:flex">
                        <RailArrow
                            icon={ArrowLeft}
                            label={prevLabel}
                            disabled={!canScrollPrev}
                            onClick={() => scrollByPage(-1)}
                        />
                        <RailArrow
                            icon={ArrowRight}
                            label={nextLabel}
                            disabled={!canScrollNext}
                            onClick={() => scrollByPage(1)}
                        />
                    </div>
                )}
            </div>

            {/* Padding keeps the cards' hover lift and focus ring from being clipped by the scroll box. */}
            <ul
                ref={railRef}
                className="scrollbar-hide -mx-1 mt-4 flex snap-x snap-mandatory scroll-px-1 gap-4 overflow-x-auto overscroll-x-contain px-1 py-2 sm:gap-5"
            >
                {railGames.map((game, index) => (
                    <li key={game.id} className={CARD_WIDTH}>
                        <GameCard
                            game={game}
                            priority={index < priorityCount}
                            className={HALO_CARD}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}

function RailArrow({
    icon: Icon,
    label,
    disabled,
    onClick,
}: {
    icon: LucideIcon;
    label: string;
    disabled: boolean;
    onClick: () => void;
}) {
    const nudge =
        Icon === ArrowLeft ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className="group flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30"
        >
            <Icon
                className={cn("h-5 w-5 transition-transform motion-reduce:transition-none", nudge)}
                strokeWidth={1.5}
                aria-hidden="true"
            />
        </button>
    );
}
