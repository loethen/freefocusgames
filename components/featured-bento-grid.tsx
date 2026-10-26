'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { getGame, Game } from "@/data/games";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, TrendingUp, type LucideIcon } from "lucide-react";
import GameCard from "@/components/game-card";
import { cn } from "@/lib/utils";


// Popular games as one horizontal rail of equal cards, scrolled by the visitor only (no autoplay).
// A partly visible card at the edge signals there is more to see.
const POPULAR_GAME_IDS = [
    'double-decision',
    'reaction-time',
    'rotating-schulte-table',
    'dual-n-back',
    'stroop-effect-test',
    'block-memory-challenge',
];

const CARD_WIDTH = "w-[82%] shrink-0 snap-start sm:w-[45%] lg:w-[29%]";

// On hover a thin neutral halo appears just outside the card's border.
const HALO_CARD = cn(
    "h-full transition-[border-color,box-shadow,transform]",
    "hover:[box-shadow:0_0_0_3px_hsl(var(--primary)/0.08)]"
);

export default function FeaturedBentoGrid() {
    const t = useTranslations("home");

    const railRef = useRef<HTMLUListElement>(null);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(true);
    // "idle" renders cards as-is; "hidden" → "shown" plays a staggered entrance when the rail scrolls into view.
    const [entrance, setEntrance] = useState<'idle' | 'hidden' | 'shown'>('idle');

    const popularGames = POPULAR_GAME_IDS
        .map((id) => getGame(id))
        .filter((game): game is Game => !!game);

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

    useEffect(() => {
        const rail = railRef.current;
        if (!rail || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        // Skip the entrance if the rail is already on screen at load, so nothing visible blinks out.
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setEntrance((phase) => (phase === 'hidden' ? 'shown' : phase));
                observer.disconnect();
            } else {
                setEntrance((phase) => (phase === 'idle' ? 'hidden' : phase));
            }
        }, { threshold: 0.2 });
        observer.observe(rail);
        return () => observer.disconnect();
    }, []);

    const scrollByPage = (direction: 1 | -1) => {
        const rail = railRef.current;
        if (!rail) return;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        rail.scrollBy({ left: direction * rail.clientWidth * 0.9, behavior: reduceMotion ? "auto" : "smooth" });
    };

    if (popularGames.length === 0) return null;

    const entranceClass = (index: number) => ({
        className: cn(
            entrance !== 'idle' && "transition-[opacity,transform] duration-500 ease-out",
            entrance === 'hidden' && "translate-y-3 opacity-0"
        ),
        style: entrance === 'shown' ? { transitionDelay: `${index * 70}ms` } : undefined,
    });

    return (
        <div className="space-y-6 no-ads-inside sm:space-y-8">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-muted-foreground" />
                    {t("featuredGames")}
                </h2>
                <div className="hidden items-center gap-1 sm:flex">
                    <RailArrow icon={ArrowLeft} label={t("featuredPrev")} disabled={!canScrollPrev} onClick={() => scrollByPage(-1)} />
                    <RailArrow icon={ArrowRight} label={t("featuredNext")} disabled={!canScrollNext} onClick={() => scrollByPage(1)} />
                </div>
            </div>

            {/* Padding keeps the cards' hover lift and focus ring from being clipped by the scroll box. */}
            <ul
                ref={railRef}
                className="scrollbar-hide -mx-1 flex snap-x snap-mandatory scroll-px-1 gap-4 overflow-x-auto overscroll-x-contain px-1 py-2 sm:gap-5"
            >
                {popularGames.map((game, index) => (
                    <li
                        key={game.id}
                        className={cn(CARD_WIDTH, entranceClass(index).className)}
                        style={entranceClass(index).style}
                    >
                        <GameCard game={game} className={HALO_CARD} />
                    </li>
                ))}
            </ul>
        </div>
    );
}

// A bare arrow: no circle or outline, just the glyph darkening and nudging toward its direction on hover.
function RailArrow({ icon: Icon, label, disabled, onClick }: {
    icon: LucideIcon;
    label: string;
    disabled: boolean;
    onClick: () => void;
}) {
    const nudge = Icon === ArrowLeft ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className="group flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30"
        >
            <Icon className={cn("h-5 w-5 transition-transform motion-reduce:transition-none", nudge)} strokeWidth={1.5} aria-hidden="true" />
        </button>
    );
}
