'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function GamePreview() {
  const t = useTranslations("games.blockMemoryChallenge.gameUI")
  const [activeBlock, setActiveBlock] = useState<number | null>(null)
  const [activeType, setActiveType] = useState<'pattern' | 'correct' | 'error'>('pattern')
  const [status, setStatus] = useState<string>('')
  const [showResult, setShowResult] = useState<'success' | 'error' | null>(null)
  const blocks = Array.from({ length: 9 }, (_, i) => i)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let isAnimating = true

    const animate = async () => {
      while (isAnimating) {
        // 正确示范
        setStatus(t('watchSequence'))
        // 显示第一个方块
        setActiveBlock(4)
        setActiveType('pattern')
        await wait(1000)
        setActiveBlock(null)
        await wait(300)
        
        // 显示第二个方块
        setActiveBlock(1)
        setActiveType('pattern')
        await wait(1000)
        setActiveBlock(null)
        await wait(1000)

        // 用户输入阶段
        setStatus(t('yourTurn'))
        // 正确输入第一个方块
        setActiveBlock(4)
        setActiveType('correct')
        await wait(800)
        setActiveBlock(null)
        await wait(300)
        
        // 正确输入第二个方块
        setActiveBlock(1)
        setActiveType('correct')
        await wait(800)
        setActiveBlock(null)
        
        // 显示成功
        setShowResult('success')
        await wait(1000)
        setShowResult(null)
        await wait(1000)

        // 错误示范
        setStatus(t('watchSequence'))
        // 显示第一个方块
        setActiveBlock(7)
        setActiveType('pattern')
        await wait(1000)
        setActiveBlock(null)
        await wait(300)
        
        // 显示第二个方块
        setActiveBlock(5)
        setActiveType('pattern')
        await wait(1000)
        setActiveBlock(null)
        await wait(1000)

        // 用户输入阶段
        setStatus(t('yourTurn'))
        // 正确输入第一个方块
        setActiveBlock(7)
        setActiveType('correct')
        await wait(800)
        setActiveBlock(null)
        await wait(300)
        
        // 错误输入
        setActiveBlock(2)
        setActiveType('error')
        await wait(800)
        setActiveBlock(null)
        
        // 显示错误
        setShowResult('error')
        await wait(1000)
        setShowResult(null)
        await wait(1000)
      }
    }

    const wait = (ms: number) => new Promise(resolve => {
      timeoutId = setTimeout(resolve, ms)
    })

    animate()

    return () => {
      isAnimating = false
      clearTimeout(timeoutId)
    }
  }, [t])

  return (
    <div className="w-full max-w-[400px] mx-auto">
      <div className="aspect-square relative rounded-xl bg-linear-to-br from-primary/10 to-secondary/10 p-6">
        {status && (
          <div className="absolute top-4 left-0 right-0 text-center">
            <span className="bg-background/80 text-sm px-3 py-1 rounded-full">
              {status}
            </span>
          </div>
        )}
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-[240px]">
            <div className="grid grid-cols-3 gap-3">
              {blocks.map((i) => (
                <div
                  key={i}
                  className={cn(
                    "aspect-square rounded-lg transition-all duration-300",
                    activeBlock === i && {
                      'bg-primary scale-95': activeType === 'pattern',
                      'bg-green-500 scale-95': activeType === 'correct',
                      'bg-red-500 scale-95': activeType === 'error',
                    },
                    activeBlock !== i && "bg-background"
                  )}
                />
              ))}
            </div>

            {showResult && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-xs rounded-lg">
                {showResult === 'success' ? (
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* 装饰元素 */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-secondary/10 rounded-full blur-xl" />
      </div>
    </div>
  )
} 