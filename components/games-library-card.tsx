import Image from "next/image";
import { ArrowRight } from "lucide-react";

import type { Game } from "@/data/games";
import { Link } from "@/i18n/navigation";

interface GamesLibraryCardProps {
    game: Game;
    title: string;
    description: string;
    category?: string;
    playLabel: string;
}

export default function GamesLibraryCard({
    game,
    title,
    description,
    category,
    playLabel,
}: GamesLibraryCardProps) {
    return (
        <Link
            href={`/games/${game.slug}`}
            aria-label={`${playLabel}: ${title}`}
            className="group flex min-h-full flex-col overflow-hidden rounded-[1.75rem] bg-muted/45 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
            <div className="relative aspect-[16/10] overflow-hidden bg-background/70">
                {game.coverImage ? (
                    <Image
                        src={game.coverImage}
                        alt=""
                        fill
                        sizes="(max-width: 639px) 92vw, (max-width: 1279px) 46vw, 31vw"
                        className={game.coverFit === "contain" ? "object-contain p-5" : "object-cover"}
                    />
                ) : game.preview ? (
                    <div className="h-full w-full [&>*]:!h-full [&>*]:!min-h-0 [&>*]:!w-full [&>*]:!rounded-none">
                        {game.preview}
                    </div>
                ) : (
                    <div className="flex h-full items-end p-6 sm:p-7">
                        <span className="max-w-[15ch] text-2xl font-semibold leading-tight tracking-tight text-foreground/75">
                            {title}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-6">
                {category && (
                    <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        {category}
                    </p>
                )}
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    {title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    {playLabel}
                    <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    />
                </span>
            </div>
        </Link>
    );
}
