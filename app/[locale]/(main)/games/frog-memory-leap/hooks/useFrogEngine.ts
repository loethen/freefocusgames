/**
 * Frog Memory Leap — Game Engine Hook
 *
 * 10 Fixed lily pad positions (percentage-based for responsiveness).
 * Each level picks a random subset of positions and generates a jump route.
 * Difficulty scales by adding more pads and longer/more complex routes.
 */

export type GamePhase = 'idle' | 'watching' | 'playing' | 'success' | 'fail';

export interface PadPosition {
    id: number;
    /** 0–100 percentage coordinates */
    px: number;
    py: number;
}

/** 10 fixed positions spread across the pond (percentage of container) */
const ALL_POSITIONS: PadPosition[] = [
    { id: 0, px: 18, py: 15 },
    { id: 1, px: 50, py: 10 },
    { id: 2, px: 82, py: 15 },
    { id: 3, px: 12, py: 42 },
    { id: 4, px: 36, py: 38 },
    { id: 5, px: 62, py: 38 },
    { id: 6, px: 88, py: 42 },
    { id: 7, px: 22, py: 68 },
    { id: 8, px: 52, py: 72 },
    { id: 9, px: 80, py: 68 },
];

export interface LevelParams {
    padCount: number;     // how many lily pads to show (4–10)
    jumpCount: number;    // how many jumps in the sequence
    jumpDelay: number;    // ms between demo jumps
}

/**
 * Get level parameters.
 * Pads: 4 at level 1, +1 every 2 levels, max 10
 * Jumps: 2 at level 1, +1 per level, max 9
 * Speed: 1200ms at level 1, ×0.94 per level, min 500ms
 */
export function getLevelParams(level: number): LevelParams {
    return {
        padCount: Math.min(4 + Math.floor((level - 1) / 2), 10),
        jumpCount: Math.min(1 + level, 9),
        jumpDelay: Math.max(Math.round(1200 * Math.pow(0.94, level - 1)), 500),
    };
}

/** Pick `count` random positions from the 10 fixed ones */
export function pickPadPositions(count: number): PadPosition[] {
    const shuffled = [...ALL_POSITIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * Generate a jump sequence of `jumpCount` jumps across `pads`.
 * Returns array of pad IDs (length = jumpCount + 1, first element is start).
 * Avoids consecutive same-pad jumps.
 */
export function generateJumpSequence(pads: PadPosition[], jumpCount: number): number[] {
    const ids = pads.map(p => p.id);
    const seq: number[] = [];

    // Pick random start
    seq.push(ids[Math.floor(Math.random() * ids.length)]);

    for (let i = 0; i < jumpCount; i++) {
        let next: number;
        let attempts = 0;
        do {
            next = ids[Math.floor(Math.random() * ids.length)];
            attempts++;
        } while (next === seq[seq.length - 1] && attempts < 20 && ids.length > 1);
        seq.push(next);
    }

    return seq;
}

/** Calculate score for a successful round */
export function calculateScore(level: number, elapsedMs: number): number {
    const base = 100;
    const levelBonus = level * 20;
    const timeBonus = elapsedMs < 5000 ? 50 : elapsedMs < 10000 ? 25 : 0;
    return base + levelBonus + timeBonus;
}
