'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BusFront,
  CarFront,
  CarTaxiFront,
  Check,
  Gauge,
  LocateFixed,
  Play,
  RotateCcw,
  Settings2,
  Trophy,
  Truck,
  X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { submitScoreToLeaderboard } from '@/lib/leaderboard'
import {
  DOUBLE_DECISION_MAX_DISPLAY_MS,
  DOUBLE_DECISION_MIN_DISPLAY_MS,
  DOUBLE_DECISION_RULES_VERSION,
  calculateDoubleDecisionScore,
  calculateDoubleDecisionTrialPoints,
  isDoubleDecisionLeaderboardEligible,
} from '@/lib/double-decision-score'

type Vehicle = 'sedan' | 'taxi' | 'bus' | 'truck'
type Phase =
  | 'intro'
  | 'countdown'
  | 'stimulus'
  | 'mask'
  | 'vehicle-answer'
  | 'location-answer'
  | 'feedback'
  | 'results'

interface Trial {
  vehicle: Vehicle
  vehicleOptions: readonly [Vehicle, Vehicle]
  targetPosition: number
  distractorPositions: number[]
  fieldLevel: number
}

interface TrialOutcome {
  vehicleCorrect: boolean
  locationCorrect: boolean | null
  selectedPosition: number | null
}

interface GameSettings {
  totalTrials: number
  startingDisplayMs: number
  startingFieldLevel: number
}

const INITIAL_DISPLAY_MS = 1200
const MASK_DURATION_MS = 120
const BEST_ACCURACY_KEY = 'doubleDecisionBestAccuracy'
const BEST_RATING_KEY = 'doubleDecisionBestRating'
const DEFAULT_SETTINGS: GameSettings = {
  totalTrials: 20,
  startingDisplayMs: INITIAL_DISPLAY_MS,
  startingFieldLevel: 1,
}
const TRIAL_OPTIONS = [10, 20, 30]
const SPEED_OPTIONS = [800, 1200, 1600]
const FIELD_OPTIONS = [1, 2, 3]

const DISTRACTOR_SIGNS = ['P', '50', '→', '!', 'STOP', 'H', '↗']

const FIELD_CONFIG: Record<number, { radiusX: number; radiusY: number; distractors: number }> = {
  1: { radiusX: 31, radiusY: 28, distractors: 0 },
  2: { radiusX: 39, radiusY: 36, distractors: 3 },
  3: { radiusX: 43, radiusY: 41, distractors: 7 },
}

const VEHICLE_ICONS = {
  sedan: CarFront,
  taxi: CarTaxiFront,
  bus: BusFront,
  truck: Truck,
}

const VEHICLE_PAIRS: Record<number, readonly (readonly [Vehicle, Vehicle])[]> = {
  1: [
    ['sedan', 'truck'],
    ['taxi', 'bus'],
  ],
  2: [
    ['sedan', 'bus'],
    ['taxi', 'truck'],
  ],
  3: [
    ['sedan', 'taxi'],
    ['bus', 'truck'],
  ],
}

function shuffled<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
}

function createTrial(fieldLevel: number): Trial {
  const targetPosition = Math.floor(Math.random() * 8)
  const pairs = VEHICLE_PAIRS[fieldLevel]
  const vehicleOptions = pairs[Math.floor(Math.random() * pairs.length)]
  const availableDistractors = shuffled(
    Array.from({ length: 8 }, (_, index) => index).filter(
      (index) => index !== targetPosition,
    ),
  )

  return {
    vehicle: vehicleOptions[Math.floor(Math.random() * vehicleOptions.length)],
    vehicleOptions,
    targetPosition,
    distractorPositions: availableDistractors.slice(
      0,
      FIELD_CONFIG[fieldLevel].distractors,
    ),
    fieldLevel,
  }
}

function positionStyle(index: number, fieldLevel: number) {
  const angle = (index * Math.PI) / 4 - Math.PI / 2
  const { radiusX, radiusY } = FIELD_CONFIG[fieldLevel]

  return {
    left: `${50 + Math.cos(angle) * radiusX}%`,
    top: `${50 + Math.sin(angle) * radiusY}%`,
  }
}

