'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { submitScoreToLeaderboard } from '@/lib/leaderboard'
import {
  SCHOOL_RUN_FEEDBACK_MS,
  SCHOOL_RUN_MASK_MS,
  SCHOOL_RUN_RULES_VERSION,
  schoolRunRound,
} from '@/lib/school-run-rules'
import { SchoolRunScene, type StimulusSpec } from './scene/engine'
import { type FieldLevel, type SceneSize, LANDSCAPE, SLOT_COUNT, slotPosition } from './scene/layout'
import type { FlyerKind, SnackKind } from './scene/sprites'
import { SnackIcon } from './SnackIcon'

type Phase =
  | 'intro'
  | 'countdown'
  | 'stimulus'
  | 'snack-answer'
  | 'location-answer'
  | 'feedback'
  | 'paused'
  | 'results'

interface Trial {
  spec: StimulusSpec
  // The two snack buttons, in the order they are shown.
  options: [SnackKind, SnackKind]
}

interface TrialOutcome {
  snackCorrect: boolean
  locationCorrect: boolean | null
}

// Endless rounds, one mistake ends the run; the flash schedule lives in lib/school-run-rules so the
// leaderboard API can check runs against it.
// A miss stays on screen a little longer, so the player sees where the plane was.
const GAME_OVER_MS = 1800
const BEST_ROUNDS_KEY = 'schoolRunBestRounds'

// The two snacks look more alike as the level rises.
const SNACK_PAIRS: Record<FieldLevel, [SnackKind, SnackKind][]> = {
  1: [['icecream', 'burger'], ['juice', 'donut']],
  2: [['lollipop', 'icecream'], ['cookie', 'burger']],
  3: [['donut', 'cookie'], ['lollipop', 'cookie']],
}

// Other paper planes in the sky; on the top level a red kite and a red balloon look like the target.
const DISTRACTORS: Record<FieldLevel, FlyerKind[]> = {
  1: [],
  2: ['blue', 'green', 'purple'],
  3: ['blue', 'green', 'purple', 'red-kite', 'red-balloon', 'blue', 'purple'],
}

// Slate outline and pale offset shadow shared by the panels and buttons drawn over the scene.
const PANEL = 'rounded-2xl border-2 border-[#3c4656] bg-white text-[#3c4656] shadow-[5px_5px_0_rgba(60,70,86,0.28)]'
const BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#3c4656] bg-[#fbe3a1] px-6 py-2.5 font-bold text-[#3c4656] shadow-[4px_4px_0_rgba(60,70,86,0.28)] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(60,70,86,0.28)]'

function shuffled<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
}

function createTrial(level: FieldLevel): Trial {
  const pairs = SNACK_PAIRS[level]
  const pair = pairs[Math.floor(Math.random() * pairs.length)]
  const targetSlot = Math.floor(Math.random() * SLOT_COUNT)
  const freeSlots = shuffled(Array.from({ length: SLOT_COUNT }, (_, i) => i).filter((i) => i !== targetSlot))
  return {
    spec: {
      snack: pair[Math.floor(Math.random() * 2)],
      targetSlot,
      distractors: shuffled(DISTRACTORS[level]).map((kind, i) => ({ slot: freeSlots[i], kind })),
      level,
    },
    options: Math.random() < 0.5 ? [pair[0], pair[1]] : [pair[1], pair[0]],
  }
}

