"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Trophy, Users, TrendingUp, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { DEFAULT_LEADERBOARD_MODE } from "@/lib/leaderboard-config";
import { getPublicLeaderboardUrl } from "@/lib/leaderboard-public";
import { compareScores, hasTargetScore, isHigherScoreBetter } from "@/lib/leaderboard-snapshots";

export type FormatterType = 'ms' | 'sec3' | 'sec4' | 'cps' | 'pts' | 'levels' | 'schulte' | 'percent' | 'default';

export interface LeaderboardDisplayProps {
    gameId: string;
    formatterType?: FormatterType;
    mode?: string;
}

type LeaderboardRecord = {
    playerName: string;
    score: number;
    createdAt: string;
};

type LeaderboardApiResponse = {
    top20?: LeaderboardRecord[];
    averageScore?: number;
    totalPlayers?: number;
    entries?: Array<{
        playerName: string;
        score: number;
        createdAt: string;
    }>;
    scoreSum?: number;
};

function normalizeLeaderboardResponse(data: LeaderboardApiResponse) {
    const top20 = Array.isArray(data.top20)
        ? data.top20
        : Array.isArray(data.entries)
            ? data.entries.map((entry) => ({
                playerName: entry.playerName,
                score: entry.score,
                createdAt: entry.createdAt,
            }))
            : [];

    const totalPlayers = typeof data.totalPlayers === "number" ? data.totalPlayers : top20.length;
    const averageScore = typeof data.averageScore === "number"
        ? data.averageScore
        : typeof data.scoreSum === "number" && totalPlayers > 0
            ? data.scoreSum / totalPlayers
            : 0;

    return {
        top20,
        averageScore,
        totalPlayers,
    };
}

function isLeaderboardDataConsistent(
    gameId: string,
    data: ReturnType<typeof normalizeLeaderboardResponse>
) {
    if (data.totalPlayers === 0 || data.top20.length === 0) {
        return true;
    }

    for (let index = 1; index < data.top20.length; index += 1) {
        if (compareScores(gameId, data.top20[index - 1].score, data.top20[index].score) > 0) {
            return false;
        }
    }

    if (hasTargetScore(gameId)) {
        return true;
    }

    const bestScore = data.top20[0]?.score;
    if (typeof bestScore !== "number") {
        return true;
    }

    return isHigherScoreBetter(gameId)
        ? data.averageScore <= bestScore
        : data.averageScore >= bestScore;
}

