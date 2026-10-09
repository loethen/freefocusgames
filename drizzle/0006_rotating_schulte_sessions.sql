CREATE TABLE IF NOT EXISTS rotating_schulte_sessions (
    player_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    started_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rotating_schulte_sessions_started_at ON rotating_schulte_sessions(started_at);
