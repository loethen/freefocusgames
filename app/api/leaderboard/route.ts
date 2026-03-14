import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
    DEFAULT_LEADERBOARD_MODE,
} from "@/lib/leaderboard-config";
import {
    createEmptySnapshot,
    getLeaderboardSnapshotKey,
    isHigherScoreBetter,
    updateSnapshotWithScore,
    type LeaderboardSnapshot,
} from "@/lib/leaderboard-snapshots";

const ADJECTIVES = ["Focus", "Speedy", "Clever", "Brave", "Swift", "Ninja", "Pro", "Epic", "Turbo", "Cool", "Zen", "Mind"];
const NOUNS = ["Fox", "Owl", "Cat", "Wolf", "Brain", "Hero", "Master", "Star", "Eagle", "Panda", "Tiger", "Bear"];
type D1PreparedStatement = {
    bind: (...values: unknown[]) => {
        all: () => Promise<{ results: Record<string, unknown>[] }>;
        first: () => Promise<Record<string, unknown> | null>;
        run: () => Promise<unknown>;
    };
};

type D1DatabaseBinding = {
    prepare: (query: string) => D1PreparedStatement;
};

async function getCloudflareBindings() {
    const { env } = await getCloudflareContext({ async: true });
    const bindings = env as unknown as Record<string, unknown>;
    const db = bindings?.DB;
    const bucket = bindings?.ASSETS_BUCKET;

    if (!db) {
        throw new Error("Cloudflare D1 binding 'DB' is not available.");
    }

    return {
        db: db as D1DatabaseBinding,
        bucket: bucket as R2Bucket | undefined,
    };
}

function parseSnapshot(snapshotText: string | null) {
    if (!snapshotText) {
        return null;
    }

    try {
        return JSON.parse(snapshotText) as LeaderboardSnapshot;
    } catch {
        return null;
    }
}

async function readSnapshot(bucket: R2Bucket | undefined, gameId: string, mode: string) {
    if (!bucket) {
        return null;
    }

    const object = await bucket.get(getLeaderboardSnapshotKey(gameId, mode));
    const text = object ? await object.text() : null;
    return parseSnapshot(text);
}

async function writeSnapshot(bucket: R2Bucket | undefined, snapshot: LeaderboardSnapshot) {
    if (!bucket) {
        return;
    }

    await bucket.put(
        getLeaderboardSnapshotKey(snapshot.gameId, snapshot.mode),
        JSON.stringify(snapshot),
        {
            httpMetadata: {
                contentType: "application/json",
                cacheControl: "public, max-age=120, s-maxage=120, stale-while-revalidate=600",
            },
        }
    );
}

function getAverageScore(snapshot: LeaderboardSnapshot) {
    if (snapshot.totalPlayers === 0) {
        return 0;
    }

    return snapshot.scoreSum / snapshot.totalPlayers;
}

function toNumber(value: unknown, fallback = 0) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return fallback;
}

async function rebuildSnapshotFromDatabase(
    db: D1DatabaseBinding,
    gameId: string,
    mode: string
) {
    const scoreOrder = isHigherScoreBetter(gameId) ? "DESC" : "ASC";

    const [topRows, aggregateRow] = await Promise.all([
        db.prepare(
            `WITH ranked_scores AS (
                SELECT
                    COALESCE(player_id, player_name) AS player_key,
                    COALESCE(player_id, player_name) AS player_id,
                    player_name,
                    score,
                    created_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY COALESCE(player_id, player_name)
                        ORDER BY score ${scoreOrder}, datetime(created_at) ASC
                    ) AS player_rank
                FROM leaderboard
                WHERE game_id = ?
                  AND mode = ?
            )
            SELECT
                player_id AS playerId,
                player_name AS playerName,
                score,
                created_at AS createdAt
            FROM ranked_scores
            WHERE player_rank = 1
            ORDER BY score ${scoreOrder}, datetime(created_at) ASC
            LIMIT 20`
        ).bind(gameId, mode).all(),
        db.prepare(
            `WITH ranked_scores AS (
                SELECT
                    score,
                    ROW_NUMBER() OVER (
                        PARTITION BY COALESCE(player_id, player_name)
                        ORDER BY score ${scoreOrder}, datetime(created_at) ASC
                    ) AS player_rank
                FROM leaderboard
                WHERE game_id = ?
                  AND mode = ?
            )
            SELECT
                COUNT(*) AS totalPlayers,
                COALESCE(SUM(score), 0) AS scoreSum
            FROM ranked_scores
            WHERE player_rank = 1`
        ).bind(gameId, mode).first(),
    ]);

    return {
        version: 1 as const,
        gameId,
        mode,
        updatedAt: new Date().toISOString(),
        totalPlayers: toNumber(aggregateRow?.totalPlayers),
        scoreSum: toNumber(aggregateRow?.scoreSum),
        entries: topRows.results.map((row) => ({
            playerId: String(row.playerId ?? ""),
            playerName: String(row.playerName ?? "Anonymous"),
            score: toNumber(row.score),
            createdAt: String(row.createdAt ?? new Date().toISOString()),
        })),
    };
}

function isValidMode(mode: string) {
    return /^[a-z0-9-]{1,32}$/i.test(mode);
}

function isValidPlayerId(playerId: string) {
    return /^[a-zA-Z0-9_-]{8,64}$/.test(playerId);
}