export function LeaderboardDisplay({
    gameId,
    formatterType = 'default',
    mode = DEFAULT_LEADERBOARD_MODE,
}: LeaderboardDisplayProps) {
    const t = useTranslations('common.leaderboard');
    const [top20, setTop20] = useState<LeaderboardRecord[]>([]);
    const [averageScore, setAverageScore] = useState<number>(0);
    const [totalPlayers, setTotalPlayers] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
    const [mySessionDetail, setMySessionDetail] = useState<{ playerName: string; score: number } | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const formatScore = useCallback((s: number) => {
        const rounded = Math.round(s);
        switch (formatterType) {
            case 'ms': return `${rounded} ${t('unitMs')}`;
            case 'sec3': return `${(s / 1000).toFixed(3)} ${t('unitSec')}`;
            case 'sec4': return `${(s / 1000).toFixed(4)} ${t('unitSec')}`;
            case 'cps': return `${Number(s.toFixed(1))} ${t('unitCps')}`;
            case 'pts': return `${rounded} ${t('unitPts')}`;
            case 'levels': return t('unitLevel', { score: rounded.toString() });
            case 'schulte': return `${(s / 1000).toFixed(1)} ${t('unitSec')}`;
            case 'percent': return `${rounded}${t('unitPercent')}`;
            default: return rounded.toString();
        }
    }, [formatterType, t]);

    const fetchLeaderboard = useCallback(async (forceFresh = false) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ gameId, mode });
            if (forceFresh) {
                params.set("_", Date.now().toString());
            }
            const requestInit: RequestInit = {
                cache: forceFresh ? "no-store" : "default",
            };
            const publicUrl = getPublicLeaderboardUrl(gameId, mode);
            const publicRequestUrl = publicUrl
                ? `${publicUrl}${forceFresh ? `?${params.toString()}` : ""}`
                : null;

            let res: Response | null = null;

            if (publicRequestUrl) {
                try {
                    res = await fetch(publicRequestUrl, requestInit);
                    if (res.ok) {
                        const publicData = normalizeLeaderboardResponse((await res.json()) as LeaderboardApiResponse);
                        if (isLeaderboardDataConsistent(gameId, publicData)) {
                            setTop20(publicData.top20);
                            setAverageScore(publicData.averageScore);
                            setTotalPlayers(publicData.totalPlayers);
                            return;
                        }
                    }
                } catch {
                    res = null;
                }
            }

            res = await fetch(`/api/leaderboard?${params.toString()}`, {
                cache: "no-store",
            });

            if (res.ok) {
                const data = normalizeLeaderboardResponse((await res.json()) as LeaderboardApiResponse);
                setTop20(data.top20);
                setAverageScore(data.averageScore);
                setTotalPlayers(data.totalPlayers);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [gameId, mode]);

    useEffect(() => {
        if (hasEnteredViewport) {
            void fetchLeaderboard();
        }
    }, [fetchLeaderboard, hasEnteredViewport]);

    useEffect(() => {
        const node = containerRef.current;
        if (!node || hasEnteredViewport) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHasEnteredViewport(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "300px 0px" }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [hasEnteredViewport]);

    useEffect(() => {
        const handleUpdate = (e: Event) => {
            const customEvent = e as CustomEvent<{ gameId: string, playerName: string, score: number, mode?: string }>;
            if (customEvent.detail && customEvent.detail.gameId === gameId && (customEvent.detail.mode || DEFAULT_LEADERBOARD_MODE) === mode) {
                setMySessionDetail({
                    playerName: customEvent.detail.playerName,
                    score: customEvent.detail.score
                });
                setHasEnteredViewport(true);
                void fetchLeaderboard(true);
            }
        };

        window.addEventListener('leaderboardUpdated', handleUpdate);
        return () => window.removeEventListener('leaderboardUpdated', handleUpdate);
    }, [gameId, fetchLeaderboard, mode]);

    if (!hasEnteredViewport) {
        return (
            <div ref={containerRef} className="w-full bg-background border rounded-xl overflow-hidden shadow-sm">
                <div className="flex justify-center p-8 text-muted-foreground">
                    {t('loadPrompt')}
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div ref={containerRef} className="w-full bg-background border rounded-xl overflow-hidden shadow-sm">
                <div className="flex justify-center p-8 text-muted-foreground animate-pulse">
                    {t('loading')}
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full bg-background border rounded-xl overflow-hidden shadow-sm">
            {/* Header Stats */}
            <div className="bg-muted p-4 md:p-6 border-b flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-none">{t('title')}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex items-center gap-2 bg-background px-3 py-2 rounded-lg border">
                        <Users className="w-4 h-4 text-blue-500" />
                        <div className="text-sm">
                            <span className="font-semibold block">{totalPlayers}</span>
                            <span className="text-muted-foreground text-xs">{t('totalPlayers')}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-background px-3 py-2 rounded-lg border">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <div className="text-sm">
                            <span className="font-semibold block">{formatScore(averageScore)}</span>
                            <span className="text-muted-foreground text-xs">{t('averageScore')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Player Status */}
            {mySessionDetail && (
                <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-4 flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <div>
                        <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                            {t('submittedTitle')} <strong className="font-bold text-emerald-900 dark:text-emerald-100">{mySessionDetail.playerName}</strong>.
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                            {t('submittedBody', {
                                score: formatScore(mySessionDetail.score),
                                average: formatScore(averageScore),
                            })}
                        </p>
                    </div>
                </div>
            )}

            {/* Leaderboard Table */}
            <div className="max-h-[400px] overflow-y-auto">
                {top20.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        {t('empty')}
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0 backdrop-blur-sm z-10">
                            <tr>
                                <th className="text-left font-medium p-4 text-muted-foreground">{t('rank')}</th>
                                <th className="text-left font-medium p-4 text-muted-foreground">{t('player')}</th>
                                <th className="text-right font-medium p-4 text-muted-foreground">{t('score')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {top20.map((record, index) => {
                                const isMe = mySessionDetail && record.playerName === mySessionDetail.playerName;
                                return (
                                    <tr
                                        key={index}
                                        className={`hover:bg-muted/50 transition-colors ${isMe ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full font-bold bg-muted text-muted-foreground text-xs">
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium flex items-center gap-2">
                                            {record.playerName}
                                            {isMe && <span className="text-[10px] uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm font-bold">{t('you')}</span>}
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold">
                                            <div>{formatScore(record.score)}</div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
