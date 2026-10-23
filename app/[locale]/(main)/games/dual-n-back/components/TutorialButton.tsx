'use client';

import { useTranslations } from 'next-intl';
import { Play } from 'lucide-react';

export default function TutorialButton() {
  const t = useTranslations('games.dualNBack.gameUI.tutorial');

  return (
    <button 
      id="tutorial-trigger-howtoplay"
      className="group relative px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-out overflow-hidden"
    >
      {/* 动态背景效果 */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
      
      {/* 闪光效果 */}
      <div className="absolute inset-0 -top-2 -left-2 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transform -skew-x-12 group-hover:translate-x-full transition-all duration-1000 ease-out"></div>
      
      {/* 按钮内容 */}
      <div className="relative flex items-center gap-2">
        <Play className="w-4 h-4" />
        <span>{t('interactiveTutorial')}</span>
      </div>
    </button>
  );
}