'use client';

import React, { useState, useCallback } from 'react';
import { Check, Eye, Hand } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { checkIconBadge, checkPrimaryButton } from './check-styles';
import CheckIntro from './CheckIntro';

interface MemoryTestProps {
  onComplete: (memoryScore: number) => void;
}

export default function MemoryTest({ onComplete }: MemoryTestProps) {
  const t = useTranslations('getStarted.memoryTest');
  const [testState, setTestState] = useState<'instruction' | 'playing' | 'completed'>('instruction');
  const [memorySequence, setMemorySequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(false);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [score, setScore] = useState<number>(0);

  const startMemoryTest = useCallback(() => {
    setTestState('playing');
    
    // 生成不重复的序列：从0-8中随机选择6个不同的位置
    const availablePositions = Array.from({length: 9}, (_, i) => i);
    const sequence = [];
    
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * availablePositions.length);
      sequence.push(availablePositions[randomIndex]);
      availablePositions.splice(randomIndex, 1); // 移除已选择的位置
    }
    
    setMemorySequence(sequence);
    setUserSequence([]);
    setShowingSequence(true);
    setSequenceIndex(0);
    
    // 显示序列
    const showSequence = async () => {
      for (let i = 0; i < sequence.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600));
        setSequenceIndex(i);
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      setShowingSequence(false);
    };
    
    showSequence();
  }, []);

  const handleMemoryClick = useCallback((blockId: number) => {
    if (showingSequence) return;
    
    const newSequence = [...userSequence, blockId];
    setUserSequence(newSequence);
    
    if (newSequence.length === memorySequence.length) {
      // 计算得分
      const correct = newSequence.filter((num, idx) => num === memorySequence[idx]).length;
      const finalScore = Math.round((correct / memorySequence.length) * 100);
      setScore(finalScore);
      setTestState('completed');
    }
  }, [showingSequence, userSequence, memorySequence]);

  const handleComplete = useCallback(() => {
    onComplete(score);
  }, [score, onComplete]);

  if (testState === 'instruction') {
    return <CheckIntro visual="memory" title={t('title')} instructions={t('instructions')} startLabel={t('startButton')} onStart={startMemoryTest} />;
  }

  if (testState === 'playing') {
    return (
      <div className="text-center space-y-8">
        {/* 状态指示器 */}
        <div className="space-y-3">
          <h3 className="text-xl font-semibold">{t('title')}</h3>
          <div className="flex items-center justify-center gap-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              showingSequence 
                ? 'bg-primary/10 text-primary' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <Eye className="inline w-4 h-4 mr-1" />
              {t('observationPhase')}
            </div>
            <div className="w-2 h-2 bg-border rounded-full"></div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              !showingSequence 
                ? 'bg-primary/10 text-primary' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <Hand className="inline w-4 h-4 mr-1" />
              {t('recallPhase')}
            </div>
          </div>
        </div>

        {/* 3x3 网格 */}
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({length: 9}, (_, i) => (
              <div
                key={i}
                className={`w-16 h-16 border-2 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center font-bold text-lg ${
                  showingSequence && sequenceIndex < memorySequence.length && memorySequence[sequenceIndex] === i
                    ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg'
                    : userSequence.includes(i)
                    ? 'bg-primary/70 border-primary text-primary-foreground scale-105'
                    : showingSequence
                    ? 'bg-background border-border text-muted-foreground'
                    : 'bg-background border-border hover:bg-muted hover:border-primary/50 text-muted-foreground'
                }`}
                onClick={() => handleMemoryClick(i)}
              >
                {userSequence.includes(i) ? userSequence.indexOf(i) + 1 : ''}
              </div>
            ))}
          </div>
        </div>

        {/* 进度和提示 */}
        <div className="space-y-2">
          {showingSequence ? (
            <div className="space-y-2">
              <p className="text-lg font-medium text-primary animate-pulse">{t('rememberSequence')}</p>
                             <div className="flex justify-center gap-1">
                 {Array.from({length: 6}, (_, i) => (
                   <div
                     key={i}
                     className={`w-2 h-2 rounded-full transition-all ${
                       i <= sequenceIndex ? 'bg-primary' : 'bg-border'
                     }`}
                   />
                 ))}
               </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-medium text-primary">{t('clickInOrder')}</p>
              <p className="text-sm text-muted-foreground">
                {t('progress')}: {userSequence.length}/{memorySequence.length}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (testState === 'completed') {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className={checkIconBadge}>
            <Check className="w-7 h-7" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold">{t('testComplete')}</h3>
        
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
          <div className="text-3xl font-bold text-primary">{score}%</div>
          <p className="text-sm text-muted-foreground">{t('memoryAccuracy')}</p>
          <p className="text-sm text-muted-foreground">
            {t('correctRecall')}: {Math.round(score / 100 * 6)}/6 {t('positions')}
          </p>
        </div>

        {/* 表现评价 */}
        <div className="bg-muted/50 border border-border rounded-xl p-4">
          <p className="text-sm text-foreground/80">
            {score >= 75 ? 
              t('excellentMemory') : 
              score >= 50 ? 
              t('goodMemory') : 
              t('keepPracticing')
            }
          </p>
        </div>
        
        <button
          onClick={handleComplete}
          type="button"
          className={checkPrimaryButton}
        >
          {t('continueNext')}
        </button>
      </div>
    );
  }

  return null;
} 