'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { analytics } from '@/lib/analytics';
import GameCard from '@/components/game-card';
import { getGame, getGamesByCategory, type Game } from '@/data/games';

import ReactionTimeTest from './tests/ReactionTimeTest';
import MemoryTest from './tests/MemoryTest';
import StroopTest from './tests/StroopTest';

type GoalId = 'focus' | 'memory' | 'speed' | 'relax' | 'justPlay';
type CheckType = 'reaction' | 'memory' | 'stroop';
type Level = 'strong' | 'building';

interface GoalPlan {
  icon: string;
  category: string;
  check?: CheckType;
  // Ordered picks; the first is the top pick. Missing games fall back to the category.
  picks: Record<Level, string[]>;
}

const GOAL_PLANS: Record<GoalId, GoalPlan> = {
  focus: {
    icon: '🎯',
    category: 'selective-attention',
    check: 'stroop',
    picks: {
      strong: ['stroop-effect-test', 'rotating-schulte-table', 'trail-making-test'],
      building: ['schulte-table', 'focus-reaction-test', 'pomodoro-timer'],
    },
  },
  memory: {
    icon: '🧠',
    category: 'working-memory',
    check: 'memory',
    picks: {
      strong: ['dual-n-back', 'digit-span-test', 'block-memory-challenge'],
      building: ['block-memory-challenge', 'memory-matching-game', 'digit-span-test'],
    },
  },
  speed: {
    icon: '⚡',
    category: 'reaction-time',
    check: 'reaction',
    picks: {
      strong: ['double-decision', 'cps-test', 'challenge10Seconds'],
      building: ['reaction-time', 'challenge10Seconds', 'larger-number'],
    },
  },
  relax: {
    icon: '🌿',
    category: 'relaxation',
    picks: {
      strong: ['box-breathing', '478-breathing', 'resonance-breathing'],
      building: ['box-breathing', '478-breathing', 'resonance-breathing'],
    },
  },
  justPlay: {
    icon: '🎲',
    category: 'reaction-time',
    picks: {
      strong: ['challenge10Seconds', 'reaction-time', 'sbti-test'],
      building: ['challenge10Seconds', 'reaction-time', 'sbti-test'],
    },
  },
};

const GOAL_ORDER: GoalId[] = ['focus', 'memory', 'speed', 'relax', 'justPlay'];
const PICK_COUNT = 3;

interface CheckResult {
  type: CheckType;
  value: number;
}

// Higher memory/Stroop scores and faster reactions point to the harder picks.
function getLevel(result: CheckResult | null): Level {
  if (!result) return 'building';
  if (result.type === 'reaction') return result.value <= 350 ? 'strong' : 'building';
  return result.value >= 75 ? 'strong' : 'building';
}

function getPicks(goal: GoalId, level: Level): Game[] {
  const plan = GOAL_PLANS[goal];
  const picked = plan.picks[level]
    .map((id) => getGame(id))
    .filter((game): game is Game => Boolean(game));
  for (const game of getGamesByCategory(plan.category)) {
    if (picked.length >= PICK_COUNT) break;
    if (!picked.some((item) => item.id === game.id)) picked.push(game);
  }
  return picked.slice(0, PICK_COUNT);
}

