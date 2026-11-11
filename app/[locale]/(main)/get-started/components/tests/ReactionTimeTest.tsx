'use client';

import React, { useState, useCallback } from 'react';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { checkIconBadge, checkPrimaryButton } from './check-styles';
import CheckIntro from './CheckIntro';

interface ReactionTimeTestProps {
  onComplete: (avgReactionTime: number) => void;
}

export default function ReactionTimeTest({ onComplete }: ReactionTimeTestProps) {
  const t = useTranslations('getStarted.reactionTimeTest');
  const [testState, setTestState] = useState<'instruction' | 'playing' | 'completed'>('instruction');
  const [reactionState, setReactionState] = useState<'waiting' | 'ready' | 'clicked'>('waiting');
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [reactionRound, setReactionRound] = useState(0);
  const [reactionStartTime, setReactionStartTime] = useState<number | null>(null);
  const [avgTime, setAvgTime] = useState<number>(0);

  /* Moved startReactionTest below startReactionRound */

  const startReactionRound = useCallback(() => {
    setReactionState('waiting');
    const waitTime = 1000 + Math.random() * 2000; // 1-3秒随机等待

    setTimeout(() => {
      setReactionState('ready');
      setReactionStartTime(Date.now());
    }, waitTime);
  }, []);

  const startReactionTest = useCallback(() => {
    setTestState('playing');
    setReactionRound(0);
    setReactionTimes([]);
    startReactionRound();
  }, [startReactionRound]);

  const handleReactionClick = useCallback(() => {
    if (reactionState === 'ready' && reactionStartTime) {
      const reactionTime = Date.now() - reactionStartTime;
      setReactionTimes(prev => [...prev, reactionTime]);
      setReactionState('clicked');

      if (reactionRound < 2) { // 3轮测试
        setReactionRound(prev => prev + 1);
        setTimeout(() => startReactionRound(), 1000);
      } else {
        // 完成反应时间测试
        const finalAvgTime = [...reactionTimes, reactionTime].reduce((a, b) => a + b, 0) / 3;
        const roundedAvgTime = Math.round(finalAvgTime);
        setAvgTime(roundedAvgTime);
        setTestState('completed');
      }
    }
  }, [reactionState, reactionStartTime, reactionRound, reactionTimes, startReactionRound]);

  const handleComplete = useCallback(() => {
    onComplete(avgTime);
  }, [avgTime, onComplete]);

  if (testState === 'instruction') {
    return <CheckIntro visual="speed" title={t('title')} instructions={t('instructions')} startLabel={t('startButton')} onStart={startReactionTest} />;
  }

  if (testState === 'playing') {
    return (
      <div className="text-center space-y-6">
        <h3 className="text-xl font-semibold">{t('title')} ({reactionRound + 1}/3)</h3>
        <div
          className={`w-48 h-48 mx-auto rounded-full cursor-pointer transition-all ${reactionState === 'waiting'
              ? 'bg-red-500'
              : reactionState === 'ready'
                ? 'bg-green-500'
                : 'bg-muted-foreground/40'
            }`}
          onClick={handleReactionClick}
        >
          <div className="flex items-center justify-center h-full text-white font-bold text-lg">
            {reactionState === 'waiting' && (
              <span className="animate-pulse">{t('wait')}</span>
            )}
            {reactionState === 'ready' && t('clickNow')}
            {reactionState === 'clicked' && t('complete')}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {reactionState === 'waiting' ? (
            <span className="animate-pulse opacity-70">{t('clickWhenGreen')}</span>
          ) : reactionState === 'ready' ? (
            t('clickNow2')
          ) : (
            `${t('reactionTime')}: ${reactionTimes[reactionTimes.length - 1]} ${t('milliseconds')}`
          )}
        </p>
      </div>
    );
  }

  if (testState === 'completed') {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center"><div className={checkIconBadge}><Check className="w-7 h-7" /></div></div>
        <h3 className="text-xl font-semibold">{t('testComplete')}</h3>
        <p>{t('averageReactionTime')}: {avgTime} {t('milliseconds')}</p>
        <button
          onClick={handleComplete}
          type="button"
          className={checkPrimaryButton}
        >
          {t('nextTest')}
        </button>
      </div>
    );
  }

  return null;
} 