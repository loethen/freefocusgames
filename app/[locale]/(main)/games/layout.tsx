import React from 'react';
import { setRequestLocale } from 'next-intl/server';

export const dynamic = "force-static";
export const revalidate = false;

interface GamesLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function GamesLayout({ children, params }: GamesLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="pb-12 max-w-7xl mx-auto">
      {/* 游戏内容将被注入到这里 */}
      {children}
    </div>
  );
} 