async function generateStableName(playerId: string) {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(playerId));
    const hashBytes = Array.from(new Uint8Array(hashBuffer));
    const adj = ADJECTIVES[hashBytes[0] % ADJECTIVES.length];
    const noun = NOUNS[hashBytes[1] % NOUNS.length];
    const id = (((hashBytes[2] << 8) + hashBytes[3]) % 9000) + 1000;
    return `${adj}_${noun}_${id}`;
}

function validateScore(
    gameId: string,
    score: number
) {
    if (!Number.isFinite(score)) {
        return "Invalid score";
    }

    switch (gameId) {
        case "cps-test":
            return score > 35 ? "Score rejected (Humanly impossible CPS)" : null;
        case "reaction-time":
            return score < 80 || score > 10000 ? "Score rejected (Outside human limits)" : null;
        case "frog-memory-leap":
        case "fish-trace":
            return score > 50000 ? "Score rejected" : null;
        case "block-memory-challenge":
            if (!Number.isInteger(score) || score < 1 || score > 50000) {
                return "Score rejected (Invalid score)";
            }
            return null;
        case "schulte-table":
            if (score < 3000 || score > 180000) {
                return "Score rejected (Outside expected completion range)";
            }
            return null;
        default:
            return null;
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const gameId = searchParams.get("gameId");
        const mode = searchParams.get("mode") || DEFAULT_LEADERBOARD_MODE;

        if (!gameId || !isValidMode(mode)) {
            return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
        }

        const { db, bucket } = await getCloudflareBindings();
        let snapshot = await readSnapshot(bucket, gameId, mode);

        if (!snapshot) {
            snapshot = await rebuildSnapshotFromDatabase(db, gameId, mode);
            await writeSnapshot(bucket, snapshot);
        }

        return NextResponse.json(
            {
                top20: snapshot.entries.map((entry) => ({
                    playerName: entry.playerName,
                    score: entry.score,
                    createdAt: entry.createdAt,
                })),
                averageScore: getAverageScore(snapshot),
                totalPlayers: snapshot.totalPlayers,
            },
            {
                headers: {
                    "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
                },
            }
        );
    } catch (error) {
        console.error("Leaderboard GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            gameId?: string;
            mode?: string;
            playerId?: string;
            score?: number;
        };
        const {
            gameId,
            mode = DEFAULT_LEADERBOARD_MODE,
            playerId,
            score,
        } = body;

        if (!gameId || typeof score !== "number" || !playerId || !isValidPlayerId(playerId) || !isValidMode(mode)) {
            return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
        }

        const validationError = validateScore(gameId, score);
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 });
        }

        const { db, bucket } = await getCloudflareBindings();
        const playerName = await generateStableName(playerId);
        const nowIso = new Date().toISOString();

        const existingBest = await db.prepare(
            `SELECT score
             FROM leaderboard
             WHERE game_id = ?
               AND mode = ?
               AND COALESCE(player_id, player_name) = ?
             ORDER BY score ${gameId === "reaction-time" || gameId === "schulte-table" ? "ASC" : "DESC"}
             LIMIT 1`
        ).bind(gameId, mode, playerId).first();

        const previousBestScore =
            existingBest && typeof existingBest.score === "number"
                ? existingBest.score
                : existingBest && existingBest.score !== undefined
                    ? Number(existingBest.score)
                    : null;
        const isFirstPlayer = previousBestScore === null;

        const recentSubmissions = await db.prepare(
            `SELECT COUNT(id) AS submissionCount
             FROM leaderboard
             WHERE game_id = ?
               AND mode = ?
               AND COALESCE(player_id, player_name) = ?
               AND created_at >= datetime('now', '-1 minute')`
        ).bind(gameId, mode, playerId).first();

        if (Number(recentSubmissions?.submissionCount || 0) >= 8) {
            return NextResponse.json({ error: "Too many submissions. Please wait a moment." }, { status: 429 });
        }

        const duplicateSubmission = await db.prepare(
            `SELECT id
             FROM leaderboard
             WHERE game_id = ?
               AND mode = ?
               AND COALESCE(player_id, player_name) = ?
               AND score = ?
               AND created_at >= datetime('now', '-10 seconds')
             LIMIT 1`
        ).bind(gameId, mode, playerId, score).first();

        if (duplicateSubmission?.id) {
            return NextResponse.json({ error: "Duplicate submission rejected" }, { status: 409 });
        }

        await db.prepare(
            `INSERT INTO leaderboard (
                game_id,
                player_id,
                player_name,
                mode,
                score
            ) VALUES (?, ?, ?, ?, ?)`
        ).bind(gameId, playerId, playerName, mode, score).run();

        try {
            const currentSnapshot = (await readSnapshot(bucket, gameId, mode)) ?? createEmptySnapshot(gameId, mode);
            const nextSnapshot = updateSnapshotWithScore(
                currentSnapshot,
                {
                    playerId,
                    playerName,
                    score,
                    createdAt: nowIso,
                },
                {
                    isFirstPlayer,
                    previousBestScore,
                }
            );

            if (nextSnapshot !== currentSnapshot) {
                await writeSnapshot(bucket, nextSnapshot);
            }
        } catch (snapshotError) {
            console.error("Leaderboard snapshot update failed:", snapshotError);
        }

        return NextResponse.json({ success: true, playerName });
    } catch (error) {
        console.error("Leaderboard POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