export function SchoolRunGame() {
  const t = useTranslations('games.schoolRunDoubleDecision.gameUI')
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<SchoolRunScene | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // When the first flash of the current run started, for the run length sent to the leaderboard.
  const runStartRef = useRef(0)

  const [sceneSize, setSceneSize] = useState<SceneSize>(LANDSCAPE)
  const [phase, setPhase] = useState<Phase>('intro')
  const [countdown, setCountdown] = useState(3)
  const [trialIndex, setTrialIndex] = useState(0)
  const [trial, setTrial] = useState<Trial>(() => createTrial(1))
  const [fastestShownMs, setFastestShownMs] = useState<number | null>(null)
  const [lastShownMs, setLastShownMs] = useState(0)
  const [outcome, setOutcome] = useState<TrialOutcome | null>(null)
  const [bestRounds, setBestRounds] = useState<number | null>(null)
  const [newBest, setNewBest] = useState(false)

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // The scene lives for the whole visit, so the street keeps moving behind every screen.
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const scene = new SchoolRunScene(canvas, t('signLabel'))
    sceneRef.current = scene
    scene.onResize = setSceneSize
    scene.onInterrupt = () => {
      clearPendingTimeout()
      setPhase('paused')
    }
    scene.resize(container.clientWidth)
    const observer = new ResizeObserver(([entry]) => scene.resize(entry.contentRect.width))
    observer.observe(container)

    const saved = window.localStorage.getItem(BEST_ROUNDS_KEY)
    if (saved) setBestRounds(Number(saved))

    return () => {
      observer.disconnect()
      scene.destroy()
      sceneRef.current = null
      clearPendingTimeout()
    }
  }, [clearPendingTimeout, t])

  const beginTrial = useCallback((round: number) => {
    const { level, displayMs } = schoolRunRound(round)
    const next = createTrial(level)
    setTrial(next)
    setTrialIndex(round)
    setOutcome(null)
    setPhase('stimulus')
    sceneRef.current?.runStimulus(next.spec, displayMs, SCHOOL_RUN_MASK_MS, (shownMs) => {
      setLastShownMs(shownMs)
      setPhase('snack-answer')
    })
  }, [])

  const startGame = useCallback(() => {
    clearPendingTimeout()
    setFastestShownMs(null)
    setNewBest(false)
    setTrialIndex(0)
    sceneRef.current?.setLevel(1)
    sceneRef.current?.showIdle()
    setCountdown(3)
    setPhase('countdown')
  }, [clearPendingTimeout])

  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown === 0) {
      runStartRef.current = performance.now()
      beginTrial(0)
      return
    }
    const id = setTimeout(() => setCountdown((value) => value - 1), 700)
    return () => clearTimeout(id)
  }, [beginTrial, countdown, phase])

  // A clean round moves on to a faster one; any mistake ends the run after showing the answer.
  const finishTrial = useCallback(
    (snackCorrect: boolean, locationCorrect: boolean | null, selectedSlot: number | null) => {
      const cleared = snackCorrect && locationCorrect === true
      setOutcome({ snackCorrect, locationCorrect })
      setPhase('feedback')
      const scene = sceneRef.current
      scene?.showFeedback(trial.spec, selectedSlot)

      if (cleared) {
        setFastestShownMs((current) => (current === null ? lastShownMs : Math.min(current, lastShownMs)))
        // A wider ring brings a busier street; reshuffle it now rather than at the next flash.
        scene?.setLevel(schoolRunRound(trialIndex + 1).level)
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null
          beginTrial(trialIndex + 1)
        }, SCHOOL_RUN_FEEDBACK_MS)
        return
      }

      const rounds = trialIndex
      if (rounds > 0 && fastestShownMs !== null) {
        void submitScoreToLeaderboard('school-run-double-decision', rounds, {
          details: {
            fastestDisplayMs: fastestShownMs,
            durationMs: Math.round(performance.now() - runStartRef.current),
            rulesVersion: SCHOOL_RUN_RULES_VERSION,
          },
        })
      }
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null
        setNewBest(rounds > 0 && rounds > (bestRounds ?? 0))
        setBestRounds((current) => {
          const best = Math.max(current ?? 0, rounds)
          window.localStorage.setItem(BEST_ROUNDS_KEY, String(best))
          return best
        })
        scene?.showIdle()
        setPhase('results')
      }, GAME_OVER_MS)
    },
    [beginTrial, bestRounds, fastestShownMs, lastShownMs, trial.spec, trialIndex],
  )

  const chooseSnack = useCallback(
    (snack: SnackKind) => {
      if (phase !== 'snack-answer') return
      if (snack === trial.spec.snack) setPhase('location-answer')
      else finishTrial(false, null, null)
    },
    [finishTrial, phase, trial.spec.snack],
  )

  const chooseLocation = useCallback(
    (slot: number) => {
      if (phase !== 'location-answer') return
      finishTrial(true, slot === trial.spec.targetSlot, slot)
    },
    [finishTrial, phase, trial.spec.targetSlot],
  )

  const { level, displayMs } = schoolRunRound(trialIndex)
  const levelUp = phase === 'feedback' && outcome?.snackCorrect && outcome.locationCorrect && schoolRunRound(trialIndex + 1).level > level
  const showHud = phase !== 'intro' && phase !== 'results'

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-3xl border-2 border-[#3c4656] bg-[#fbf8ef] shadow-[6px_6px_0_rgba(60,70,86,0.28)]"
      >
        <canvas ref={canvasRef} className="block w-full" role="img" aria-label={t('sceneLabel')} />

        {showHud && (
          <div className={cn(PANEL, 'absolute left-3 top-3 flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs shadow-[3px_3px_0_rgba(60,70,86,0.28)]')}>
            <span>{t('hudRound', { round: trialIndex + 1 })}</span>
            <span className="h-3 w-px bg-[#3c4656]/30" />
            <span>{t('levelValue', { level })}</span>
            <span className="h-3 w-px bg-[#3c4656]/30" />
            <span>{(displayMs / 1000).toFixed(2)} s</span>
          </div>
        )}

        {phase === 'intro' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#3c4656]/20 p-4">
            <div className={cn(PANEL, 'max-w-md p-6 text-center')}>
              <h2 className="text-2xl font-extrabold tracking-tight">{t('title')}</h2>
              <p className="mt-3 text-sm leading-6">{t('intro')}</p>
              <p className="mt-2 text-sm font-semibold">{t('fixationTip')}</p>
              <button type="button" className={cn(BUTTON, 'mt-5')} onClick={startGame}>
                <Play className="h-4 w-4" />
                {t('start')}
              </button>
              {bestRounds !== null && <p className="mt-3 text-xs">{t('bestRounds', { count: bestRounds })}</p>}
            </div>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className={cn(PANEL, 'flex h-24 w-24 items-center justify-center rounded-full text-5xl font-extrabold')}>
              {countdown || ''}
            </div>
          </div>
        )}

        {phase === 'snack-answer' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#3c4656]/25 p-4">
            <div className={cn(PANEL, 'p-5 text-center')}>
              <p className="font-bold">{t('chooseSnack')}</p>
              <div className="mt-4 flex justify-center gap-4">
                {trial.options.map((snack) => (
                  <button
                    key={snack}
                    type="button"
                    onClick={() => chooseSnack(snack)}
                    aria-label={t(`snacks.${snack}`)}
                    className="flex flex-col items-center rounded-2xl border-2 border-[#3c4656] bg-[#fbf8ef] p-3 shadow-[4px_4px_0_rgba(60,70,86,0.28)] transition-transform hover:-translate-y-0.5 hover:bg-[#fbe3a1] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(60,70,86,0.28)]"
                  >
                    <SnackIcon kind={snack} size={72} />
                    <span className="mt-1 text-xs font-semibold">{t(`snacks.${snack}`)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === 'location-answer' && (
          <>
            <div className={cn(PANEL, 'pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full px-4 py-1.5 text-sm font-bold shadow-[3px_3px_0_rgba(60,70,86,0.28)]')}>
              {t('chooseLocation')}
            </div>
            {Array.from({ length: SLOT_COUNT }, (_, slot) => {
              const pos = slotPosition(slot, trial.spec.level, sceneSize)
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => chooseLocation(slot)}
                  aria-label={t('locationLabel', { number: slot + 1 })}
                  className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#3c4656] bg-white font-bold text-[#3c4656] shadow-[3px_3px_0_rgba(60,70,86,0.28)] transition-colors hover:bg-[#fbe3a1]"
                  style={{ left: `${(pos.x / sceneSize.width) * 100}%`, top: `${(pos.y / sceneSize.height) * 100}%` }}
                >
                  {slot + 1}
                </button>
              )
            })}
          </>
        )}

        {phase === 'feedback' && outcome && (
          <div
            className={cn(
              PANEL,
              'pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full px-4 py-1.5 text-sm font-bold shadow-[3px_3px_0_rgba(60,70,86,0.28)]',
              outcome.snackCorrect && outcome.locationCorrect ? 'bg-[#dcf1e2]' : 'bg-[#fbdcd6]',
            )}
          >
            {outcome.snackCorrect && outcome.locationCorrect
              ? levelUp
                ? t('levelUp')
                : t('correct')
              : !outcome.snackCorrect
                ? t('snackMissed')
                : t('planeMissed')}
          </div>
        )}

        {phase === 'paused' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#3c4656]/25 p-4">
            <div className={cn(PANEL, 'max-w-sm p-6 text-center')}>
              <p className="text-sm leading-6">{t('paused')}</p>
              <button type="button" className={cn(BUTTON, 'mt-4')} onClick={() => beginTrial(trialIndex)}>
                <Play className="h-4 w-4" />
                {t('resume')}
              </button>
            </div>
          </div>
        )}

        {phase === 'results' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#3c4656]/20 p-4">
            <div className={cn(PANEL, 'w-full max-w-md p-6 text-center')}>
              <h2 className="text-xl font-extrabold">{t('resultsTitle')}</h2>
              <div className="mt-2 font-mono text-6xl font-extrabold">{trialIndex}</div>
              <p className="mt-1 text-sm font-semibold">{t('roundsUnit')}</p>
              {trialIndex > 0 && <p className="mt-1 text-xs text-[#3c4656]/70">{t('leaderboardRecorded')}</p>}
              {newBest && (
                <p className="mt-3 inline-block rounded-full border-2 border-[#3c4656] bg-[#f7c6d4] px-3 py-0.5 text-sm font-bold">
                  {t('newBest')}
                </p>
              )}
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  { value: String(bestRounds ?? trialIndex), label: t('resultBest'), fill: 'bg-[#fbe3a1]' },
                  { value: t('levelValue', { level }), label: t('resultLevel'), fill: 'bg-[#cfc3ec]' },
                  // The shortest flash the player still got right, in seconds.
                  {
                    value: fastestShownMs === null ? '-' : t('resultFastestValue', { seconds: (fastestShownMs / 1000).toFixed(2) }),
                    label: t('resultFastest'),
                    fill: 'bg-[#a8dcc8]',
                  },
                ].map((item) => (
                  <div key={item.label} className={cn('rounded-xl border-2 border-[#3c4656] px-2 py-3', item.fill)}>
                    <div className="font-mono text-base font-bold">{item.value}</div>
                    <div className="mt-1 text-[11px] font-semibold">{item.label}</div>
                  </div>
                ))}
              </div>
              {fastestShownMs !== null && (
                <p className="mt-3 text-xs text-[#3c4656]/70">
                  {t('resultFastestHint', { seconds: (fastestShownMs / 1000).toFixed(2) })}
                </p>
              )}
              <button type="button" className={cn(BUTTON, 'mt-6')} onClick={startGame}>
                <RotateCcw className="h-4 w-4" />
                {t('playAgain')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
