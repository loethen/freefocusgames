'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock3, Sparkles, Trophy, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

type ClearEntry = {
    accuracy: number;
    createdAt: string;
    durationMs: number;
    level: number;
    playerName: string;
};

type ClearApiResponse = {
    averageDurationMs?: number;
    entries?: ClearEntry[];
    totalSubmissions?: number;
};

type LeaderboardUpdateDetail = {
    details?: {
        accuracy?: number | string | null;
        durationMs?: number | string | null;
        level?: number | string | null;
    };
    gameId: string;
    mode?: string;
    playerName: string;
    score: number;
};

function formatDuration(durationMs: number) {
    const totalSeconds = durationMs / 1000;

    if (totalSeconds < 60) {
        return `${totalSeconds.toFixed(1)}s`;
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds - minutes * 60;
    return `${minutes}m ${seconds.toFixed(1)}s`;
}

export default function DualNBackClearLeaderboard() {
    const locale = useLocale();
    const t = useTranslations('games.dualNBack.leaderboards');
    const [entries, setEntries] = useState<ClearEntry[]>([]);
    const [averageDurationMs, setAverageDurationMs] = useState(0);
    const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mySessionDetail, setMySessionDetail] = useState<ClearEntry | null>(null);
    const [totalSubmissions, setTotalSubmissions] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const formatDate = useCallback((value: string) => {
        return new Intl.DateTimeFormat(
            locale === 'zh' ? 'zh-CN' : 'en-US',
            {
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                month: 'short',
            }
        ).format(new Date(value));
    }, [locale]);

    const fetchRecentClears = useCallback(async (forceFresh = false) => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                gameId: 'dual-n-back',
                mode: 'standard-clear',
                view: 'recent',
            });

            if (forceFresh) {
                params.set('_', Date.now().toString());
            }

            const res = await fetch(`/api/leaderboard?${params.toString()}`, {
                cache: forceFresh ? 'no-store' : 'default',
            });

            if (!res.ok) {
                return;
            }

            const data = await res.json() as ClearApiResponse;
            setEntries(Array.isArray(data.entries) ? data.entries : []);
            setAverageDurationMs(typeof data.averageDurationMs === 'number' ? data.averageDurationMs : 0);
            setTotalSubmissions(typeof data.totalSubmissions === 'number' ? data.totalSubmissions : 0);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (hasEnteredViewport) {
            void fetchRecentClears();
        }
    }, [fetchRecentClears, hasEnteredViewport]);

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
            { rootMargin: '300px 0px' }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [hasEnteredViewport]);

    useEffect(() => {
        const handleUpdate = (event: Event) => {
            const customEvent = event as CustomEvent<LeaderboardUpdateDetail>;
            const detail = customEvent.detail;

            if (!detail || detail.gameId !== 'dual-n-back' || detail.mode !== 'standard-clear') {
                return;
            }

            const accuracy = Number(detail.details?.accuracy ?? 0);
            const durationMs = Number(detail.details?.durationMs ?? detail.score);
            const level = Number(detail.details?.level ?? 0);

            setMySessionDetail({
                accuracy,
                createdAt: new Date().toISOString(),
                durationMs,
                level,
                playerName: detail.playerName,
            });
            setHasEnteredViewport(true);
            void fetchRecentClears(true);
        };

        window.addEventListener('leaderboardUpdated', handleUpdate);
        return () => window.removeEventListener('leaderboardUpdated', handleUpdate);
    }, [fetchRecentClears]);

    if (!hasEnteredViewport) {
        return (
            <div ref={containerRef} className="w-full rounded-xl border bg-background overflow-hidden shadow-sm">
                <div className="flex justify-center p-8 text-muted-foreground">
                    {t('loadPrompt')}
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div ref={containerRef} className="w-full rounded-xl border bg-background overflow-hidden shadow-sm">
                <div className="flex justify-center p-8 text-muted-foreground animate-pulse">
                    {t('loading')}
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full rounded-xl border bg-background overflow-hidden shadow-sm">
            <div className="border-b bg-muted p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-2">
                        <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-none">{t('cardTitle')}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{t('cardSubtitle')}</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <div className="text-sm">
                            <span className="font-semibold block">{totalSubmissions}</span>
                            <span className="text-muted-foreground text-xs">{t('totalClears')}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                        <Clock3 className="w-4 h-4 text-emerald-500" />
                        <div className="text-sm">
                            <span className="font-semibold block">{formatDuration(averageDurationMs)}</span>
                            <span className="text-muted-foreground text-xs">{t('averagePassTime')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {mySessionDetail && (
                <div className="border-b border-emerald-500/20 bg-emerald-500/10 p-4 flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <div>
                        <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                            {t('submittedTitle')} <strong className="font-bold text-emerald-900 dark:text-emerald-100">{mySessionDetail.playerName}</strong>.
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                            {t('submittedBody', {
                                accuracy: mySessionDetail.accuracy,
                                duration: formatDuration(mySessionDetail.durationMs),
                                level: mySessionDetail.level,
                            })}
                        </p>
                    </div>
                </div>
            )}

            <div className="max-h-[420px] overflow-y-auto">
                {entries.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        {t('empty')}
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0 backdrop-blur-sm z-10">
                            <tr>
                                <th className="text-left font-medium p-4 text-muted-foreground">{t('columns.order')}</th>
                                <th className="text-left font-medium p-4 text-muted-foreground">{t('columns.player')}</th>
                                <th className="text-left font-medium p-4 text-muted-foreground">{t('columns.level')}</th>
                                <th className="text-right font-medium p-4 text-muted-foreground">{t('columns.duration')}</th>
                                <th className="text-right font-medium p-4 text-muted-foreground">{t('columns.accuracy')}</th>
                                <th className="text-right font-medium p-4 text-muted-foreground">{t('columns.clearedAt')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {entries.map((entry, index) => {
                                const isMe = mySessionDetail && entry.playerName === mySessionDetail.playerName;

                                return (
                                    <tr
                                        key={`${entry.playerName}-${entry.createdAt}-${index}`}
                                        className={`hover:bg-muted/50 transition-colors ${isMe ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full font-bold bg-muted text-muted-foreground text-xs">
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium">
                                            <div className="flex items-center gap-2">
                                                <span>{entry.playerName}</span>
                                                {isMe && (
                                                    <span className="text-[10px] uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm font-bold">
                                                        {t('you')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{t('levelLabel', { level: entry.level })}</td>
                                        <td className="p-4 text-right font-mono font-semibold">{formatDuration(entry.durationMs)}</td>
                                        <td className="p-4 text-right font-mono">{entry.accuracy}%</td>
                                        <td className="p-4 text-right text-muted-foreground">{formatDate(entry.createdAt)}</td>
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