function RouteTarget({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[42%_42%_48%_48%] border-2 border-slate-900 bg-white font-black leading-none text-slate-900 shadow-lg',
        compact ? 'h-9 w-9 text-[9px]' : 'h-12 w-12 text-[10px]',
      )}
    >
      <span className="text-[7px] tracking-tight">ROUTE</span>
      <span className={compact ? 'text-sm' : 'text-lg'}>66</span>
    </div>
  )
}

function DistractorSign({ index }: { index: number }) {
  const label = DISTRACTOR_SIGNS[index % DISTRACTOR_SIGNS.length]

  return (
    <div
      className={cn(
        'flex h-10 w-10 items-center justify-center border-2 bg-white text-[10px] font-black text-slate-800 shadow-md',
        index % 3 === 0 && 'rounded-full border-red-500',
        index % 3 === 1 && 'rounded-md border-blue-600',
        index % 3 === 2 && 'rotate-45 rounded-md border-amber-500',
      )}
    >
      <span className={cn(index % 3 === 2 && '-rotate-45')}>{label}</span>
    </div>
  )
}

function CityRoadBackground({ fieldLevel }: { fieldLevel: number }) {
  return (
    <>
      <div className="absolute inset-0 bg-[#dce8df] dark:bg-slate-900" />
      <div className="absolute -right-10 inset-y-0 w-24 bg-sky-300/70 dark:bg-cyan-950/80" />
      <svg
        viewBox="0 0 760 440"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          d="M-20 330 C115 255 230 345 345 245 S560 155 790 225"
          fill="none"
          stroke="white"
          strokeWidth="44"
          strokeLinecap="round"
        />
        <path
          d="M-20 330 C115 255 230 345 345 245 S560 155 790 225"
          fill="none"
          stroke="#94a3a3"
          strokeWidth="3"
          strokeDasharray="13 13"
        />
        <path
          d="M120 -20 C145 110 265 135 360 185 S505 315 548 460"
          fill="none"
          stroke="white"
          strokeWidth="38"
          strokeLinecap="round"
        />
        <path
          d="M120 -20 C145 110 265 135 360 185 S505 315 548 460"
          fill="none"
          stroke="#94a3a3"
          strokeWidth="3"
          strokeDasharray="13 13"
        />
        {fieldLevel >= 2 && (
          <>
            <path
              d="M-10 102 C190 65 340 105 610 22"
              fill="none"
              stroke="white"
              strokeWidth="30"
            />
            <path
              d="M-10 102 C190 65 340 105 610 22"
              fill="none"
              stroke="#94a3a3"
              strokeWidth="3"
              strokeDasharray="11 11"
            />
          </>
        )}
      </svg>
      {fieldLevel >= 3 && (
        <div className="absolute inset-0 opacity-40 [background-image:repeating-linear-gradient(90deg,transparent_0_68px,rgba(71,85,105,.22)_69px_70px),repeating-linear-gradient(0deg,transparent_0_58px,rgba(71,85,105,.16)_59px_60px)]" />
      )}
    </>
  )
}

function StimulusScene({ trial }: { trial: Trial }) {
  const VehicleIcon = VEHICLE_ICONS[trial.vehicle]

  return (
    <div className="relative min-h-[460px] overflow-hidden sm:min-h-[520px]">
      <CityRoadBackground fieldLevel={trial.fieldLevel} />

      <div className="absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-slate-800 text-white shadow-xl ring-4 ring-sky-400/30">
        <VehicleIcon className="h-12 w-12" strokeWidth={1.8} />
      </div>

      {Array.from({ length: 8 }, (_, index) => {
        const isTarget = index === trial.targetPosition
        const isDistractor = trial.distractorPositions.includes(index)

        if (!isTarget && !isDistractor) return null

        return (
          <div
            key={index}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
            style={positionStyle(index, trial.fieldLevel)}
          >
            {isTarget ? (
              <div
                className={cn(
                  'rounded-full bg-amber-300/70 shadow-[0_0_22px_8px_rgba(251,191,36,.65)]',
                  trial.fieldLevel >= 3 ? 'p-1' : 'p-2',
                )}
              >
                <RouteTarget compact={trial.fieldLevel >= 3} />
              </div>
            ) : (
              <DistractorSign index={index} />
            )}
          </div>
        )
      })}

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white" />
    </div>
  )
}

