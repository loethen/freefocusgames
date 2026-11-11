'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Dices, Play, RotateCcw, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import GameCard, { CATEGORY_DOT, gameTitleKey } from '@/components/game-card';
import { games, getGame, getGamesByCategory, type Game } from '@/data/games';
import { filterGamesForLocale, isPathAvailable } from '@/lib/locale-availability';

import ReactionTimeTest from './tests/ReactionTimeTest';
import MemoryTest from './tests/MemoryTest';
import StroopTest from './tests/StroopTest';
import GoalVisual from './GoalVisual';

type GoalId = 'focus' | 'memory' | 'speed' | 'relax' | 'justPlay';
type CheckType = 'reaction' | 'memory' | 'stroop';
type Level = 'strong' | 'building';

interface GoalPlan {
  // Accent for the goal card; matches the category colour used on game cards.
  accent: string;
  category: string;
  check?: CheckType;
  // Ordered picks; the first is the top pick. Missing games fall back to the category.
  picks: Record<Level, string[]>;
}

const GOAL_PLANS: Record<GoalId, GoalPlan> = {
  focus: {
    accent: CATEGORY_DOT['selective-attention'],
    category: 'selective-attention',
    check: 'stroop',
    picks: {
      strong: ['stroop-effect-test', 'rotating-schulte-table', 'trail-making-test'],
      building: ['schulte-table', 'focus-reaction-test', 'pomodoro-timer'],
    },
  },
  memory: {
    accent: CATEGORY_DOT['working-memory'],
    category: 'working-memory',
    check: 'memory',
    picks: {
      strong: ['dual-n-back', 'digit-span-test', 'block-memory-challenge'],
      building: ['block-memory-challenge', 'memory-matching-game', 'digit-span-test'],
    },
  },
  speed: {
    accent: CATEGORY_DOT['reaction-time'],
    category: 'reaction-time',
    check: 'reaction',
    picks: {
      strong: ['double-decision', 'cps-test', 'challenge10Seconds'],
      building: ['reaction-time', 'challenge10Seconds', 'larger-number'],
    },
  },
  relax: {
    accent: CATEGORY_DOT.relaxation,
    category: 'relaxation',
    picks: {
      strong: ['box-breathing', '478-breathing', 'resonance-breathing'],
      building: ['box-breathing', '478-breathing', 'resonance-breathing'],
    },
  },
  justPlay: {
    accent: '#EF9F27',
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

// Picks are limited to games that exist in the visitor's language (Japanese is
// rolled out page by page); the category, then the rest of the library, fill gaps.
function getPicks(goal: GoalId, level: Level, locale: string): Game[] {
  const plan = GOAL_PLANS[goal];
  const picked = filterGamesForLocale(locale, plan.picks[level]
    .map((id) => getGame(id))
    .filter((game): game is Game => Boolean(game)));
  const fillers = [
    ...filterGamesForLocale(locale, getGamesByCategory(plan.category)),
    ...(goal === 'relax' ? [] : filterGamesForLocale(locale, games)),
  ];
  for (const game of fillers) {
    if (picked.length >= PICK_COUNT) break;
    if (!picked.some((item) => item.id === game.id)) picked.push(game);
  }
  return picked.slice(0, PICK_COUNT);
}

type Stage = 'goal' | 'check' | 'results';

// Reaction times on this scale run from slow (left) to fast (right).
const REACTION_SCALE = { slow: 650, fast: 150 };
// Commonly reported range for simple visual reaction time in a browser.
const REACTION_TYPICAL = { from: 250, to: 300 };

function reactionToPosition(ms: number): number {
  return (REACTION_SCALE.slow - ms) / (REACTION_SCALE.slow - REACTION_SCALE.fast);
}

function meterPosition(result: CheckResult): number {
  const raw = result.type === 'reaction' ? reactionToPosition(result.value) : result.value / 100;
  return Math.min(1, Math.max(0, raw));
}

function meterThreshold(type: CheckType): number {
  return type === 'reaction' ? reactionToPosition(350) : 0.75;
}

export default function OnboardingFlow({ header }: { header: React.ReactNode }) {
  const t = useTranslations('getStarted');
  const gamesT = useTranslations('games');
  const categoryT = useTranslations('categories.categoryNames');
  const locale = useLocale();
  // A goal with nothing to recommend in this language is not offered.
  const goalOrder = GOAL_ORDER.filter((id) => getPicks(id, 'building', locale).length > 0);

  const [goal, setGoal] = useState<GoalId | null>(null);
  const [stage, setStage] = useState<Stage>('goal');
  const [result, setResult] = useState<CheckResult | null>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  // A new step starts at its top; scroll back only when that top is off screen.
  useEffect(() => {
    const el = flowRef.current;
    if (!el || el.getBoundingClientRect().top >= 0) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  }, [stage]);

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
      recommendations: getPicks(goal, getLevel(checkResult), locale).map((game) => game.slug),
    });
    setStage('results');
  }, [goal, locale]);

  const restart = useCallback(() => {
    setGoal(null);
    setResult(null);
    setStage('goal');
  }, []);

  const renderGoalStep = () => (
    <div>
      <h2 className="sr-only">{t('goalSetting.title')}</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {goalOrder.filter((id): id is Exclude<GoalId, 'justPlay'> => id !== 'justPlay').map((id, index) => (
          <button
            key={id}
            type="button"
            onClick={() => chooseGoal(id)}
            style={{ animationDelay: `${index * 60}ms` }}
            className="tests-rise group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border text-left transition-[border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-foreground/25 active:translate-y-0 active:scale-[0.985] active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
          >
            <span className="relative flex aspect-[4/3] w-full items-center justify-center bg-muted/50 transition-colors duration-300 group-hover:bg-muted">
              <GoalVisual goal={id} />
              {!GOAL_PLANS[id].check && (
                <span className="absolute right-2.5 top-2.5 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {t('goalSetting.noCheck')}
                </span>
              )}
            </span>
            <span className="flex flex-1 flex-col gap-1 p-4">
              <span className="flex items-start gap-2">
                <span className="font-semibold leading-snug">{t(`goalSetting.goals.${id}.title`)}</span>
                <ArrowRight
                  className="ml-auto mt-0.5 h-4 w-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </span>
              <span className="text-sm leading-snug text-muted-foreground">{t(`goalSetting.goals.${id}.subtitle`)}</span>
            </span>
          </button>
        ))}
      </div>
      {goalOrder.includes('justPlay') && (
        <button
          type="button"
          onClick={() => chooseGoal('justPlay')}
          className="tests-rise group mx-auto mt-6 cursor-pointer flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ animationDelay: '260ms' }}
        >
          <Dices className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[20deg] motion-reduce:transition-none motion-reduce:group-hover:rotate-0" strokeWidth={1.75} aria-hidden="true" />
          {t('goalSetting.justPlayLink')}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" aria-hidden="true" />
        </button>
      )}
    </div>
  );

  const renderCheckStep = () => {
    if (!goal) return null;
    const check = GOAL_PLANS[goal].check;

    return (
      <div className="space-y-4">
        <div className="flex min-h-[380px] flex-col justify-center rounded-3xl bg-muted/50 px-4 py-8 sm:px-8 sm:py-10">
          {check === 'reaction' && <ReactionTimeTest onComplete={(ms) => finishCheck('reaction', ms)} />}
          {check === 'memory' && <MemoryTest onComplete={(score) => finishCheck('memory', score)} />}
          {check === 'stroop' && <StroopTest onComplete={(score) => finishCheck('stroop', score)} />}
        </div>
        <p className="text-center text-xs text-muted-foreground">{t('check.hint')}</p>
        <div className="flex flex-col-reverse items-center justify-between gap-3 pt-1 sm:flex-row">
          <button
            type="button"
            onClick={restart}
            className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('check.back')}
          </button>
          <button
            type="button"
            onClick={() => setStage('results')}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {t('check.skip')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  };

  const renderMeter = (checkResult: CheckResult, level: Level, accent: string) => {
    const position = meterPosition(checkResult);
    const threshold = meterThreshold(checkResult.type);
    const isReaction = checkResult.type === 'reaction';
    const value = Math.round(checkResult.value);

    return (
      <div className="border-y border-border/70 py-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t(`results.meter.${checkResult.type}`)}
            </p>
            <p className="text-4xl font-bold tabular-nums tracking-tight">
              {value}
              <span className="ml-1 text-lg font-semibold text-muted-foreground">{isReaction ? 'ms' : '%'}</span>
            </p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: `${accent}24`, color: accent }}
          >
            {t(`results.level.${level}`)}
          </span>
        </div>
        <div className="relative mt-5 h-2.5 rounded-full bg-border/70">
          {isReaction && (
            <div
              aria-hidden="true"
              className="absolute -inset-y-1 rounded-sm bg-foreground/10"
              style={{
                left: `${reactionToPosition(REACTION_TYPICAL.to) * 100}%`,
                width: `${(reactionToPosition(REACTION_TYPICAL.from) - reactionToPosition(REACTION_TYPICAL.to)) * 100}%`,
              }}
            />
          )}
          <div
            className="meter-fill absolute inset-y-0 left-0 origin-left rounded-full"
            style={{ width: `${position * 100}%`, backgroundColor: accent }}
          />
          <span
            aria-hidden="true"
            className="absolute -top-1 h-4.5 w-0.5 rounded bg-foreground/40"
            style={{ left: `${threshold * 100}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{isReaction ? t('results.meter.slower') : '0%'}</span>
          <span>{isReaction ? t('results.meter.faster') : '100%'}</span>
        </div>
        {isReaction && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t('results.meter.typical', REACTION_TYPICAL)}
          </p>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (!goal) return null;
    const plan = GOAL_PLANS[goal];
    const level = getLevel(result);
    const picks = getPicks(goal, level, locale);
    const [topPick, ...alsoTry] = picks;
    const categoryName = categoryT(plan.category);

    const summary = result
      // summary.memory is the no-check text, so the memory check has its own key.
      ? t(`results.summary.${result.type === 'memory' ? 'memoryCheck' : result.type}.${level}`, { value: Math.round(result.value) })
      : t(`results.summary.${goal}`);

    const trackClick = (game: Game) => () => analytics.navigation.recommendation({
      from_page: 'get-started',
      to_page: `games/${game.slug}`,
      link_location: 'assessment_recommendation',
      game_to: game.slug,
    });

    return (
      <div className="space-y-6 text-left">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold">{t('results.title')}</h2>
          <p className="text-muted-foreground">{summary}</p>
        </div>

        {result && (
          <div>
            {renderMeter(result, level, plan.accent)}
            <p className="mt-2 text-center text-xs text-muted-foreground">{t('results.disclaimer')}</p>
          </div>
        )}

        {topPick && (
          <section aria-labelledby="top-pick-title">
            <h3 id="top-pick-title" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium uppercase tracking-[0.14em] text-foreground">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t('results.topPick')}
            </h3>
            <div onClickCapture={trackClick(topPick)} className="space-y-3">
              <GameCard game={topPick} className="h-full" />
              <Link
                href={`/games/${topPick.slug}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] [transition-property:background-color,transform] motion-reduce:active:scale-100"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                {t('results.playNow', { game: gamesT(`${gameTitleKey(topPick.id)}.title`) })}
              </Link>
            </div>
          </section>
        )}

        {alsoTry.length > 0 && (
          <section aria-labelledby="also-try-title">
            <h3 id="also-try-title" className="mb-3 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t('results.alsoTry')}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {alsoTry.map((game) => (
                <div key={game.id} onClickCapture={trackClick(game)}>
                  <GameCard game={game} className="h-full" />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/70 pt-4 sm:flex-row">
          <button
            type="button"
            onClick={restart}
            className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t('results.startOver')}
          </button>
          {isPathAvailable(locale, `categories/${plan.category}`) && (
            <Link
              href={`/categories/${plan.category}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {t('results.browseCategory', { category: categoryName })}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {stage === 'goal' && header}
      <div ref={flowRef} className={cn('mx-auto w-full scroll-mt-24', stage === 'goal' ? 'max-w-4xl' : 'max-w-3xl')}>
        <div key={stage} className={stage === 'goal' ? undefined : 'tests-rise'}>
          {stage === 'goal' && renderGoalStep()}
          {stage === 'check' && renderCheckStep()}
          {stage === 'results' && renderResults()}
        </div>
      </div>

      {stage === 'goal' && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('browseAllPrefix')}{' '}
          <Link href="/games" className="font-medium text-primary hover:underline">
            {t('browseAll')}
          </Link>
        </p>
      )}
    </div>
  );
}
