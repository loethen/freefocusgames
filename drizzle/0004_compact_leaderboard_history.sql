CREATE TABLE IF NOT EXISTS leaderboard_daily_stats (
    game_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    stat_date TEXT NOT NULL,
    total_plays INTEGER NOT NULL,
    unique_players INTEGER NOT NULL,
    average_score REAL NOT NULL,
    minimum_score REAL NOT NULL,
    maximum_score REAL NOT NULL,
    PRIMARY KEY (game_id, mode, stat_date)
);

INSERT OR REPLACE INTO leaderboard_daily_stats (
    game_id,
    mode,
    stat_date,
    total_plays,
    unique_players,
    average_score,
    minimum_score,
    maximum_score
)
SELECT
    game_id,
    mode,
    DATE(created_at),
    COUNT(*),
    COUNT(DISTINCT COALESCE(player_id, player_name)),
    AVG(score),
    MIN(score),
    MAX(score)
FROM leaderboard
GROUP BY game_id, mode, DATE(created_at);

CREATE TABLE leaderboard_best (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    player_id TEXT,
    player_name TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'standard',
    score REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details_json TEXT
);

INSERT INTO leaderboard_best (
    game_id,
    player_id,
    player_name,
    mode,
    score,
    created_at,
    details_json
)
WITH ranked_scores AS (
    SELECT
        game_id,
        player_id,
        player_name,
        mode,
        score,
        created_at,
        details_json,
        ROW_NUMBER() OVER (
            PARTITION BY
                game_id,
                mode,
                COALESCE(player_id, player_name)
            ORDER BY
                CASE
                    WHEN game_id = 'challenge10Seconds'
                    THEN ABS(score - 10000)
                END ASC,
                CASE
                    WHEN game_id IN (
                        'reaction-time',
                        'memory-matching-game',
                        'stroop-effect-test',
                        'schulte-table'
                    )
                    OR (
                        game_id = 'dual-n-back'
                        AND mode = 'standard-clear'
                    )
                    THEN score
                END ASC,
                CASE
                    WHEN game_id != 'challenge10Seconds'
                    AND game_id NOT IN (
                        'reaction-time',
                        'memory-matching-game',
                        'stroop-effect-test',
                        'schulte-table'
                    )
                    AND NOT (
                        game_id = 'dual-n-back'
                        AND mode = 'standard-clear'
                    )
                    THEN score
                END DESC,
                datetime(created_at) ASC
        ) AS player_rank
    FROM leaderboard
)
SELECT
    game_id,
    player_id,
    player_name,
    mode,
    score,
    created_at,
    details_json
FROM ranked_scores
WHERE player_rank = 1;

DROP INDEX IF EXISTS idx_leaderboard_game_id;
DROP INDEX IF EXISTS idx_leaderboard_game_mode;
DROP INDEX IF EXISTS idx_leaderboard_game_player;

DROP TABLE leaderboard;
ALTER TABLE leaderboard_best RENAME TO leaderboard;

CREATE INDEX idx_leaderboard_game_mode_player
ON leaderboard(game_id, mode, player_id);

CREATE INDEX idx_leaderboard_game_mode_score
ON leaderboard(game_id, mode, score, created_at);

CREATE INDEX idx_leaderboard_stats_date
ON leaderboard_daily_stats(stat_date);
