import { Metadata } from 'next'
import { use } from 'react'
import { Brain, Eye, Zap } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { useTranslations } from 'next-intl'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { generateAlternates } from '@/lib/utils'
import { routing } from '@/i18n/routing'
import { PeripheralSpeedGame } from './components/PeripheralSpeedGame'

const NEW_SCIENTIST_ARTICLE =
  'https://www.newscientist.com/article/2578806-game-that-reduces-dementia-risk-clears-amyloid-from-mens-brains/'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({
    locale,
    namespace: 'games.doubleDecision',
  })

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    keywords: t('metadata.keywords')
      .split(',')
      .map((keyword) => keyword.trim()),
    openGraph: {
      title: t('metadata.title'),
      description: t('metadata.description'),
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      images: [{ url: '/og/oglogo.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metadata.title'),
      description: t('metadata.description'),
      images: ['/og/oglogo.png'],
    },
    alternates: generateAlternates(locale, 'games/double-decision'),
  }
}

export default function DoubleDecisionPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  setRequestLocale(locale)
  const t = useTranslations('games.doubleDecision')

  const faq = [
    {
      question: t('faq.what.question'),
      answer: t('faq.what.answer'),
    },
    {
      question: t('faq.free.question'),
      answer: t('faq.free.answer'),
    },
    {
      question: t('faq.how.question'),
      answer: t('faq.how.answer'),
    },
    {
      question: t('faq.ufov.question'),
      answer: t('faq.ufov.answer'),
    },
    {
      question: t('faq.benefits.question'),
      answer: t('faq.benefits.answer'),
    },
    {
      question: t('faq.comparison.question'),
      answer: t('faq.comparison.answer'),
    },
    {
      question: t('faq.frequency.question'),
      answer: t('faq.frequency.answer'),
    },
  ]

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://freefocusgames.com'
  const localePrefix = locale === 'en' ? '' : `/${locale}`
  const pageUrl = `${baseUrl}${localePrefix}/games/double-decision`
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t('title'),
      description: t('metadata.description'),
      url: pageUrl,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: t.raw('structuredData.featureList'),
      educationalUse: t('structuredData.educationalUse'),
      learningResourceType: 'Interactive Game',
      interactivityType: 'active',
      inLanguage: locale,
      isAccessibleForFree: true,
      dateModified: '2026-07-28',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ]

  return (
    <GamePageTemplate
      gameId="double-decision"
      title={t('title')}
      subtitle={t('subtitle')}
      gameComponent={<PeripheralSpeedGame />}
      howToPlay={
        <>
          <p>{t('howToPlay.description')}</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>{t('howToPlay.step1')}</li>
            <li>{t('howToPlay.step2')}</li>
            <li>{t('howToPlay.step3')}</li>
          </ol>
        </>
      }
      benefits={[
        {
          icon: <Eye className="h-10 w-10" />,
          title: t('benefits.visual.title'),
          description: t('benefits.visual.description'),
        },
        {
          icon: <Zap className="h-10 w-10" />,
          title: t('benefits.speed.title'),
          description: t('benefits.speed.description'),
        },
        {
          icon: <Brain className="h-10 w-10" />,
          title: t('benefits.attention.title'),
          description: t('benefits.attention.description'),
        },
      ]}
      science={{
        title: t('science.title'),
        description: (
          <div className="space-y-4">
            <p>{t('science.overview')}</p>
            <p>
              <strong className="text-foreground">
                {t('science.methodHeading')}
              </strong>{' '}
              {t('science.methodResult')}
            </p>
            <p>
              <strong className="text-foreground">
                {t('science.evidenceHeading')}
              </strong>{' '}
              {t('science.evidenceResult')}
            </p>
            <p>{t('science.gameLimit')}</p>
          </div>
        ),
        authorityLinks: [
          {
            title: t('science.sourceTitle'),
            url: NEW_SCIENTIST_ARTICLE,
            description: t('science.sourceDescription'),
          },
        ],
      }}
      faq={faq}
      relatedGames={['schulte-table', 'focus-reaction-test', 'dual-n-back']}
      hasLeaderboard
      leaderboardTitle={t('leaderboard.title')}
      leaderboardIntro={t('leaderboard.description')}
      leaderboardFormatterType="pts"
      leaderboardDetailsType="double-decision"
      structuredData={structuredData}
    />
  )
}