function VisualMask() {
  return (
    <div className="relative min-h-[460px] overflow-hidden bg-[#e4e8e3] sm:min-h-[520px]">
      <div className="absolute inset-0 opacity-55 [background-image:radial-gradient(circle_at_center,rgba(71,85,105,.55)_1px,transparent_1.5px)] [background-size:7px_7px]" />
      <div className="absolute inset-0 bg-white/20" />
    </div>
  )
}

function LocationResponse({
  trial,
  onSelect,
}: {
  trial: Trial
  onSelect: (position: number) => void
}) {
  const t = useTranslations('games.doubleDecision.gameUI')

  return (
    <div className="relative min-h-[460px] overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 sm:min-h-[520px]">
      <CityRoadBackground fieldLevel={trial.fieldLevel} />
      <div className="absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-slate-800 text-white shadow-xl">
        <LocateFixed className="h-9 w-9" />
      </div>

      {Array.from({ length: 8 }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={t('locationLabel', { number: index + 1 })}
          className="absolute z-30 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-slate-900/70 text-sm font-bold text-white shadow-lg transition duration-150 hover:scale-110 hover:border-amber-300 hover:bg-amber-400 hover:text-slate-900 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
          style={positionStyle(index, trial.fieldLevel)}
        >
          <span className="motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:duration-200">
            {index + 1}
          </span>
        </button>
      ))}
      <div className="absolute bottom-5 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950/75 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
        {t('chooseLocation')}
      </div>
    </div>
  )
}

