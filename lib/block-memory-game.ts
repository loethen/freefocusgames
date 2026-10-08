export const BLOCK_MEMORY_CHALLENGE_START = 3;
export const BLOCK_MEMORY_PRACTICE_MIN = 1;
export const BLOCK_MEMORY_PRACTICE_MAX = 20;
export const BLOCK_MEMORY_LEADERBOARD_MODE = "sequence-v1";
export const BLOCK_MEMORY_RULES_VERSION = 1;
export const BLOCK_MEMORY_PREPARE_SECONDS = 2;

export type BlockMemoryMode = "challenge" | "practice";
export type BlockMemoryStatus = "idle" | "starting" | "preparing" | "showing" | "gap" | "guessing" | "correct" | "complete" | "failed";

export interface BlockMemoryState {
    status: BlockMemoryStatus;
    mode: BlockMemoryMode;
    length: number;
    pattern: number[];
    displayIndex: number;
    inputIndex: number;
    selectedBlock: number | null;
    completedLength: number;
    prepareSeconds: number;
}

export const initialBlockMemoryState: BlockMemoryState = {
    status: "idle",
    mode: "challenge",
    length: BLOCK_MEMORY_CHALLENGE_START,
    pattern: [],
    displayIndex: 0,
    inputIndex: 0,
    selectedBlock: null,
    completedLength: 0,
    prepareSeconds: 0,
};

type Action =
    | { type: "start"; mode: BlockMemoryMode; pattern: number[] }
    | { type: "ready" }
    | { type: "prepare-tick"; remaining: number }
    | { type: "display-tick" }
    | { type: "select"; blockId: number }
    | { type: "clear-selection"; inputIndex: number }
    | { type: "feedback-end" }
    | { type: "next-round"; pattern: number[] }
    | { type: "reset" };

// Advance input immediately; visual feedback never blocks the next valid click.
export function blockMemoryReducer(state: BlockMemoryState, action: Action): BlockMemoryState {
    switch (action.type) {
        case "start":
            if (state.status !== "idle" && state.status !== "failed") return state;
            if (action.pattern.length < 1 || (action.mode === "challenge" && action.pattern.length !== BLOCK_MEMORY_CHALLENGE_START)) return state;
            if (action.mode === "practice" && action.pattern.length > BLOCK_MEMORY_PRACTICE_MAX) return state;
            return { ...initialBlockMemoryState, status: "starting", mode: action.mode, pattern: action.pattern, length: action.pattern.length };
        case "ready":
            return state.status === "starting" ? { ...state, status: "preparing", prepareSeconds: BLOCK_MEMORY_PREPARE_SECONDS } : state;
        case "prepare-tick":
            if (state.status !== "preparing" || action.remaining !== state.prepareSeconds) return state;
            return state.prepareSeconds > 1
                ? { ...state, prepareSeconds: state.prepareSeconds - 1 }
                : { ...state, status: "showing", prepareSeconds: 0 };
        case "display-tick":
            if (state.status === "showing") return { ...state, status: "gap" };
            if (state.status !== "gap") return state;
            return state.displayIndex + 1 < state.pattern.length
                ? { ...state, status: "showing", displayIndex: state.displayIndex + 1 }
                : { ...state, status: "guessing" };
        case "select": {
            if (state.status !== "guessing" || !Number.isInteger(action.blockId) || action.blockId < 0 || action.blockId > 8) return state;
            // Generated sequences never repeat adjacent blocks. Ignore a quick
            // duplicate activation of the last accepted block during its feedback.
            if (action.blockId === state.selectedBlock) return state;
            if (action.blockId !== state.pattern[state.inputIndex]) {
                return { ...state, status: "failed", selectedBlock: action.blockId };
            }
            const inputIndex = state.inputIndex + 1;
            return {
                ...state,
                status: inputIndex === state.pattern.length ? "correct" : "guessing",
                inputIndex,
                selectedBlock: action.blockId,
                completedLength: inputIndex === state.pattern.length ? state.length : state.completedLength,
            };
        }
        case "clear-selection":
            return state.status === "guessing" && action.inputIndex === state.inputIndex
                ? { ...state, selectedBlock: null }
                : state;
        case "feedback-end":
            if (state.status !== "correct") return state;
            return { ...state, status: state.inputIndex === state.pattern.length ? "complete" : "guessing", selectedBlock: null };
        case "next-round":
            if (state.status !== "complete" || action.pattern.length !== state.length + 1) return state;
            return { ...state, status: "preparing", prepareSeconds: BLOCK_MEMORY_PREPARE_SECONDS, length: action.pattern.length, pattern: action.pattern, displayIndex: 0, inputIndex: 0, selectedBlock: null };
        case "reset":
            return initialBlockMemoryState;
    }
}

export function generateBlockMemoryPattern(length: number, random = Math.random): number[] {
    const pattern: number[] = [];
    for (let index = 0; index < length; index += 1) {
        const previous = pattern[index - 1];
        const candidate = Math.floor(random() * (index === 0 ? 9 : 8));
        pattern.push(index > 0 && candidate >= previous ? candidate + 1 : candidate);
    }
    return pattern;
}

export function validateBlockMemorySubmission(score: number, mode: string, details: { startingLength?: unknown; rulesVersion?: unknown } | null) {
    if (mode !== BLOCK_MEMORY_LEADERBOARD_MODE) return "Score rejected (Unsupported sequence memory mode)";
    if (!Number.isInteger(score) || score < BLOCK_MEMORY_CHALLENGE_START || score > 50000) return "Score rejected (Invalid completed sequence length)";
    if (details?.startingLength !== BLOCK_MEMORY_CHALLENGE_START || details?.rulesVersion !== BLOCK_MEMORY_RULES_VERSION) return "Score rejected (Invalid challenge rules)";
    return null;
}
