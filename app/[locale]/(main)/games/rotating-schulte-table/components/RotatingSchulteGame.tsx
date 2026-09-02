'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Clock, PlayCircle, RefreshCw, StopCircle, Trophy } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { ShareModal } from '@/components/ui/ShareModal'
import { submitScoreToLeaderboard } from '@/lib/leaderboard'
import { RANKED_LEADERBOARD_MODE } from '@/lib/leaderboard-config'
import { cn } from '@/lib/utils'

import styles from './RotatingSchulteGame.module.css'

const TOTAL_NUMBERS = 42
const MISTAKE_PENALTY_MS = 2000
const BEST_TIME_KEY = 'rotatingSchulteTableBestTime'

const RING_LAYOUT = [
  { innerRadius: 7, outerRadius: 19, count: 6 },
  { innerRadius: 20, outerRadius: 34, count: 12 },
  { innerRadius: 35, outerRadius: 48, count: 24 },
] as const

const RING_MOTION = [
  { duration: 20, direction: 1, delay: -4 },
  { duration: 26, direction: -1, delay: -12 },
  { duration: 33, direction: 1, delay: -21 },
] as const

type GameState = 'idle' | 'playing' | 'complete'

interface Sector {
  number: number
  ringIndex: number
  index: number
  step: number
  angle: number
  innerRadius: number
  outerRadius: number
  labelRadius: number
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled
}

function createBoard(): Sector[] {
  const numbers = shuffle(Array.from({ length: TOTAL_NUMBERS }, (_, index) => index + 1))
  let numberIndex = 0

  return RING_LAYOUT.flatMap((ring, ringIndex) => {
    const step = 360 / ring.count

    return Array.from({ length: ring.count }, (_, index) => {
      return {
        number: numbers[numberIndex++],
        ringIndex,
        index,
        step,
        angle: index * step,
        innerRadius: ring.innerRadius,
        outerRadius: ring.outerRadius,
        labelRadius: (ring.innerRadius + ring.outerRadius) / 2,
      }
    })
  })
}

function polar(radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180
  return {
    x: 50 + radius * Math.sin(radians),
    y: 50 - radius * Math.cos(radians),
  }
}

