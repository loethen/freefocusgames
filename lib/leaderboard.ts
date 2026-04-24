const PLAYER_ID_KEY = "freefocusgames.leaderboard.player-id";

export interface LeaderboardSubmissionOptions {
    mode?: string;
    details?: Record<string, boolean | number | string | null | undefined>;
}

function getLeaderboardPlayerId() {
    const existingId = localStorage.getItem(PLAYER_ID_KEY);
    if (existingId) {
        return existingId;
    }

    const newId = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(PLAYER_ID_KEY, newId);
    return newId;
}

export async function submitScoreToLeaderboard(
    gameId: string,
    score: number,
    options: LeaderboardSubmissionOptions = {}
) {
    try {
        const playerId = getLeaderboardPlayerId();

        const res = await fetch("/api/leaderboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                gameId,
                playerId,
                score,
                mode: options.mode,
                details: options.details,
            }),
        });

        if (res.ok) {
            const data = await res.json() as { playerName: string };
            const event = new CustomEvent('leaderboardUpdated', {
                detail: {
                    gameId,
                    playerName: data.playerName,
                    score,
                    mode: options.mode,
                    details: options.details,
                }
            });
            window.dispatchEvent(event);
        } else {
            console.error("Score submission rejected:", await res.text());
        }
    } catch (e) {
        console.error("Failed to submit score", e);
    }
}
