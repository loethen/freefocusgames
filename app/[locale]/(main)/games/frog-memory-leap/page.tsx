import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Brain, Eye, Lightbulb } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { use } from 'react'
import { routing } from '@/i18n/routing'
import { generateAlternates } from '@/lib/utils'

// Generate static params for all locales
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'games.frogMemoryLeap' });

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    keywords: t('metadata.keywords'),
    openGraph: {
      title: t('metadata.ogTitle'),
      description: t('metadata.ogDescription'),
      images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
    },
    alternates: generateAlternates(locale, 'games/frog-memory-leap'),
  };
}

export default function FrogMemoryLeapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('games.frogMemoryLeap');

  return (
    <GamePageTemplate
      gameId="frog-memory-leap"
      title={t('title')}
      subtitle={t('subtitle')}
      gameComponent={<Game />}
      howToPlay={
        <>
          <p>{t('howToPlay.intro')}</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>{t('howToPlay.step1')}</li>
            <li>{t('howToPlay.step2')}</li>
            <li>{t('howToPlay.step3')}</li>
            <li>{t('howToPlay.step4')}</li>
          </ul>
        </>
      }
      benefits={[
        {
          icon: <Brain className="w-10 h-10" />,
          title: t('benefits.workingMemory.title'),
          description: t('benefits.workingMemory.description')
        },
        {
          icon: <Eye className="w-10 h-10" />,
          title: t('benefits.visualSpatialMemory.title'),
          description: t('benefits.visualSpatialMemory.description')
        },
        {
          icon: <Lightbulb className="w-10 h-10" />,
          title: t('benefits.patternRecognition.title'),
          description: t('benefits.patternRecognition.description')
        }
      ]}
      faq={[
        {
          question: t('faq.sequentialMemory.question'),
          answer: t('faq.sequentialMemory.answer')
        },
        {
          question: t('faq.ageGroups.question'),
          answer: t('faq.ageGroups.answer')
        },
        {
          question: t('faq.practiceTips.question'),
          answer: t('faq.practiceTips.answer')
        },
        {
          question: t('faq.learningDifficulties.question'),
          answer: t('faq.learningDifficulties.answer')
        }
      ]}
      relatedGames={["fish-trace", "block-memory-challenge", "dual-n-back"]}
      hasLeaderboard={true}
      leaderboardFormatterType="pts"
    />
  );
} 
