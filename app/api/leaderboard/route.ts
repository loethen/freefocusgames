import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
    DEFAULT_LEADERBOARD_MODE,
} from "@/lib/leaderboard-config";
import {
    DOUBLE_DECISION_MAX_DISPLAY_MS,
    DOUBLE_DECISION_MAX_TRIAL_POINTS,
    DOUBLE_DECISION_MIN_DISPLAY_MS,
    DOUBLE_DECISION_MIN_RANKED_ACCURACY,
    DOUBLE_DECISION_MIN_RANKED_TRIALS,
    DOUBLE_DECISION_RULES_VERSION,
    calculateDoubleDecisionScore,
} from "@/lib/double-decision-score";
import {
    DUAL_N_BACK_CLEAR_MAX_DURATION_MS,
    DUAL_N_BACK_CLEAR_MAX_INTERVAL_MS,
    DUAL_N_BACK_CLEAR_MAX_LEVEL,
    DUAL_N_BACK_CLEAR_MAX_TRIALS,
    DUAL_N_BACK_CLEAR_MIN_ACCURACY,
    DUAL_N_BACK_CLEAR_MIN_DURATION_MS,
    DUAL_N_BACK_CLEAR_MIN_INTERVAL_MS,
    DUAL_N_BACK_CLEAR_MIN_LEVEL,
    DUAL_N_BACK_CLEAR_MIN_TRIALS,
    DUAL_N_BACK_CLEAR_TRAINING_MODE,
} from "@/lib/dual-n-back-clear-rules";
import {
    createEmptySnapshot,
    compareScores,
    getLeaderboardTarget,
    hasTargetScore,
    getLeaderboardSnapshotKey,
    isBetterScore,
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

type LeaderboardSubmissionDetails = {
    accuracy?: unknown;
    correctCount?: unknown;
    durationMs?: unknown;
    fastestDisplayMs?: unknown;
    level?: unknown;
    maxFieldLevel?: unknown;
    pointsTotal?: unknown;
    rulesVersion?: unknown;
    startingDisplayMs?: unknown;
    startingFieldLevel?: unknown;
    totalTrials?: unknown;
    trialInterval?: unknown;
    trainingMode?: unknown;
    trialsPerRound?: unknown;
};

async function hasLeaderboardDetailsColumn(db: D1DatabaseBinding) {
    try {
        const pragmaResult = await db.prepare(
            `PRAGMA table_info(leaderboard)`
        ).bind().all();

        return pragmaResult.results.some((row) => String(row.name ?? "") === "details_json");
    } catch (error) {
        console.error("Failed to inspect leaderboard schema:", error);
        return false;
    }
}

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

function isSnapshotConsistent(snapshot: LeaderboardSnapshot) {
    if (snapshot.totalPlayers === 0 || snapshot.entries.length === 0) {
        return true;
    }

    for (let index = 1; index < snapshot.entries.length; index += 1) {
        if (compareScores(snapshot.gameId, snapshot.entries[index - 1].score, snapshot.entries[index].score) > 0) {
            return false;
        }
    }

    if (hasTargetScore(snapshot.gameId)) {
        return true;
    }

    const averageScore = getAverageScore(snapshot);
    const bestScore = snapshot.entries[0]?.score;

    if (typeof bestScore !== "number") {
        return true;
    }

    return isHigherScoreBetter(snapshot.gameId)
        ? averageScore <= bestScore
        : averageScore >= bestScore;
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

function parseDetails(detailsText: unknown) {
    if (typeof detailsText !== "string" || detailsText.length === 0) {
        return null;
    }

    try {
        const parsed = JSON.parse(detailsText) as Record<string, unknown>;
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
}

function normalizeLeaderboardDetails(details: unknown) {
    if (!details || typeof details !== "object" || Array.isArray(details)) {
        return null;
    }

    const normalized: Record<string, boolean | number | string | null> = {};

    for (const [key, value] of Object.entries(details)) {
        if (
            value === null ||
            typeof value === "boolean" ||
            typeof value === "number" ||
            typeof value === "string"
        ) {
            normalized[key] = value;
        }
    }

    return Object.keys(normalized).length > 0 ? normalized : null;
}

function validateDualNBackClearDetails(score: number, details: LeaderboardSubmissionDetails | null) {
    if (!details) {
        return "Score rejected (Missing clear details)";
    }

    const level = toNumber(details.level, NaN);
    const accuracy = toNumber(details.accuracy, NaN);
    const durationMs = toNumber(details.durationMs, NaN);
    const trialInterval = toNumber(details.trialInterval, NaN);
    const trainingMode = typeof details.trainingMode === "string" ? details.trainingMode : "";
    const trialsPerRound = toNumber(details.trialsPerRound, NaN);

    if (trainingMode !== DUAL_N_BACK_CLEAR_TRAINING_MODE) {
        return "Score rejected (Invalid clear mode)";
    }

    if (!Number.isInteger(level) || level < DUAL_N_BACK_CLEAR_MIN_LEVEL || level > DUAL_N_BACK_CLEAR_MAX_LEVEL) {
        return "Score rejected (Invalid clear level)";
    }

    if (!Number.isInteger(accuracy) || accuracy < DUAL_N_BACK_CLEAR_MIN_ACCURACY || accuracy > 100) {
        return "Score rejected (Invalid clear accuracy)";
    }

    if (
        !Number.isInteger(trialsPerRound) ||
        trialsPerRound < DUAL_N_BACK_CLEAR_MIN_TRIALS ||
        trialsPerRound > DUAL_N_BACK_CLEAR_MAX_TRIALS
    ) {
        return "Score rejected (Invalid clear rounds)";
    }

    if (
        !Number.isInteger(trialInterval) ||
        trialInterval < DUAL_N_BACK_CLEAR_MIN_INTERVAL_MS ||
        trialInterval > DUAL_N_BACK_CLEAR_MAX_INTERVAL_MS
    ) {
        return "Score rejected (Invalid clear pace)";
    }

    if (
        !Number.isInteger(durationMs) ||
        durationMs < DUAL_N_BACK_CLEAR_MIN_DURATION_MS ||
        durationMs > DUAL_N_BACK_CLEAR_MAX_DURATION_MS
    ) {
        return "Score rejected (Invalid clear duration)";
    }

    if (Math.round(score) !== durationMs) {
        return "Score rejected (Clear duration mismatch)";
    }

    return null;
}

function validateDoubleDecisionDetails(
    score: number,
    mode: string,
    details: LeaderboardSubmissionDetails | null
) {
    if (mode !== DEFAULT_LEADERBOARD_MODE || !details) {
        return "Score rejected (Invalid Double Decision entry)";
    }

    const accuracy = toNumber(details.accuracy, NaN);
    const correctCount = toNumber(details.correctCount, NaN);
    const fastestDisplayMs = toNumber(details.fastestDisplayMs, NaN);
    const maxFieldLevel = toNumber(details.maxFieldLevel, NaN);
    const pointsTotal = toNumber(details.pointsTotal, NaN);
    const rulesVersion = toNumber(details.rulesVersion, NaN);
    const startingDisplayMs = toNumber(details.startingDisplayMs, NaN);
    const startingFieldLevel = toNumber(details.startingFieldLevel, NaN);
    const totalTrials = toNumber(details.totalTrials, NaN);

    if (
        !Number.isInteger(totalTrials) ||
        ![20, 30].includes(totalTrials) ||
        totalTrials < DOUBLE_DECISION_MIN_RANKED_TRIALS
    ) {
        return "Score rejected (Not enough Double Decision rounds)";
    }

    if (
        !Number.isInteger(correctCount) ||
        correctCount < 0 ||
        correctCount > totalTrials
    ) {
        return "Score rejected (Invalid Double Decision accuracy)";
    }

    const expectedAccuracy = Math.round((correctCount / totalTrials) * 100);
    if (
        !Number.isInteger(accuracy) ||
        accuracy < DOUBLE_DECISION_MIN_RANKED_ACCURACY ||
        accuracy > 100 ||
        accuracy !== expectedAccuracy
    ) {
        return "Score rejected (Double Decision accuracy mismatch)";
    }

    if (
        !Number.isInteger(maxFieldLevel) ||
        maxFieldLevel < 1 ||
        maxFieldLevel > 3 ||
        !Number.isInteger(startingFieldLevel) ||
        ![1, 2, 3].includes(startingFieldLevel) ||
        maxFieldLevel < startingFieldLevel
    ) {
        return "Score rejected (Invalid Double Decision field)";
    }

    if (
        !Number.isInteger(startingDisplayMs) ||
        ![800, 1200, 1600].includes(startingDisplayMs) ||
        !Number.isInteger(fastestDisplayMs) ||
        fastestDisplayMs < DOUBLE_DECISION_MIN_DISPLAY_MS ||
        fastestDisplayMs > DOUBLE_DECISION_MAX_DISPLAY_MS
    ) {
        return "Score rejected (Invalid Double Decision speed)";
    }

    if (
        !Number.isInteger(pointsTotal) ||
        pointsTotal < 0 ||
        pointsTotal > totalTrials * DOUBLE_DECISION_MAX_TRIAL_POINTS ||
        !Number.isInteger(score) ||
        score < 0 ||
        score > 1000 ||
        score !== calculateDoubleDecisionScore(pointsTotal, totalTrials)
    ) {
        return "Score rejected (Double Decision score mismatch)";
    }

    if (rulesVersion !== DOUBLE_DECISION_RULES_VERSION) {
        return "Score rejected (Unsupported Double Decision rules)";
    }

    return null;
}

async function rebuildSnapshotFromDatabase(
    db: D1DatabaseBinding,
    gameId: string,
    mode: string
) {
    const hasDetailsColumn = await hasLeaderboardDetailsColumn(db);
    const scoreOrder = isHigherScoreBetter(gameId) ? "DESC" : "ASC";
    const target = getLeaderboardTarget(gameId);
    const scoreOrderClause =
        typeof target === "number"
            ? `ABS(score - ${target}) ASC, datetime(created_at) ASC`
            : `score ${scoreOrder}, datetime(created_at) ASC`;

    const [topRows, aggregateRow] = await Promise.all([
        db.prepare(
            `WITH ranked_scores AS (
                SELECT
                    COALESCE(player_id, player_name) AS player_key,
                    COALESCE(player_id, player_name) AS player_id,
                    player_name,
                    score,
                    created_at,
                    ${hasDetailsColumn ? "details_json" : "NULL AS details_json"},
                    ROW_NUMBER() OVER (
                        PARTITION BY COALESCE(player_id, player_name)
                        ORDER BY ${scoreOrderClause}
                    ) AS player_rank
                FROM leaderboard
                WHERE game_id = ?
                  AND mode = ?
            )
            SELECT
                player_id AS playerId,
                player_name AS playerName,
                score,
                created_at AS createdAt,
                details_json AS detailsJson
            FROM ranked_scores
            WHERE player_rank = 1
            ORDER BY ${scoreOrderClause}
            LIMIT 20`
        ).bind(gameId, mode).all(),
        db.prepare(
            `WITH ranked_scores AS (
                SELECT
                    score,
                    ROW_NUMBER() OVER (
                        PARTITION BY COALESCE(player_id, player_name)
                        ORDER BY ${scoreOrderClause}
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
            details:
                normalizeLeaderboardDetails(parseDetails(row.detailsJson)) ??
                undefined,
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
    score: number,
    mode: string,
    details: LeaderboardSubmissionDetails | null
) {
    if (!Number.isFinite(score)) {
        return "Invalid score";
    }

    switch (gameId) {
        case "cps-test":
            return score > 35 ? "Score rejected (Humanly impossible CPS)" : null;
        case "spacebar-clicker":
            return score < 0 || score > 30 ? "Score rejected (Outside expected keyboard speed range)" : null;
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
        case "stroop-effect-test":
            if (score < 200 || score > 15000) {
                return "Score rejected (Outside expected performance range)";
            }
            return null;
        case "dual-n-back":
            if (mode === "standard-clear") {
                if (!Number.isInteger(score) || score < 1000 || score > 600000) {
                    return "Score rejected (Invalid clear duration)";
                }

                return validateDualNBackClearDetails(score, details);
            }

            if (mode === "standard-level") {
                if (!Number.isInteger(score) || score < 1 || score > 10) {
                    return "Score rejected (Invalid standard level)";
                }
                return null;
            }
            return "Score rejected (Unsupported dual n-back mode)";
        case "double-decision":
            return validateDoubleDecisionDetails(score, mode, details);
        case "bamboo-cicada":
            if (mode !== "lifetime" || !Number.isInteger(score) || score < 1 || score > 1_000_000) {
                return "Score rejected (Invalid bamboo cicada wah count)";
            }
            return null;
        case "challenge10Seconds":
            if (score < 0 || score > 60000) {
                return "Score rejected (Outside expected timing range)";
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
        const aggregate = searchParams.get("aggregate");
        const mode = searchParams.get("mode") || DEFAULT_LEADERBOARD_MODE;
        const view = searchParams.get("view");

        if (!gameId) {
            return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
        }

        const { db, bucket } = await getCloudflareBindings();

        if (aggregate === "modeCounts") {
            const rows = await db.prepare(
                `SELECT mode, COUNT(*) AS totalSubmissions
                 FROM leaderboard
                 WHERE game_id = ?
                   AND mode IS NOT NULL
                   AND mode != ''
                 GROUP BY mode
                 ORDER BY totalSubmissions DESC, mode ASC`
            ).bind(gameId).all();

            const entries = rows.results.map((row) => ({
                mode: String(row.mode ?? ""),
                totalSubmissions: toNumber(row.totalSubmissions),
            }));

            return NextResponse.json(
                {
                    entries,
                    totalSubmissions: entries.reduce((sum, entry) => sum + entry.totalSubmissions, 0),
                },
                {
                    headers: {
                        "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=120",
                    },
                }
            );
        }

        if (!isValidMode(mode)) {
            return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
        }

        if (gameId === "dual-n-back" && mode === "standard-clear" && view === "recent") {
            const hasDetailsColumn = await hasLeaderboardDetailsColumn(db);
            const eligibilityWhereClause = hasDetailsColumn
                ? `AND CAST(json_extract(details_json, '$.level') AS INTEGER) >= ?
                   AND CAST(json_extract(details_json, '$.accuracy') AS INTEGER) >= ?
                   AND (
                       json_extract(details_json, '$.trialsPerRound') IS NULL
                       OR CAST(json_extract(details_json, '$.trialsPerRound') AS INTEGER) >= ?
                   )
                   AND (
                       json_extract(details_json, '$.trainingMode') IS NULL
                       OR json_extract(details_json, '$.trainingMode') = ?
                   )`
                : `AND 1 = 0`;
            const eligibilityBindings = hasDetailsColumn
                ? [
                    DUAL_N_BACK_CLEAR_MIN_LEVEL,
                    DUAL_N_BACK_CLEAR_MIN_ACCURACY,
                    DUAL_N_BACK_CLEAR_MIN_TRIALS,
                    DUAL_N_BACK_CLEAR_TRAINING_MODE,
                ]
                : [];

            const [recentRows, aggregateRow] = await Promise.all([
                db.prepare(
                    hasDetailsColumn
                        ? `SELECT
                            player_name AS playerName,
                            score AS durationMs,
                            created_at AS createdAt,
                            details_json AS detailsJson
                         FROM leaderboard
                         WHERE game_id = ?
                           AND mode = ?
                           ${eligibilityWhereClause}
                         ORDER BY datetime(created_at) DESC, id DESC
                         LIMIT 20`
                        : `SELECT
                            player_name AS playerName,
                            score AS durationMs,
                            created_at AS createdAt,
                            NULL AS detailsJson
                         FROM leaderboard
                         WHERE game_id = ?
                           AND mode = ?
                           ${eligibilityWhereClause}
                         ORDER BY datetime(created_at) DESC, id DESC
                         LIMIT 20`
                ).bind(gameId, mode, ...eligibilityBindings).all(),
                db.prepare(
                    `SELECT
                        COUNT(*) AS totalSubmissions,
                        COALESCE(AVG(score), 0) AS averageDurationMs
                     FROM leaderboard
                     WHERE game_id = ?
                       AND mode = ?
                       ${eligibilityWhereClause}`
                ).bind(gameId, mode, ...eligibilityBindings).first(),
            ]);

            const entries = recentRows.results.map((row) => {
                const details = parseDetails(row.detailsJson);

                return {
                    playerName: String(row.playerName ?? "Anonymous"),
                    durationMs: toNumber(row.durationMs),
                    createdAt: String(row.createdAt ?? new Date().toISOString()),
                    level: toNumber(details?.level, 0),
                    accuracy: toNumber(details?.accuracy, 0),
                };
            });

            return NextResponse.json(
                {
                    entries,
                    totalSubmissions: toNumber(aggregateRow?.totalSubmissions),
                    averageDurationMs: toNumber(aggregateRow?.averageDurationMs),
                },
                {
                    headers: {
                        "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=120",
                    },
                }
            );
        }

        let snapshot = await readSnapshot(bucket, gameId, mode);

        if (!snapshot) {
            snapshot = await rebuildSnapshotFromDatabase(db, gameId, mode);
            await writeSnapshot(bucket, snapshot);
        } else if (!isSnapshotConsistent(snapshot)) {
            snapshot = await rebuildSnapshotFromDatabase(db, gameId, mode);
            await writeSnapshot(bucket, snapshot);
        }

        return NextResponse.json(
            {
                top20: snapshot.entries.map((entry) => ({
                    playerName: entry.playerName,
                    score: entry.score,
                    createdAt: entry.createdAt,
                    details: entry.details,
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
            details?: LeaderboardSubmissionDetails;
            gameId?: string;
            mode?: string;
            playerId?: string;
            score?: number;
        };
        const {
            details,
            gameId,
            mode = DEFAULT_LEADERBOARD_MODE,
            playerId,
            score,
        } = body;

        if (!gameId || typeof score !== "number" || !playerId || !isValidPlayerId(playerId) || !isValidMode(mode)) {
            return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
        }

        const normalizedDetails = normalizeLeaderboardDetails(details);
        const validationError = validateScore(gameId, score, mode, details ?? null);
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 });
        }

        const { db, bucket } = await getCloudflareBindings();
        const playerName = await generateStableName(playerId);
        const nowIso = new Date().toISOString();
        const isDualNBackClear =
            gameId === "dual-n-back" && mode === "standard-clear";
        const scoreOrder = isDualNBackClear
            ? "ASC"
            : isHigherScoreBetter(gameId)
                ? "DESC"
                : "ASC";
        const target = getLeaderboardTarget(gameId);
        const scoreOrderClause =
            typeof target === "number"
                ? `ABS(score - ${target}) ASC, datetime(created_at) ASC`
                : `score ${scoreOrder}, datetime(created_at) ASC`;

        const existingBest = await db.prepare(
            `SELECT id, score
             FROM leaderboard
             WHERE game_id = ?
               AND mode = ?
               AND player_id = ?
             ORDER BY ${scoreOrderClause}
             LIMIT 1`
        ).bind(gameId, mode, playerId).first();

        const previousBestScore =
            existingBest && typeof existingBest.score === "number"
                ? existingBest.score
                : existingBest && existingBest.score !== undefined
                    ? Number(existingBest.score)
                    : null;
        const isFirstPlayer = previousBestScore === null;
        const isImprovedBest =
            previousBestScore !== null &&
            (isDualNBackClear
                ? score < previousBestScore
                : isBetterScore(gameId, score, previousBestScore));
        const shouldRecord = isFirstPlayer || isImprovedBest;

        const hasDetailsColumn = await hasLeaderboardDetailsColumn(db);

        if (shouldRecord) {
            if (isFirstPlayer) {
                if (hasDetailsColumn) {
                    await db.prepare(
                        `INSERT INTO leaderboard (
                            game_id,
                            player_id,
                            player_name,
                            mode,
                            score,
                            details_json
                        ) VALUES (?, ?, ?, ?, ?, ?)`
                    ).bind(
                        gameId,
                        playerId,
                        playerName,
                        mode,
                        score,
                        normalizedDetails ? JSON.stringify(normalizedDetails) : null
                    ).run();
                } else {
                    await db.prepare(
                        `INSERT INTO leaderboard (
                            game_id,
                            player_id,
                            player_name,
                            mode,
                            score
                        ) VALUES (?, ?, ?, ?, ?)`
                    ).bind(
                        gameId,
                        playerId,
                        playerName,
                        mode,
                        score
                    ).run();
                }
            } else {
                const existingBestId = toNumber(existingBest?.id, NaN);
                if (!Number.isInteger(existingBestId)) {
                    return NextResponse.json(
                        { error: "Unable to update leaderboard record" },
                        { status: 500 }
                    );
                }

                if (hasDetailsColumn) {
                    await db.prepare(
                        `UPDATE leaderboard
                         SET player_name = ?,
                             score = ?,
                             details_json = ?,
                             created_at = CURRENT_TIMESTAMP
                         WHERE id = ?`
                    ).bind(
                        playerName,
                        score,
                        normalizedDetails ? JSON.stringify(normalizedDetails) : null,
                        existingBestId
                    ).run();
                } else {
                    await db.prepare(
                        `UPDATE leaderboard
                         SET player_name = ?,
                             score = ?,
                             created_at = CURRENT_TIMESTAMP
                         WHERE id = ?`
                    ).bind(
                        playerName,
                        score,
                        existingBestId
                    ).run();
                }
            }
        }

        if (shouldRecord && !(gameId === "dual-n-back" && mode === "standard-clear")) {
            try {
                const currentSnapshot = (await readSnapshot(bucket, gameId, mode)) ?? createEmptySnapshot(gameId, mode);
                const nextSnapshot = updateSnapshotWithScore(
                    currentSnapshot,
                    {
                        playerId,
                        playerName,
                        score,
                        createdAt: nowIso,
                        details: normalizedDetails ?? undefined,
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
        }

        return NextResponse.json({
            success: true,
            playerName,
            recorded: shouldRecord,
            bestScore: shouldRecord ? score : previousBestScore,
        });
    } catch (error) {
        console.error("Leaderboard POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
