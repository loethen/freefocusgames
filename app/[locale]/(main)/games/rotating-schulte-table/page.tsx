import type { Metadata } from 'next'
import { use } from 'react'
import { Brain, Eye, Gauge } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { useTranslations } from 'next-intl'

import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Link } from '@/i18n/navigation'
import { generateAlternates } from '@/lib/utils'
import { routing } from '@/i18n/routing'
import { SITE_BASE_URL } from '@/lib/site-constants'

import { RotatingSchulteGame } from './components/RotatingSchulteGame'

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
    namespace: 'games.rotatingSchulteTable',
  })

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      images: [{ url: '/games/rotating-schulte-table.png', width: 1130, height: 950 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: ['/games/rotating-schulte-table.png'],
    },
    alternates: generateAlternates(locale, 'games/rotating-schulte-table'),
  }
}

export default function RotatingSchulteTablePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  setRequestLocale(locale)
  const t = useTranslations('games.rotatingSchulteTable')
  const faq = [
    {
      question: t('faq.whatIsIt.question'),
      answer: t('faq.whatIsIt.answer'),
    },
    {
      question: t('faq.howToPlay.question'),
      answer: t('faq.howToPlay.answer'),
    },
    {
      question: t('faq.whatMakesItDynamic.question'),
      answer: t('faq.whatMakesItDynamic.answer'),
    },
    {
      question: t('faq.howToPractice.question'),
      answer: t('faq.howToPractice.answer'),
    },
    {
      question: t('faq.regularDifference.question'),
      answer: t('faq.regularDifference.answer'),
    },
    {
      question: t('faq.doesItImproveFocus.question'),
      answer: t('faq.doesItImproveFocus.answer'),
    },
    {
      question: t('faq.goodTime.question'),
      answer: t('faq.goodTime.answer'),
    },
    {
      question: t('faq.motionComfort.question'),
      answer: t('faq.motionComfort.answer'),
    },
    {
      question: t('faq.isFree.question'),
      answer: t('faq.isFree.answer'),
    },
  ]
  const localePrefix = locale === 'en' ? '' : `/${locale}`
  const pageUrl = `${SITE_BASE_URL}${localePrefix}/games/rotating-schulte-table`
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t('title'),
      description: t('metaDescription'),
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
      gameId="rotating-schulte-table"
      title={t('title')}
      subtitle={t('subtitle')}
      description={t('description')}
      gameComponent={<RotatingSchulteGame />}
      howToPlay={
        <>
          <p>{t('howToPlay.description')}</p>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            <li>{t('howToPlay.step1')}</li>
            <li>{t('howToPlay.step2')}</li>
            <li>{t('howToPlay.step3')}</li>
            <li>{t('howToPlay.step4')}</li>
          </ol>
        </>
      }
      leaderboardIntro={<p>{t('leaderboard.description')}</p>}
      additionalContent={
        <div className="rounded-xl border border-border bg-muted/30 p-6 md:p-8">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">
            {t('comparison.title')}
          </h2>
          <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
            {t('comparison.intro')}{' '}
            <Link href="/games/schulte-table" className="font-medium text-primary underline-offset-4 hover:underline">
              {t('comparison.classicLink')}
            </Link>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 font-semibold">{t('comparison.feature')}</th>
                  <th className="p-3 font-semibold">{t('comparison.rotating')}</th>
                  <th className="p-3 font-semibold">{t('comparison.classic')}</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {(['layout', 'movement', 'targets', 'strategy', 'scoring'] as const).map((row) => (
                  <tr key={row} className="border-b border-border/70 last:border-0">
                    <th scope="row" className="p-3 font-medium text-foreground">
                      {t(`comparison.rows.${row}.label`)}
                    </th>
                    <td className="p-3">{t(`comparison.rows.${row}.rotating`)}</td>
                    <td className="p-3">{t(`comparison.rows.${row}.classic`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }
      benefits={[
        {
          icon: <Eye className="h-10 w-10" />,
          title: t('benefits.visualTracking.title'),
          description: t('benefits.visualTracking.description'),
        },
        {
          icon: <Brain className="h-10 w-10" />,
          title: t('benefits.attention.title'),
          description: t('benefits.attention.description'),
        },
        {
          icon: <Gauge className="h-10 w-10" />,
          title: t('benefits.processingSpeed.title'),
          description: t('benefits.processingSpeed.description'),
        },
      ]}
      benefitsTitle={t('benefits.title')}
      science={{
        title: t('science.title'),
        description: (
          <div className="space-y-6">
            <div>
              <h4 className="mb-2 font-semibold text-foreground">{t('science.visualSearch.title')}</h4>
              <p>{t('science.visualSearch.description')}</p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-foreground">{t('science.rotation.title')}</h4>
              <p>{t('science.rotation.description')}</p>
            </div>
          </div>
        ),
      }}
      faq={faq}
      relatedGames={['schulte-table', 'double-decision', 'focus-reaction-test']}
      hasLeaderboard
      leaderboardTitle={t('leaderboard.title')}
      leaderboardFormatterType="schulte"
      leaderboardMode="ranked"
      structuredData={structuredData}
    />
  )
}
