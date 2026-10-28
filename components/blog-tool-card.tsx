import { ArrowRight, Baby, UserRound, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { GameCover } from "@/components/game-card";
import LinkClickTracker from "@/components/link-click-tracker";
import { getGameBySlug } from "@/data/games";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Screeners that articles can point to, keyed by path, with their copy in the tests namespace.
const ASSESSMENTS: Record<string, { item: string; icon: LucideIcon }> = {
    "/adhd-assessment": { item: "childAdhd", icon: Baby },
    "/adult-adhd-assessment": { item: "adultAdhd", icon: UserRound },
};

function gameTitleKey(id: string) {
    return id.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase()).replace(/-/g, "");
}

interface BlogToolCardProps {
    // The game or test the article goes with, e.g. "/games/reaction-time".
    href: string;
    fromPage: string;
    linkLocation: string;
}

// A card that sends readers from an article to the game or test it explains.
export function BlogToolCard({ href, fromPage, linkLocation }: BlogToolCardProps) {
    const t = useTranslations("blog.toolCard");
    const gamesT = useTranslations("games");
    const testsT = useTranslations("tests.items");

    const game = href.startsWith("/games/") ? getGameBySlug(href.replace("/games/", "")) : undefined;
    const assessment = ASSESSMENTS[href];
    if (!game && !assessment) return null;

    const title = game ? gamesT(`${gameTitleKey(game.id)}.title`) : testsT(`${assessment.item}.title`);
    const description = game ? gamesT(`${gameTitleKey(game.id)}.description`) : testsT(`${assessment.item}.description`);
    const Icon = assessment?.icon;

    return (
        <LinkClickTracker fromPage={fromPage} className="not-prose">
            <Link
                href={href}
                data-link-location={linkLocation}
                className="group flex items-stretch gap-4 overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                {/* Game covers are 16:9, so they get a matching frame instead of being cropped to the card height. */}
                <span
                    className={cn(
                        "relative flex shrink-0 items-center justify-center overflow-hidden bg-muted/60",
                        game ? "my-3 ml-3 aspect-video w-32 self-center rounded-xl sm:w-52" : "w-28 sm:w-36"
                    )}
                >
                    {game ? (
                        <GameCover game={game} title={title} sizes="208px" />
                    ) : (
                        Icon && <Icon className="h-8 w-8 text-foreground/70" strokeWidth={1.5} aria-hidden="true" />
                    )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-4 pr-4">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        {game ? t("tryGame") : t("takeTest")}
                    </span>
                    <span className="text-base font-semibold tracking-tight text-foreground">{title}</span>
                    <span className="line-clamp-2 text-sm leading-6 text-muted-foreground">{description}</span>
                </span>
                <span className="hidden items-center pr-5 sm:flex">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity group-hover:opacity-90">
                        {game ? t("play") : t("start")}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                </span>
            </Link>
        </LinkClickTracker>
    );
}
