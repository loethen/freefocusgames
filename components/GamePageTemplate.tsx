import React from 'react';
import { Link } from '@/i18n/navigation';
import { GameHeader } from '@/components/GameHeader';
import GameCategories from '@/components/game-categories';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import GameCard from '@/components/game-card';
import { getGame } from '@/data/games';
import { useTranslations } from 'next-intl';
import { ExternalLink, BookOpen, ArrowRight } from 'lucide-react';
import { ShareButton } from '@/components/share-button';
import {
    LeaderboardDisplay,
    FormatterType,
    LeaderboardDetailsType,
} from '@/components/leaderboard-display';

interface FaqItem {
    question: string;
    answer: React.ReactNode;
}

interface BenefitItem {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface ScienceInfo {
    title: string;
    description: React.ReactNode;
    blogArticleUrl?: string;
    blogArticleTitle?: string;
    authorityLinks?: {
        title: string;
        url: string;
        description: string;
    }[];
}

interface GamePageTemplateProps {
    gameBackground?: string;
    gameId: string;
    title: string;
    subtitle: string;
    description?: React.ReactNode;
    gameComponent: React.ReactNode;
    howToPlay: React.ReactNode;
    additionalContent?: React.ReactNode;
    shareActions?: React.ReactNode;
    benefits?: BenefitItem[];
    benefitsTitle?: React.ReactNode;
    science?: ScienceInfo;
    faq?: FaqItem[];
    relatedGames?: string[];
    hasLeaderboard?: boolean;
    leaderboardTitle?: React.ReactNode;
    leaderboardFormatterType?: FormatterType;
    leaderboardDetailsType?: LeaderboardDetailsType;
    leaderboardMode?: string;
    leaderboardIntro?: React.ReactNode;
    leaderboardComponent?: React.ReactNode;
    structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function GamePageTemplate({
    gameBackground,
    gameId,
    title,
    subtitle,
    description,
    gameComponent,
    howToPlay,
    additionalContent,
    shareActions,
    benefits,
    benefitsTitle,
    science,
    faq,
    relatedGames,
    hasLeaderboard,
    leaderboardTitle,
    leaderboardFormatterType,
    leaderboardDetailsType,
    leaderboardMode,
    leaderboardIntro,
    leaderboardComponent,
    structuredData
}: GamePageTemplateProps) {
    const t = useTranslations('common');
    const gameT = useTranslations('games.template');
    const structuredDataItems = Array.isArray(structuredData)
        ? structuredData
        : structuredData
            ? [structuredData]
            : [];

    return (
        <>
            {structuredDataItems.map((item, index) => (
                <script
                    key={`${gameId}-structured-data-${index}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
                />
            ))}
            <Breadcrumbs
                items={[{ label: t("games"), href: "/games" }, { label: title }]}
            />
            {/* 游戏标题和描述 */}
            <div className="container mx-auto pt-8">
                <GameHeader title={title} subtitle={subtitle} />
                {description && (
                    <div className="mx-auto -mt-6 mb-10 max-w-3xl text-center text-lg leading-relaxed text-muted-foreground">
                        {description}
                    </div>
                )}
            </div>

            {/* 游戏组件 */}
            <section
                className={cn(
                    "mb-4 rounded-xl p-2 md:p-4 border border-border",
                    gameBackground
                )}
            >
                {gameComponent}
            </section>

            {/* 分享部分 */}
            <section className="max-w-6xl mx-auto mb-12">
                <div className="flex flex-wrap items-center gap-2">
                    <ShareButton title={title} />
                    {shareActions}
                </div>
            </section>

            {/* 游戏玩法说明 */}
            <section className="max-w-6xl mx-auto mb-16 space-y-6">
                <div className="p-6 rounded-lg bg-muted/50">
                    <h2 className="text-xl font-semibold mb-3">
                        🎯 {gameT("howToPlay")}
                    </h2>
                    <div className="space-y-3 text-lg text-muted-foreground">
                        {howToPlay}
                    </div>
                </div>
            </section>

            {additionalContent && (
                <section className="max-w-6xl mx-auto mb-16 space-y-8">
                    {additionalContent}
                </section>
            )}

            {/* Leaderboard - Option */}
            {(hasLeaderboard || leaderboardComponent) && (
                <section className="max-w-6xl mx-auto mb-16 space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-center">
                            {leaderboardTitle ?? gameT("leaderboard")}
                        </h2>
                        {leaderboardIntro && (
                            <div className="max-w-3xl mx-auto text-center text-muted-foreground">
                                {leaderboardIntro}
                            </div>
                        )}
                    </div>
                    <div className="rounded-lg">
                        {leaderboardComponent ?? (
                            <LeaderboardDisplay
                                gameId={gameId}
                                formatterType={leaderboardFormatterType}
                                detailsType={leaderboardDetailsType}
                                mode={leaderboardMode}
                            />
                        )}
                    </div>
                </section>
            )}

            {/* 认知益处 - 可选 */}
            {benefits && benefits.length > 0 && (
                <section className="max-w-6xl mx-auto mb-16 py-16">
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        {benefitsTitle ?? gameT("cognitiveBenefits")}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {benefits.map((benefit, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "relative overflow-hidden rounded-xl p-6 transition-all duration-300",
                                    "hover:shadow-md hover:border-primary/50 hover:-translate-y-1",
                                    "bg-linear-to-br from-background to-muted/30"
                                )}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 blur-2xl"></div>
                                <div className="mb-4 text-primary">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-2">
                                    {benefit.title}
                                </h3>
                                <p className="text-muted-foreground">
                                    {benefit.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 游戏背后的科学 - 可选 */}
            {science && (
                <section className="max-w-6xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        {gameT("scienceBehindGame")}
                    </h2>
                    <div className="max-w-3xl mx-auto">
                        <h3 className="text-xl md:text-2xl font-semibold mb-4 text-foreground">
                            {science.title}
                        </h3>
                        <div className="space-y-4 text-base md:text-lg leading-8 text-muted-foreground">
                            {science.description}
                        </div>

                        {/* Blog文章链接 */}
                        {science.blogArticleUrl &&
                            science.blogArticleTitle && (
                                <Link
                                    href={science.blogArticleUrl}
                                    className="group mt-8 flex items-center justify-between gap-4 rounded-xl border border-border px-5 py-4 transition-colors hover:border-foreground/30 hover:bg-muted/40"
                                    title={science.blogArticleTitle}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                                            <BookOpen className="w-3.5 h-3.5" />
                                            {gameT("readDetailedArticle")}
                                        </div>
                                        <div className="font-semibold text-foreground">
                                            {science.blogArticleTitle}
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                                </Link>
                            )}

                        {/* 权威链接 */}
                        {science.authorityLinks &&
                            science.authorityLinks.length > 0 && (
                                <div className="mt-8 border-t border-border pt-6">
                                    <h4 className="text-sm font-semibold mb-3 text-foreground">
                                        {gameT("authorityReferences")}
                                    </h4>
                                    <ul className="space-y-2">
                                        {science.authorityLinks.map(
                                            (link, index) => (
                                                <li key={index}>
                                                    <a
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group inline-flex items-start gap-2 text-sm"
                                                    >
                                                        <ExternalLink className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 text-muted-foreground group-hover:text-foreground" />
                                                        <span>
                                                            <span className="font-medium text-foreground underline-offset-4 group-hover:underline">
                                                                {link.title}
                                                            </span>
                                                            <span className="text-muted-foreground"> · {link.description}</span>
                                                        </span>
                                                    </a>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            )}
                    </div>
                </section>
            )}

            {/* FAQ部分 - 可选 */}
            {faq && faq.length > 0 && (
                <section className="max-w-6xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        {gameT("faq")}
                    </h2>
                    <Accordion
                        type="single"
                        collapsible
                        className="max-w-2xl mx-auto"
                    >
                        {faq.map((item, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger className="text-lg">
                                    {item.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground text-lg">
                                    {item.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </section>
            )}

            {/* 相关游戏推荐 - 可选 */}
            {relatedGames && relatedGames.length > 0 && (
                <section className="max-w-6xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        {gameT("relatedGames")}
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                        {relatedGames.map((gameId) => {
                            const game = getGame(gameId);
                            if (!game) return null;

                            return <GameCard key={gameId} game={game} className="h-full" />;
                        })}
                    </div>
                </section>
            )}

            {/* 训练类别标签 */}
            <section className="mt-16 pt-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        {gameT("trainingCategories")}
                    </h2>
                    <div className="flex justify-center">
                        <GameCategories gameId={gameId} />
                    </div>
                    {getGame(gameId)?.categories.includes('memory-games') && (
                        <Link
                            href="/categories/memory-games"
                            data-link-location="game_memory_hub"
                            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary"
                        >
                            {gameT("moreMemoryGames")}
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    )}
                </div>
            </section>
        </>
    );
} 
