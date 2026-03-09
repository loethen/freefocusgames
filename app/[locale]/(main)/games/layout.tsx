import React from 'react';

export const dynamic = "force-static";
export const revalidate = 86400;

interface GamesLayoutProps {
  children: React.ReactNode;
}

export default function GamesLayout({ children }: GamesLayoutProps) {
  return (
    <div className="pb-12 max-w-7xl mx-auto">
      {/* 游戏内容将被注入到这里 */}
      {children}
    </div>
  );
} 