function SettingsDialog({
  settings,
  onChange,
}: {
  settings: GameSettings
  onChange: (settings: GameSettings) => void
}) {
  const t = useTranslations('games.doubleDecision.gameUI')

  const update = <Key extends keyof GameSettings>(
    key: Key,
    value: GameSettings[Key],
  ) => onChange({ ...settings, [key]: value })

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t('settings')}
          className="group flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-md transition hover:bg-background active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Settings2 className="h-4 w-4 transition-transform duration-200 group-hover:rotate-45 motion-reduce:transition-none" />
        </button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] border-0 p-5 shadow-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('settingsTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <div className="text-sm font-medium">{t('settingsRounds')}</div>
            <div className="grid grid-cols-3 gap-2">
              {TRIAL_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update('totalTrials', value)}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm transition active:scale-95',
                    settings.totalTrials === value
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-sm font-medium">{t('settingsSpeed')}</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t('settingsSpeedHelp')}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SPEED_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update('startingDisplayMs', value)}
                  className={cn(
                    'rounded-lg px-2 py-2 text-sm transition active:scale-95',
                    settings.startingDisplayMs === value
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {value} ms
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-sm font-medium">{t('settingsField')}</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t('settingsFieldHelp')}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {FIELD_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update('startingFieldLevel', value)}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm transition active:scale-95',
                    settings.startingFieldLevel === value
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t('levelValue', { level: value })}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t('settingsHint')}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PeripheralSpeedGame() {
  const t = useTranslations('games.doubleDecision.gameUI')
  const [phase, setPhase] = useState<Phase>('intro')
  const [trialIndex, setTrialIndex] = useState(0)
  const [trial, setTrial] = useState<Trial>(() => createTrial(1))
  const [displayMs, setDisplayMs] = useState(INITIAL_DISPLAY_MS)
  const [fieldLevel, setFieldLevel] = useState(1)
  const [successStreak, setSuccessStreak] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [pointsTotal, setPointsTotal] = useState(0)
  const [maxFieldReached, setMaxFieldReached] = useState(1)
  const [fastestCorrectDisplayMs, setFastestCorrectDisplayMs] = useState(INITIAL_DISPLAY_MS)
  const [outcome, setOutcome] = useState<TrialOutcome | null>(null)
  const [bestAccuracy, setBestAccuracy] = useState<number | null>(null)
  const [bestRating, setBestRating] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(3)
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)
  const [activeSettings, setActiveSettings] = useState<GameSettings>(DEFAULT_SETTINGS)
  const [totalTrials, setTotalTrials] = useState(DEFAULT_SETTINGS.totalTrials)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    const savedAccuracy = window.localStorage.getItem(BEST_ACCURACY_KEY)
    const savedRating = window.localStorage.getItem(BEST_RATING_KEY)
    if (savedAccuracy) setBestAccuracy(Number(savedAccuracy))
    if (savedRating) setBestRating(Number(savedRating))
    return clearPendingTimeout
  }, [clearPendingTimeout])

  const startStimulus = useCallback(
    (nextIndex: number, nextFieldLevel: number) => {
      setTrial(createTrial(nextFieldLevel))
      setTrialIndex(nextIndex)
      setOutcome(null)
      setPhase('stimulus')
    },
    [],
  )

  useEffect(() => {
    if (phase !== 'stimulus') return

    timeoutRef.current = setTimeout(() => {
      setPhase('mask')
      timeoutRef.current = null
    }, displayMs)

    return clearPendingTimeout
  }, [clearPendingTimeout, displayMs, phase])

  useEffect(() => {
    if (phase !== 'mask') return

    timeoutRef.current = setTimeout(() => {
      setPhase('vehicle-answer')
      timeoutRef.current = null
    }, MASK_DURATION_MS)

    return clearPendingTimeout
  }, [clearPendingTimeout, phase])

  const startGame = useCallback(() => {
    clearPendingTimeout()
    setDisplayMs(settings.startingDisplayMs)
    setFieldLevel(settings.startingFieldLevel)
    setTotalTrials(settings.totalTrials)
    setActiveSettings(settings)
    setSuccessStreak(0)
    setCorrectCount(0)
    setPointsTotal(0)
    setMaxFieldReached(settings.startingFieldLevel)
    setFastestCorrectDisplayMs(settings.startingDisplayMs)
    setTrialIndex(0)
    setCountdown(3)
    setPhase('countdown')
  }, [clearPendingTimeout, settings])

  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown === 0) {
      startStimulus(0, fieldLevel)
      return
    }

    const id = setTimeout(() => setCountdown((value) => value - 1), 700)
    return () => clearTimeout(id)
  }, [countdown, fieldLevel, phase, startStimulus])

  const finishTrial = useCallback(
    (
      vehicleCorrect: boolean,
      locationCorrect: boolean | null,
      selectedPosition: number | null,
    ) => {
      const fullyCorrect = vehicleCorrect && locationCorrect === true
      const nextCorrectCount = correctCount + (fullyCorrect ? 1 : 0)
      const nextStreak = fullyCorrect ? successStreak + 1 : 0
      const shouldExpandField = nextStreak >= 3 && fieldLevel < 3
      const nextFieldLevel = shouldExpandField ? fieldLevel + 1 : fieldLevel
      const trialPoints = calculateDoubleDecisionTrialPoints({
        correct: fullyCorrect,
        displayMs,
        fieldLevel: trial.fieldLevel,
      })
      const nextPointsTotal = pointsTotal + trialPoints
      const nextMaxFieldReached = Math.max(maxFieldReached, trial.fieldLevel)
      const nextFastestCorrectDisplayMs = fullyCorrect
        ? Math.min(fastestCorrectDisplayMs, displayMs)
        : fastestCorrectDisplayMs
      const nextDisplayMs = fullyCorrect
        ? Math.max(
            DOUBLE_DECISION_MIN_DISPLAY_MS,
            displayMs - (displayMs > 500 ? 120 : 40),
          )
        : Math.min(DOUBLE_DECISION_MAX_DISPLAY_MS, displayMs + 220)

      setOutcome({ vehicleCorrect, locationCorrect, selectedPosition })
      setCorrectCount(nextCorrectCount)
      setPointsTotal(nextPointsTotal)
      setMaxFieldReached(nextMaxFieldReached)
      setFastestCorrectDisplayMs(nextFastestCorrectDisplayMs)
      setSuccessStreak(shouldExpandField ? 0 : nextStreak)
      setFieldLevel(nextFieldLevel)
      setDisplayMs(
        shouldExpandField
          ? Math.min(DOUBLE_DECISION_MAX_DISPLAY_MS, nextDisplayMs + 180)
          : nextDisplayMs,
      )
      setPhase('feedback')

      timeoutRef.current = setTimeout(() => {
        if (trialIndex + 1 >= totalTrials) {
          const accuracy = Math.round((nextCorrectCount / totalTrials) * 100)
          const rating = calculateDoubleDecisionScore(nextPointsTotal, totalTrials)

          setBestAccuracy((currentBest) => {
            const nextBest = Math.max(currentBest ?? 0, accuracy)
            window.localStorage.setItem(BEST_ACCURACY_KEY, String(nextBest))
            return nextBest
          })
          setBestRating((currentBest) => {
            const nextBest = Math.max(currentBest ?? 0, rating)
            window.localStorage.setItem(BEST_RATING_KEY, String(nextBest))
            return nextBest
          })

          if (isDoubleDecisionLeaderboardEligible({ accuracy, totalTrials })) {
            void submitScoreToLeaderboard('double-decision', rating, {
              details: {
                accuracy,
                correctCount: nextCorrectCount,
                fastestDisplayMs: nextFastestCorrectDisplayMs,
                maxFieldLevel: nextMaxFieldReached,
                pointsTotal: nextPointsTotal,
                rulesVersion: DOUBLE_DECISION_RULES_VERSION,
                startingDisplayMs: activeSettings.startingDisplayMs,
                startingFieldLevel: activeSettings.startingFieldLevel,
                totalTrials,
              },
            })
          }
          setPhase('results')
        } else {
          startStimulus(trialIndex + 1, nextFieldLevel)
        }
        timeoutRef.current = null
      }, 1100)
    },
    [
      correctCount,
      displayMs,
      fastestCorrectDisplayMs,
      fieldLevel,
      activeSettings,
      maxFieldReached,
      pointsTotal,
      startStimulus,
      successStreak,
      totalTrials,
      trial.fieldLevel,
      trialIndex,
    ],
  )

  const chooseVehicle = useCallback(
    (vehicle: Vehicle) => {
      if (phase !== 'vehicle-answer') return
      if (vehicle === trial.vehicle) {
        setPhase('location-answer')
      } else {
        finishTrial(false, null, null)
      }
    },
    [finishTrial, phase, trial.vehicle],
  )

  const chooseLocation = useCallback(
    (position: number) => {
      if (phase !== 'location-answer') return
      finishTrial(true, position === trial.targetPosition, position)
    },
    [finishTrial, phase, trial.targetPosition],
  )

  const completedRounds = trialIndex + (phase === 'results' ? 1 : 0)
  const currentAccuracy = Math.round(
    (correctCount / Math.max(1, completedRounds)) * 100,
  )
  const decisionRating = calculateDoubleDecisionScore(pointsTotal, totalTrials)
  const leaderboardEligible = isDoubleDecisionLeaderboardEligible({
    accuracy: currentAccuracy,
    totalTrials,
  })
  const feedbackCorrect =
    outcome?.vehicleCorrect === true && outcome.locationCorrect === true
  const visibleRound =
    phase === 'intro'
      ? 0
      : phase === 'results'
        ? totalTrials
        : Math.min(trialIndex + 1, totalTrials)

  return (
    <div className="relative mx-auto w-full max-w-4xl overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-4 z-50 flex items-center justify-between px-4 sm:px-5">
        <div
          className="pointer-events-auto flex h-9 items-center gap-2 rounded-full bg-background/80 px-3 font-mono text-xs text-foreground shadow-sm backdrop-blur-md"
          aria-label={`${t('round', { current: visibleRound, total: totalTrials })}, ${t('score', { score: currentAccuracy })}`}
        >
          <span
            key={`round-${visibleRound}`}
            className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
          >
            {visibleRound}/{totalTrials}
          </span>
          <span className="h-3 w-px bg-foreground/15" />
          <span
            key={`accuracy-${currentAccuracy}`}
            className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
          >
            {currentAccuracy}%
          </span>
        </div>
        <div className="pointer-events-auto">
          <SettingsDialog settings={settings} onChange={setSettings} />
        </div>
      </div>

      {phase === 'intro' && (
        <div className="flex min-h-[460px] flex-col items-center justify-center bg-background px-6 pb-12 pt-20 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 sm:min-h-[520px]">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:duration-500 dark:bg-white dark:text-slate-900">
            <Gauge className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 sm:text-base">
            {t('intro')}
          </p>
          <p className="mt-7 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            {t('fixationTip')}
          </p>
          <Button
            className="group mt-8 h-11 rounded-full px-7 transition-transform active:scale-95"
            onClick={startGame}
          >
            <Play className="mr-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
            {t('start')}
          </Button>
          {(bestRating !== null || bestAccuracy !== null) && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {bestRating !== null && (
                <span>{t('bestRating', { score: bestRating })}</span>
              )}
              {bestAccuracy !== null && (
                <span>{t('bestScore', { score: bestAccuracy })}</span>
              )}
            </div>
          )}
        </div>
      )}

      {phase === 'countdown' && (
        <div className="flex min-h-[460px] items-center justify-center bg-[#edf1ec] dark:bg-slate-950 sm:min-h-[520px]">
          <span
            key={countdown}
            className="font-mono text-7xl font-medium text-slate-900 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-50 motion-safe:duration-300 dark:text-white"
          >
            {countdown || 'GO'}
          </span>
        </div>
      )}

      {phase === 'stimulus' && <StimulusScene trial={trial} />}
      {phase === 'mask' && <VisualMask />}

      {phase === 'vehicle-answer' && (
        <div className="flex min-h-[460px] flex-col items-center justify-center gap-7 bg-[#eef2ed] p-6 pt-16 text-slate-900 sm:min-h-[520px]">
          <h3 className="text-xl font-medium motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-150">
            {t('chooseVehicle')}
          </h3>
          <div className="grid w-full max-w-lg grid-cols-2 gap-4">
            {trial.vehicleOptions.map((id) => {
              const Icon = VEHICLE_ICONS[id]

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => chooseVehicle(id)}
                  className="group flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl bg-white/80 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition duration-150 hover:-translate-y-1 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
                >
                  <Icon
                    className="h-16 w-16 transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none"
                    strokeWidth={1.5}
                  />
                  <span className="font-semibold">{t(`vehicles.${id}`)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'location-answer' && (
        <LocationResponse trial={trial} onSelect={chooseLocation} />
      )}

      {phase === 'feedback' && outcome && (
        <div
          className={cn(
            'flex min-h-[460px] flex-col items-center justify-center gap-5 p-8 pt-16 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 sm:min-h-[520px]',
            feedbackCorrect
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
              : 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
          )}
        >
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-300',
              feedbackCorrect ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-900',
            )}
          >
            {feedbackCorrect ? <Check className="h-9 w-9" /> : <X className="h-9 w-9" />}
          </div>
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
            <h3 className="text-2xl font-semibold">
              {feedbackCorrect
                ? t('correct')
                : !outcome.vehicleCorrect
                  ? t('vehicleMissed')
                  : t('signMissed')}
            </h3>
            {!feedbackCorrect && (
              <p className="mt-2 text-sm opacity-80">
                {t('answerReveal', {
                  vehicle: t(`vehicles.${trial.vehicle}`),
                  location: trial.targetPosition + 1,
                })}
              </p>
            )}
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="flex min-h-[460px] flex-col items-center justify-center bg-background px-6 pb-12 pt-20 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 sm:min-h-[520px]">
          <div className="font-mono text-6xl font-medium tracking-tight motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:duration-500">
            {decisionRating}
          </div>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {t('ratingUnit')}
          </p>
          <h2 className="mt-4 text-xl font-semibold">{t('resultsTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('resultsBody', { correct: correctCount, total: totalTrials })}
          </p>
          <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/60 px-3 py-3">
              <div className="font-mono text-lg font-semibold">{currentAccuracy}%</div>
              <div className="mt-1 text-xs text-muted-foreground">{t('resultAccuracy')}</div>
            </div>
            <div className="rounded-xl bg-muted/60 px-3 py-3">
              <div className="font-mono text-lg font-semibold">{maxFieldReached}</div>
              <div className="mt-1 text-xs text-muted-foreground">{t('resultField')}</div>
            </div>
            <div className="rounded-xl bg-muted/60 px-3 py-3">
              <div className="font-mono text-lg font-semibold">{fastestCorrectDisplayMs} ms</div>
              <div className="mt-1 text-xs text-muted-foreground">{t('resultFastest')}</div>
            </div>
          </div>
          <div className="mt-5 flex max-w-md items-start gap-2 text-left text-xs leading-5 text-muted-foreground">
            <Trophy className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {leaderboardEligible
                ? t('leaderboardRecorded')
                : totalTrials < 20
                  ? t('leaderboardNeedsRounds')
                  : t('leaderboardNeedsAccuracy')}
            </span>
          </div>
          <Button
            className="group mt-8 h-11 rounded-full px-7 transition-transform active:scale-95"
            onClick={startGame}
          >
            <RotateCcw className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:-rotate-45 motion-reduce:transition-none" />
            {t('playAgain')}
          </Button>
        </div>
      )}
    </div>
  )
}