export default function OnboardingFlow() {
  const t = useTranslations('getStarted');
  const categoryT = useTranslations('categories.categoryNames');

  const [goal, setGoal] = useState<GoalId | null>(null);
  const [stage, setStage] = useState<'goal' | 'check' | 'results'>('goal');
  const [result, setResult] = useState<CheckResult | null>(null);

  const chooseGoal = useCallback((id: GoalId) => {
    setGoal(id);
    setResult(null);
    if (GOAL_PLANS[id].check) {
      analytics.assessment.start({ test_type: `assessment_${id}` });
      setStage('check');
    } else {
      setStage('results');
    }
  }, []);

  const finishCheck = useCallback((type: CheckType, value: number) => {
    if (!goal) return;
    const checkResult = { type, value };
    setResult(checkResult);
    analytics.assessment.complete({
      test_type: `assessment_${goal}`,
      recommendations: getPicks(goal, getLevel(checkResult)).map((game) => game.slug),
    });
    setStage('results');
  }, [goal]);

  const restart = useCallback(() => {
    setGoal(null);
    setResult(null);
    setStage('goal');
  }, []);

  const renderGoalStep = () => (
    <div>
      <h2 className="mb-2 text-2xl font-semibold">{t('goalSetting.title')}</h2>
      <p className="mb-6 text-muted-foreground">{t('goalSetting.subtitle')}</p>
      <div className="grid grid-cols-1 gap-3">
        {GOAL_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => chooseGoal(id)}
            className="group flex items-center gap-4 rounded-xl border-2 border-border p-4 text-left transition-all hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="text-3xl" aria-hidden="true">{GOAL_PLANS[id].icon}</span>
            <span className="flex-1">
              <span className="block text-lg font-semibold">{t(`goalSetting.goals.${id}.title`)}</span>
              <span className="block text-sm text-muted-foreground">{t(`goalSetting.goals.${id}.subtitle`)}</span>
            </span>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );

  const renderCheckStep = () => {
    if (!goal) return null;
    const check = GOAL_PLANS[goal].check;

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('check.hint')}</p>
        {check === 'reaction' && <ReactionTimeTest onComplete={(ms) => finishCheck('reaction', ms)} />}
        {check === 'memory' && <MemoryTest onComplete={(score) => finishCheck('memory', score)} />}
        {check === 'stroop' && <StroopTest onComplete={(score) => finishCheck('stroop', score)} />}
        <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-border/70 pt-4 sm:flex-row">
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('check.back')}
          </button>
          <button
            type="button"
            onClick={() => setStage('results')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {t('check.skip')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!goal) return null;
    const plan = GOAL_PLANS[goal];
    const level = getLevel(result);
    const picks = getPicks(goal, level);
    const [topPick, ...alsoTry] = picks;
    const categoryName = categoryT(plan.category);

    const summary = result
      ? t(`results.summary.${result.type}.${level}`, { value: Math.round(result.value) })
      : t(`results.summary.${goal}`);

    const renderCard = (game: Game) => (
      <div
        key={game.id}
        onClickCapture={() => analytics.navigation.recommendation({
          from_page: 'get-started',
          to_page: `games/${game.slug}`,
          link_location: 'assessment_recommendation',
          game_to: game.slug,
        })}
      >
        <GameCard game={game} className="h-full" />
      </div>
    );

    return (
      <div className="space-y-6 text-left">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold">{t('results.title')}</h2>
          <p className="text-muted-foreground">{summary}</p>
          {result && <p className="mt-2 text-xs text-muted-foreground">{t('results.disclaimer')}</p>}
        </div>

        {topPick && (
          <section aria-labelledby="top-pick-title">
            <h3 id="top-pick-title" className="mb-3 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t('results.topPick')}
            </h3>
            {renderCard(topPick)}
          </section>
        )}

        {alsoTry.length > 0 && (
          <section aria-labelledby="also-try-title">
            <h3 id="also-try-title" className="mb-3 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t('results.alsoTry')}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {alsoTry.map(renderCard)}
            </div>
          </section>
        )}

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/70 pt-4 sm:flex-row">
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t('results.startOver')}
          </button>
          <Link
            href={`/categories/${plan.category}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {t('results.browseCategory', { category: categoryName })}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-10 text-center">
      <h1 className="mb-3 text-3xl font-bold">{t('title')}</h1>
      <p className="mb-8 max-w-xl text-muted-foreground">{t('intro')}</p>

      <div className="w-full max-w-2xl rounded-2xl bg-background/80 p-6 shadow">
        {stage === 'goal' && renderGoalStep()}
        {stage === 'check' && renderCheckStep()}
        {stage === 'results' && renderResults()}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {t('browseAllPrefix')}{' '}
        <Link href="/games" className="font-medium text-primary hover:underline">
          {t('browseAll')}
        </Link>
      </p>
    </div>
  );
}
