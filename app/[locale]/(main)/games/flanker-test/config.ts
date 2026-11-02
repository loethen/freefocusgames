export enum GameState {
  START = 'START',
  COUNTDOWN = 'COUNTDOWN',
  PLAYING = 'PLAYING',
  PRACTICE_DONE = 'PRACTICE_DONE',
  RESULTS = 'RESULTS'
}

// Phases inside a single trial: fixation cross, arrows on screen, then feedback
export type TrialPhase = 'fixation' | 'stimulus' | 'feedback';

export enum TrialType {
  CONGRUENT = 'CONGRUENT',     // >>>>>, <<<<< - flankers match target
  INCONGRUENT = 'INCONGRUENT', // >><>>, <<><<  - flankers conflict with target
  NEUTRAL = 'NEUTRAL'          // --<--, -->--  - neutral flankers
}

export enum Direction {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export type Response = 'left' | 'right';

export interface Trial {
  id: number;
  type: TrialType;
  targetDirection: Direction;
  stimuli: ('left' | 'right' | 'neutral')[];
  correctResponse: Response;
}

export interface GameResult {
  trial: Trial;
  // null when the trial timed out without a response
  response: Response | null;
  reactionTime: number;
  accuracy: boolean;
}

export const GAME_CONFIG = {
  PRACTICE_TRIALS: 4,
  TOTAL_TRIALS: 40,
  COUNTDOWN_DURATION: 3,
  TRIAL_DURATION: 2000,
  FEEDBACK_DURATION: 500,
  FIXATION_DURATION: 500,

  // Trial distribution
  CONGRUENT_RATIO: 0.4,    // 40% congruent trials
  INCONGRUENT_RATIO: 0.4,  // 40% incongruent trials
  NEUTRAL_RATIO: 0.2,      // 20% neutral trials
};

// Stimuli patterns for different trial types
export const STIMULI_PATTERNS: Record<TrialType, Record<Direction, ('left' | 'right' | 'neutral')[]>> = {
  [TrialType.CONGRUENT]: {
    [Direction.LEFT]: ['left', 'left', 'left', 'left', 'left'],
    [Direction.RIGHT]: ['right', 'right', 'right', 'right', 'right']
  },
  [TrialType.INCONGRUENT]: {
    [Direction.LEFT]: ['right', 'right', 'left', 'right', 'right'],
    [Direction.RIGHT]: ['left', 'left', 'right', 'left', 'left']
  },
  [TrialType.NEUTRAL]: {
    [Direction.LEFT]: ['neutral', 'neutral', 'left', 'neutral', 'neutral'],
    [Direction.RIGHT]: ['neutral', 'neutral', 'right', 'neutral', 'neutral']
  }
};

function makeTrial(id: number, type: TrialType, direction: Direction): Trial {
  return {
    id,
    type,
    targetDirection: direction,
    stimuli: STIMULI_PATTERNS[type][direction],
    correctResponse: direction === Direction.LEFT ? 'left' : 'right'
  };
}

// Each trial type gets an equal number of left and right targets
function addBalanced(trials: Trial[], type: TrialType, count: number) {
  for (let i = 0; i < count; i++) {
    const direction = i % 2 === 0 ? Direction.LEFT : Direction.RIGHT;
    trials.push(makeTrial(trials.length + 1, type, direction));
  }
}

export function generateTrials(): Trial[] {
  const trials: Trial[] = [];
  const totalTrials = GAME_CONFIG.TOTAL_TRIALS;

  const congruentCount = Math.floor(totalTrials * GAME_CONFIG.CONGRUENT_RATIO);
  const incongruentCount = Math.floor(totalTrials * GAME_CONFIG.INCONGRUENT_RATIO);
  const neutralCount = totalTrials - congruentCount - incongruentCount;

  addBalanced(trials, TrialType.CONGRUENT, congruentCount);
  addBalanced(trials, TrialType.INCONGRUENT, incongruentCount);
  addBalanced(trials, TrialType.NEUTRAL, neutralCount);

  return shuffleArray(trials);
}

// Two congruent and two incongruent trials, one of each direction
export function generatePracticeTrials(): Trial[] {
  return shuffleArray([
    makeTrial(1, TrialType.CONGRUENT, Direction.LEFT),
    makeTrial(2, TrialType.CONGRUENT, Direction.RIGHT),
    makeTrial(3, TrialType.INCONGRUENT, Direction.LEFT),
    makeTrial(4, TrialType.INCONGRUENT, Direction.RIGHT),
  ]).slice(0, GAME_CONFIG.PRACTICE_TRIALS);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function mean(values: number[]) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function accuracyOf(results: GameResult[]) {
  return results.length > 0 ? (results.filter(r => r.accuracy).length / results.length) * 100 : 0;
}

export function calculateStats(results: GameResult[]) {
  if (results.length === 0) return null;

  const correctRT = (items: GameResult[]) => items.filter(r => r.accuracy).map(r => r.reactionTime);
  const congruentTrials = results.filter(r => r.trial.type === TrialType.CONGRUENT);
  const incongruentTrials = results.filter(r => r.trial.type === TrialType.INCONGRUENT);

  const avgCongruentRT = mean(correctRT(congruentTrials));
  const avgIncongruentRT = mean(correctRT(incongruentTrials));

  // Flanker effect: incongruent minus congruent RT on correct trials.
  // A single short run can come out negative; report it as measured.
  const flankerEffect = avgCongruentRT > 0 && avgIncongruentRT > 0 ? avgIncongruentRT - avgCongruentRT : 0;

  return {
    totalTrials: results.length,
    accuracy: Math.round(accuracyOf(results)),
    avgReactionTime: Math.round(mean(correctRT(results))),
    avgCongruentRT: Math.round(avgCongruentRT),
    avgIncongruentRT: Math.round(avgIncongruentRT),
    flankerEffect: Math.round(flankerEffect),
    congruentAccuracy: Math.round(accuracyOf(congruentTrials)),
    incongruentAccuracy: Math.round(accuracyOf(incongruentTrials))
  };
}
