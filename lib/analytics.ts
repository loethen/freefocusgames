// GA4 custom events for FreeFocusGames.
// Page views, scrolls and outbound clicks come from GA4 enhanced measurement;
// only actions GA cannot see on its own are tracked here.

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export interface GameEventData {
  game_id: string;
  mode?: string;
  level?: number;
  score?: number;
  duration_ms?: number;
  accuracy?: number;
  difficulty?: string;
}

export interface AssessmentEventData {
  test_type: string;
  result?: number;
  duration_ms?: number;
  recommendations?: string[];
}

// Avoid a parameter named `source`: GA4 treats it as a traffic source and
// overwrites the session's real source/medium.
export interface RecommendationEventData {
  from_page?: string;
  to_page?: string;
  game_from?: string;
  game_to?: string;
  link_location?: string;
}

export interface TutorialEventData {
  game_id: string;
  total_steps?: number;
  duration_ms?: number;
  correct_responses?: number;
  total_responses?: number;
}

const trackEvent = (eventName: string, parameters: Record<string, unknown> = {}) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  window.gtag('event', eventName, parameters);

  if (process.env.NODE_ENV === 'development') {
    console.log('📊 GA4 Event:', eventName, parameters);
  }
};

export const trackStartAssessment = (data: AssessmentEventData) => {
  trackEvent('start_assessment', {
    test_type: data.test_type
  });
};

export const trackCompleteAssessment = (data: AssessmentEventData) => {
  trackEvent('complete_assessment', {
    test_type: data.test_type,
    result: data.result || 0,
    duration_ms: data.duration_ms || 0,
    recommendations: data.recommendations?.join(',') || ''
  });
};

export const trackStartGame = (data: GameEventData) => {
  trackEvent('start_game', {
    game_id: data.game_id,
    mode: data.mode || 'standard',
    level: data.level || 1,
    difficulty: data.difficulty || 'normal'
  });
};

export const trackCompleteGame = (data: GameEventData) => {
  trackEvent('complete_game', {
    game_id: data.game_id,
    mode: data.mode || 'standard',
    level: data.level || 1,
    score: data.score || 0,
    duration_ms: data.duration_ms || 0,
    accuracy: data.accuracy || 0,
    difficulty: data.difficulty || 'normal'
  });
};

export const trackGameRecommendationClick = (data: RecommendationEventData) => {
  trackEvent('game_recommendation_click', {
    from_page: data.from_page || '',
    to_page: data.to_page || '',
    game_from: data.game_from || '',
    game_to: data.game_to || '',
    link_location: data.link_location || 'recommendation'
  });
};

export const trackShareResults = (data: GameEventData) => {
  trackEvent('share_results', {
    game_id: data.game_id,
    score: data.score || 0,
    accuracy: data.accuracy || 0
  });
};

export const trackTutorialStart = (data: TutorialEventData) => {
  trackEvent('tutorial_start', {
    game_id: data.game_id,
    total_steps: data.total_steps || 0
  });
};

export const trackTutorialComplete = (data: TutorialEventData) => {
  trackEvent('tutorial_complete', {
    game_id: data.game_id,
    duration_ms: data.duration_ms || 0,
    correct_responses: data.correct_responses || 0,
    total_responses: data.total_responses || 0
  });
};

export const analytics = {
  assessment: {
    start: trackStartAssessment,
    complete: trackCompleteAssessment
  },
  game: {
    start: trackStartGame,
    complete: trackCompleteGame
  },
  tutorial: {
    start: trackTutorialStart,
    complete: trackTutorialComplete
  },
  navigation: {
    recommendation: trackGameRecommendationClick
  },
  social: {
    share: trackShareResults
  }
};

export default analytics;
