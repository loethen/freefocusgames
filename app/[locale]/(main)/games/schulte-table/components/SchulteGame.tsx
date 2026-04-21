'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PlayCircle, Trophy, Loader2, Clock, StopCircle, RefreshCw } from 'lucide-react'
import { ShareModal } from '@/components/ui/ShareModal'
import { GAME_CONFIG } from '../config'
import { useTranslations } from 'next-intl'
import { useTimeout } from '@/hooks/useTimeout'
import { useInterval } from '@/hooks/useInterval'
import confetti from 'canvas-confetti'
import { submitScoreToLeaderboard } from '@/lib/leaderboard'
import { RANKED_LEADERBOARD_MODE } from '@/lib/leaderboard-config'

interface Cell {
  number: number
  isError: boolean
  isCorrect: boolean
}

type GameState = 'idle' | 'playing' | 'complete' | 'stopped'

const BEST_TIME_KEY = 'schulteGridBestTime'
const MISTAKE_PENALTY_MS = 2000

export function SchulteGame() {
  const t = useTranslations('games.schulteTable.gameUI')
  const [gameState, setGameState] = useState<GameState>('idle')
  const [grid, setGrid] = useState<Cell[]>([])
  const [currentNumber, setCurrentNumber] = useState(1)
  const [bestTime, setBestTime] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [gameTime, setGameTime] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [startInitiated, setStartInitiated] = useState(false)
  const [cellToAnimate, setCellToAnimate] = useState<number | null>(null)
  const [animateError, setAnimateError] = useState<number | null>(null)
  const gameGridRef = useRef<HTMLDivElement>(null)
  // Keep refs in sync so very fast taps still read the latest target number immediately.
  const gameStateRef = useRef<GameState>('idle')
  const currentNumberRef = useRef(1)

  const updateGameState = useCallback((nextGameState: GameState) => {
    gameStateRef.current = nextGameState
    setGameState(nextGameState)
  }, [])

  const updateCurrentNumber = useCallback((nextNumber: number) => {
    currentNumberRef.current = nextNumber
    setCurrentNumber(nextNumber)
  }, [])

  useEffect(() => {
    const savedBestTime = localStorage.getItem(BEST_TIME_KEY)

    if (savedBestTime) {
      setBestTime(parseFloat(savedBestTime))
    }

    initializeGrid()
  }, [])

  useInterval(() => {
    if (gameState === 'playing') {
      const elapsed = (Date.now() - startTime) / 1000
      setCurrentTime(elapsed)
    }
  }, gameState === 'playing' ? 100 : null)

  useTimeout(() => {
    if (!startInitiated) {
      return
    }

    setIsLoading(false)
    setStartTime(Date.now())
    updateGameState('playing')
    initializeGrid()
    setStartInitiated(false)
  }, startInitiated ? 1000 : null)

  useTimeout(() => {
    if (cellToAnimate === null) {
      return
    }

    setGrid((currentGrid) => currentGrid.map((cell) => ({ ...cell, isCorrect: false })))
    setCellToAnimate(null)
  }, cellToAnimate !== null ? 150 : null)

  useTimeout(() => {
    if (animateError === null) {
      return
    }

    setGrid((currentGrid) => currentGrid.map((cell) => ({ ...cell, isError: false })))
    setAnimateError(null)
  }, animateError !== null ? 300 : null)

  const updateBestTime = useCallback((newTime: number) => {
    if (newTime < bestTime || bestTime === 0) {
      setBestTime(newTime)
      localStorage.setItem(BEST_TIME_KEY, newTime.toString())
    }
  }, [bestTime])

  const startGame = useCallback(() => {
    if (gameGridRef.current) {
      setTimeout(() => {
        gameGridRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 50)
    }

    setIsLoading(true)
    updateGameState('idle')
    setShowResults(false)
    setMistakes(0)
    setCurrentTime(0)
    setGameTime(0)
    setStartInitiated(true)
  }, [updateGameState])

  const resumeGame = useCallback(() => {
    const now = Date.now()
    const adjustedStartTime = now - gameTime * 1000
    setStartTime(adjustedStartTime)
    updateGameState('playing')
  }, [gameTime, updateGameState])

  const stopGame = useCallback(() => {
    updateGameState('stopped')
    const endTime = Date.now()
    const timeElapsed = (endTime - startTime) / 1000
    setGameTime(timeElapsed)
  }, [startTime, updateGameState])

  const initializeGrid = () => {
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1)
    const shuffled = [...numbers].sort(() => Math.random() - 0.5)
    setGrid(shuffled.map((number) => ({
      number,
      isError: false,
      isCorrect: false
    })))
    updateCurrentNumber(1)
  }

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }

  const handleSuccess = useCallback(async () => {
    const endTime = Date.now()
    const completionTimeMs = endTime - startTime
    const adjustedTimeMs = completionTimeMs + mistakes * MISTAKE_PENALTY_MS
    const adjustedTimeSeconds = adjustedTimeMs / 1000

    setGameTime(adjustedTimeSeconds)

    updateBestTime(adjustedTimeSeconds)

    updateGameState('complete')
    setShowResults(true)
    triggerConfetti()

    await submitScoreToLeaderboard("schulte-table", adjustedTimeMs, {
      mode: RANKED_LEADERBOARD_MODE,
    })
  }, [mistakes, startTime, updateBestTime, updateGameState])

  const handleCellClick = useCallback((cell: Cell) => {
    if (gameStateRef.current !== 'playing') {
      return
    }

    const expectedNumber = currentNumberRef.current

    if (cell.number < expectedNumber) {
      return
    }

    if (cell.number === expectedNumber) {
      setGrid((currentGrid) => currentGrid.map((currentCell) =>
        currentCell.number === cell.number
          ? { ...currentCell, isCorrect: true }
          : currentCell
      ))
      setCellToAnimate(cell.number)

      if (expectedNumber >= 25) {
        void handleSuccess()
      } else {
        updateCurrentNumber(expectedNumber + 1)
      }

      return
    }

    setMistakes((prev) => prev + 1)
    setGrid((currentGrid) => currentGrid.map((currentCell) =>
      currentCell.number === cell.number
        ? { ...currentCell, isError: true }
        : currentCell
    ))
    setAnimateError(cell.number)
  }, [handleSuccess, updateCurrentNumber])

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      {gameState !== 'idle' && (
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{currentTime.toFixed(1)}s</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="text-sm">
              {t('findNumber')}: {currentNumber}
            </div>
          </div>
        </div>
      )}

      <div className="relative" ref={gameGridRef}>
        <div
          className="grid mx-auto max-w-lg"
          style={{
            gridTemplateColumns: `repeat(${Math.sqrt(grid.length)}, 1fr)`,
            gap: GAME_CONFIG.grid.gap
          }}
        >
          {grid.map((cell, i) => (
            <div
              key={i}
              onClick={() => handleCellClick(cell)}
              className={cn(
                "aspect-square rounded-lg transition-all duration-300 cursor-pointer select-none",
                "flex items-center justify-center text-xl md:text-2xl font-bold",
                "bg-muted",
                cell.isError && "bg-destructive/30",
                cell.isCorrect && "bg-success/30"
              )}
            >
              {cell.number}
            </div>
          ))}
        </div>

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/90 backdrop-blur-xs">
            {bestTime > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground mb-2">
                <Trophy className="w-4 h-4" />
                <span>{t('bestTime')}: {bestTime.toFixed(1)}s</span>
              </div>
            )}
            <Button
              size="lg"
              onClick={startGame}
              className="gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <PlayCircle className="w-5 h-5" />
              )}
              {isLoading ? t('starting') : t('startGame')}
            </Button>
          </div>
        )}

        {showResults && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-xs">
            <div className="bg-background p-6 rounded-xl shadow-lg space-y-4">
              <h3 className="text-2xl font-bold text-center mb-4">
                {t('gameComplete')}
              </h3>
              <div className="space-y-2">
                <p className="flex justify-between gap-4">
                  <span>{t('time')}:</span>
                  <span className="font-bold">{gameTime.toFixed(1)}s</span>
                </p>
                <p className="flex justify-between gap-4">
                  <span>{t('bestTime')}:</span>
                  <span className="font-bold">{bestTime > 0 ? `${bestTime.toFixed(1)}s` : '-'}</span>
                </p>
                <p className="flex justify-between gap-4">
                  <span>{t('mistakes')}:</span>
                  <span className="font-bold">{mistakes}</span>
                </p>
              </div>
              <div className="flex gap-2 justify-center mt-6">
                <Button onClick={startGame}>
                  {t('playAgain')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowShareModal(true)}
                >
                  {t('share')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'stopped' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/90 backdrop-blur-xs">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-medium">{t('gameStopped')}</h3>
              <p className="text-sm text-muted-foreground">{t('timeElapsed')}: {gameTime.toFixed(1)}s</p>

              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                <Button
                  onClick={resumeGame}
                  className="gap-2"
                  variant="default"
                >
                  <PlayCircle className="w-5 h-5" />
                  {t('resumeGame')}
                </Button>

                <Button
                  onClick={startGame}
                  className="gap-2"
                  variant="outline"
                >
                  <RefreshCw className="w-5 h-5" />
                  {t('restart')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {gameState === 'playing' && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={startGame}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('restart')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={stopGame}
            className="gap-2"
          >
            <StopCircle className="w-4 h-4" />
            {t('stop')}
          </Button>
        </div>
      )}

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  )
}