function sectorPath(innerRadius: number, outerRadius: number, step: number) {
  const gap = Math.min(1.4, step * 0.12)
  const start = -step / 2 + gap / 2
  const end = step / 2 - gap / 2
  const outerStart = polar(outerRadius, start)
  const outerEnd = polar(outerRadius, end)
  const innerEnd = polar(innerRadius, end)
  const innerStart = polar(innerRadius, start)

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

function sectorFill(sector: Sector, state: 'normal' | 'completed' | 'error') {
  if (state === 'completed') return '#22c55e'
  if (state === 'error') return '#ef4444'

  return (sector.ringIndex + sector.index) % 2 === 0
    ? '#f8fafc'
    : '#111827'
}

function sectorTextFill(sector: Sector, state: 'normal' | 'completed' | 'error') {
  if (state !== 'normal') return '#0f172a'

  return (sector.ringIndex + sector.index) % 2 === 0
    ? '#0f172a'
    : '#f8fafc'
}

export function RotatingSchulteGame() {
  const t = useTranslations('games.rotatingSchulteTable.gameUI')
  const [board, setBoard] = useState<Sector[]>([])
  const [gameState, setGameState] = useState<GameState>('idle')
  const [currentNumber, setCurrentNumber] = useState(1)
  const [mistakes, setMistakes] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [gameTime, setGameTime] = useState(0)
  const [bestTimeMs, setBestTimeMs] = useState(0)
  const [completedNumbers, setCompletedNumbers] = useState<Set<number>>(new Set())
  const [errorNumber, setErrorNumber] = useState<number | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const gameStateRef = useRef<GameState>('idle')
  const currentNumberRef = useRef(1)
  const mistakesRef = useRef(0)
  const startTimeRef = useRef(0)
  const finishingRef = useRef(false)
  const errorTimeoutRef = useRef<number | null>(null)

  const updateGameState = useCallback((nextState: GameState) => {
    gameStateRef.current = nextState
    setGameState(nextState)
  }, [])

  const updateCurrentNumber = useCallback((nextNumber: number) => {
    currentNumberRef.current = nextNumber
    setCurrentNumber(nextNumber)
  }, [])

  useEffect(() => {
    setBoard(createBoard())

    const savedBestTime = window.localStorage.getItem(BEST_TIME_KEY)
    if (savedBestTime) {
      const parsedTime = Number(savedBestTime)
      if (Number.isFinite(parsedTime) && parsedTime > 0) setBestTimeMs(parsedTime)
    }

    return () => {
      if (errorTimeoutRef.current !== null) window.clearTimeout(errorTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (gameState !== 'playing') return

    const timerId = window.setInterval(() => {
      setElapsed((performance.now() - startTimeRef.current) / 1000)
    }, 50)

    return () => window.clearInterval(timerId)
  }, [gameState])

  const startGame = useCallback(() => {
    if (errorTimeoutRef.current !== null) window.clearTimeout(errorTimeoutRef.current)

    setBoard(createBoard())
    setCompletedNumbers(new Set())
    updateCurrentNumber(1)
    mistakesRef.current = 0
    setMistakes(0)
    setElapsed(0)
    setGameTime(0)
    setErrorNumber(null)
    finishingRef.current = false
    startTimeRef.current = performance.now()
    updateGameState('playing')

    window.setTimeout(() => {
      boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 40)
  }, [updateCurrentNumber, updateGameState])

  const returnToStartScreen = useCallback(() => {
    if (errorTimeoutRef.current !== null) window.clearTimeout(errorTimeoutRef.current)

    setBoard(createBoard())
    setCompletedNumbers(new Set())
    updateCurrentNumber(1)
    mistakesRef.current = 0
    setMistakes(0)
    setElapsed(0)
    setGameTime(0)
    setErrorNumber(null)
    finishingRef.current = false
    updateGameState('idle')
  }, [updateCurrentNumber, updateGameState])

  const completeGame = useCallback(() => {
    if (gameStateRef.current !== 'playing' || finishingRef.current) return

    finishingRef.current = true
    const rawTimeMs = Math.max(0, Math.round(performance.now() - startTimeRef.current))
    const adjustedTimeMs = rawTimeMs + mistakesRef.current * MISTAKE_PENALTY_MS

    setElapsed(adjustedTimeMs / 1000)
    setGameTime(adjustedTimeMs / 1000)
    setBestTimeMs((previousBest) => {
      if (previousBest !== 0 && previousBest <= adjustedTimeMs) return previousBest

      window.localStorage.setItem(BEST_TIME_KEY, adjustedTimeMs.toString())
      return adjustedTimeMs
    })
    updateGameState('complete')
    confetti({ particleCount: 120, spread: 72, origin: { y: 0.62 } })

    void submitScoreToLeaderboard('rotating-schulte-table', adjustedTimeMs, {
      mode: RANKED_LEADERBOARD_MODE,
    }).catch(() => undefined)
  }, [updateGameState])

  const handleSectorClick = useCallback((number: number) => {
    if (gameStateRef.current !== 'playing') return

    const expectedNumber = currentNumberRef.current
    if (number < expectedNumber) return

    if (number === expectedNumber) {
      setCompletedNumbers((previous) => {
        const next = new Set(previous)
        next.add(number)
        return next
      })

      if (expectedNumber === TOTAL_NUMBERS) {
        completeGame()
      } else {
        updateCurrentNumber(expectedNumber + 1)
      }

      return
    }

    mistakesRef.current += 1
    setMistakes(mistakesRef.current)
    setErrorNumber(number)

    if (errorTimeoutRef.current !== null) window.clearTimeout(errorTimeoutRef.current)
    errorTimeoutRef.current = window.setTimeout(() => {
      setErrorNumber(null)
      errorTimeoutRef.current = null
    }, 320)
  }, [completeGame, updateCurrentNumber])

  const handleSectorKeyDown = useCallback((event: KeyboardEvent<SVGGElement>, number: number) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    handleSectorClick(number)
  }, [handleSectorClick])

  const bestTimeLabel = bestTimeMs > 0 ? `${(bestTimeMs / 1000).toFixed(1)}s` : '—'
  const currentLabel = gameState === 'complete' ? t('finished') : `${currentNumber} / ${TOTAL_NUMBERS}`

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5" ref={boardRef}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm">
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>{t('time')}: {elapsed.toFixed(1)}s</span>
          </span>
          <span>{t('mistakes')}: {mistakes}</span>
        </div>
        <span className="font-medium text-foreground" aria-live="polite">
          {t('findNumber')}: {currentLabel}
        </span>
      </div>

      <div className={cn(styles.boardShell, gameState === 'idle' && styles.boardShellIdle)}>
        <svg
          className={styles.boardSvg}
          viewBox="0 0 100 100"
          role="application"
          aria-label={t('boardLabel')}
          aria-hidden={gameState === 'idle'}
        >
          <circle cx="50" cy="50" r="49" fill="none" stroke="hsl(var(--foreground) / 0.16)" strokeWidth="0.7" />
          <circle cx="50" cy="50" r="6.4" fill="hsl(var(--muted))" stroke="hsl(var(--foreground) / 0.18)" strokeWidth="0.6" />

          {RING_LAYOUT.map((ring, ringIndex) => {
            const ringMotion = RING_MOTION[ringIndex]
            const ringSectors = board.filter((sector) => sector.ringIndex === ringIndex)
            const ringStyle = {
              '--spin-duration': `${ringMotion.duration}s`,
              '--spin-delay': `${ringMotion.delay}s`,
              '--spin-turn': `${ringMotion.direction * 360}deg`,
              '--label-turn': `${ringMotion.direction * -360}deg`,
            } as CSSProperties

            return (
              <g
                key={`ring-${ringIndex}`}
                className={cn(
                  styles.ringMotion,
                  gameState === 'playing' && styles.ringMotionActive,
                )}
                style={ringStyle}
              >
                {ringSectors.map((sector) => {
                  const state = completedNumbers.has(sector.number)
                    ? 'completed'
                    : errorNumber === sector.number
                      ? 'error'
                      : 'normal'
                  const labelPosition = polar(sector.labelRadius, 0)

                  return (
                    <g
                      key={`${sector.ringIndex}-${sector.index}`}
                      transform={`rotate(${sector.angle} 50 50)`}
                      className={cn(
                        styles.segment,
                        state === 'completed' && styles.completed,
                        state === 'error' && styles.error,
                      )}
                      role="button"
                      tabIndex={gameState === 'playing' && state !== 'completed' ? 0 : -1}
                      aria-label={`${t('number')} ${sector.number}`}
                      onClick={() => handleSectorClick(sector.number)}
                      onKeyDown={(event) => handleSectorKeyDown(event, sector.number)}
                    >
                      <path
                        className={styles.segmentPath}
                        d={sectorPath(sector.innerRadius, sector.outerRadius, sector.step)}
                        fill={sectorFill(sector, state)}
                      />
                      <g transform={`rotate(${-sector.angle} ${labelPosition.x} ${labelPosition.y})`}>
                        <text
                          className={styles.labelMotion}
                          x={labelPosition.x}
                          y={labelPosition.y}
                          fill={sectorTextFill(sector, state)}
                          fontSize={sector.ringIndex === 2 ? 3.15 : 4.25}
                          fontWeight="700"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          pointerEvents="none"
                        >
                          {sector.number}
                        </text>
                      </g>
                    </g>
                  )
                })}
              </g>
            )
          })}

          <circle className={styles.centerMark} cx="50" cy="50" r="4.4" strokeWidth="0.7" />
          <circle className={styles.centerDot} cx="50" cy="50" r="1.35" />
        </svg>

        {gameState === 'idle' && (
          <div className={cn('absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center', styles.idleMask)}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t('bestTime')}: {bestTimeLabel}
            </p>
            <Button size="lg" onClick={startGame} className="gap-2 rounded-full px-7">
              <PlayCircle className="h-5 w-5" aria-hidden="true" />
              {t('startGame')}
            </Button>
          </div>
        )}

        {gameState === 'complete' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/78 px-5 backdrop-blur-sm">
            <div className="w-full max-w-xs rounded-2xl border border-border bg-background/95 p-6 shadow-xl">
              <div className="flex items-center justify-center gap-2 text-center">
                <Trophy className="h-5 w-5 text-amber-500" aria-hidden="true" />
                <h2 className="text-xl font-bold">{t('gameComplete')}</h2>
              </div>
              <div className="mt-5 space-y-2 text-sm">
                <p className="flex justify-between gap-4"><span>{t('time')}</span><strong>{gameTime.toFixed(1)}s</strong></p>
                <p className="flex justify-between gap-4"><span>{t('bestTime')}</span><strong>{bestTimeLabel}</strong></p>
                <p className="flex justify-between gap-4"><span>{t('mistakes')}</span><strong>{mistakes}</strong></p>
              </div>
              <div className="mt-6 flex gap-2">
                <Button onClick={startGame} className="flex-1 rounded-full">{t('playAgain')}</Button>
                <Button variant="outline" onClick={() => setShowShareModal(true)} className="rounded-full">{t('share')}</Button>
              </div>
            </div>
          </div>
        )}

      </div>

      {gameState === 'playing' && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={returnToStartScreen} className="gap-2 rounded-full">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('restart')}
          </Button>
          <Button variant="outline" size="sm" onClick={returnToStartScreen} className="gap-2 rounded-full">
            <StopCircle className="h-4 w-4" aria-hidden="true" />
            {t('endGame')}
          </Button>
        </div>
      )}

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
    </div>
  )
}

export function RotatingSchultePreview() {
  const previewNumbers = [1, 12, 7, 29, 4, 36, 18, 24, 9, 33, 15, 41]

  return (
    <div className="flex h-full min-h-56 w-full items-center justify-center p-6">
      <div className={styles.previewDisc}>
        <div className={cn(styles.previewRing, styles.previewRingOne)} />
        <div className={cn(styles.previewRing, styles.previewRingTwo)} />
        {previewNumbers.map((number, index) => {
          const angle = (index / previewNumbers.length) * Math.PI * 2
          const radius = index % 2 === 0 ? 43 : 29

          return (
            <span
              key={number}
              className={styles.previewNumber}
              style={{
                left: `${(50 + Math.sin(angle) * radius).toFixed(2)}%`,
                top: `${(50 - Math.cos(angle) * radius).toFixed(2)}%`,
              }}
            >
              {number}
            </span>
          )
        })}
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background shadow-sm" />
      </div>
    </div>
  )
}
