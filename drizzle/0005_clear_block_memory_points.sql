-- Discard legacy points and their aggregates; keep only the sequence-length rules.
DELETE FROM leaderboard
WHERE game_id = 'block-memory-challenge'
  AND mode != 'sequence-v1';

DELETE FROM leaderboard_daily_stats
WHERE game_id = 'block-memory-challenge'
  AND mode != 'sequence-v1';
