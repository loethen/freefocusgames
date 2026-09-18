import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Zap, Target, Calculator } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { use } from 'react';
import { generateAlternates } from '@/lib/utils';
import { routing } from '@/i18n/routing';

const coverImage = '/games/larger-number-cover.png';

// Generate static params for all locales
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// 将静态元数据改为动态生成函数
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'games' });

  return {
    title: t('largerNumber.metaTitle'),
    description: t('largerNumber.metaDescription'),
    keywords: t('largerNumber.metaKeywords').split(',').map(keyword => keyword.trim()),
    openGraph: {
      title: t('largerNumber.ogTitle'),
      description: t('largerNumber.ogDescription'),
      images: [{ url: coverImage, width: 1200, height: 675, alt: t('largerNumber.title') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('largerNumber.ogTitle'),
      description: t('largerNumber.ogDescription'),
      images: [coverImage],
    },
    // 多语言替代版本
    alternates: generateAlternates(locale, 'games/larger-number'),
  };
}

export default function LargerNumberPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('games.largerNumber');

  return (
    <GamePageTemplate
      gameId="larger-number"
      title={t('title')}
      subtitle={t('subtitle')}
      gameComponent={<Game />}
      howToPlay={
        <>
          <p>{t('howToPlayIntro')}</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>{t('howToPlay1')}</li>
            <li>{t('howToPlay2')}</li>
            <li>{t('howToPlay3')}</li>
            <li>{t('howToPlay4')}</li>
          </ul>
        </>
      }
      benefits={[
        {
          icon: <Zap className="w-10 h-10" />,
          title: t('benefits.processingSpeed.title'),
          description: t('benefits.processingSpeed.description')
        },
        {
          icon: <Target className="w-10 h-10" />,
          title: t('benefits.selectiveAttention.title'),
          description: t('benefits.selectiveAttention.description')
        },
        {
          icon: <Calculator className="w-10 h-10" />,
          title: t('benefits.numericalCognition.title'),
          description: t('benefits.numericalCognition.description')
        }
      ]}
      faq={[
        {
          question: t('faq.mathSkills.question'),
          answer: t('faq.mathSkills.answer')
        },
        {
          question: t('faq.children.question'),
          answer: t('faq.children.answer')
        },
        {
          question: t('faq.processingSpeed.question'),
          answer: t('faq.processingSpeed.answer')
        },
        {
          question: t('faq.adults.question'),
          answer: t('faq.adults.answer')
        }
      ]}
      relatedGames={['schulte-table', 'reaction-time', 'block-memory-challenge']}
    />
  );
} 
