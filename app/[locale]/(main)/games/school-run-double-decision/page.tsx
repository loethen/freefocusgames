import { SITE_BASE_URL } from '@/lib/site-constants'
import { Metadata } from 'next'
import { use } from 'react'
import { Brain, Eye, Zap } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { useTranslations } from 'next-intl'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { generateAlternates } from '@/lib/utils'
import { routing } from '@/i18n/routing'
import { SchoolRunGame } from './components/SchoolRunGame'

const coverImage = '/games/school-run-double-decision-cover.png'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'games.schoolRunDoubleDecision' })
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
      images: [{ url: coverImage, width: 1200, height: 675, alt: t('title') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metadata.title'),
      description: t('metadata.description'),
      images: [coverImage],
    },
    alternates: generateAlternates(locale, 'games/school-run-double-decision'),
  }
}

export default function SchoolRunDoubleDecisionPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  setRequestLocale(locale)
  const t = useTranslations('games.schoolRunDoubleDecision')

  const faq = (['what', 'classic', 'endless', 'device'] as const).map((key) => ({
    question: t(`faq.${key}.question`),
    answer: t(`faq.${key}.answer`),
  }))

  const localePrefix = locale === 'en' ? '' : `/${locale}`
  const pageUrl = `${SITE_BASE_URL}${localePrefix}/games/school-run-double-decision`
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t('title'),
      description: t('metadata.description'),
      url: pageUrl,
      image: `${SITE_BASE_URL}${coverImage}`,
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web Browser',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: t.raw('structuredData.featureList'),
      educationalUse: t('structuredData.educationalUse'),
      interactivityType: 'active',
      inLanguage: locale,
      isAccessibleForFree: true,
      dateModified: '2026-10-28',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ]

  return (
    <GamePageTemplate
      gameId="school-run-double-decision"
      title={t('title')}
      subtitle={t('subtitle')}
      gameComponent={<SchoolRunGame />}
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
          title: t('benefits.focus.title'),
          description: t('benefits.focus.description'),
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
      faq={faq}
      relatedGames={['double-decision', 'reaction-time', 'schulte-table']}
      structuredData={structuredData}
    />
  )
}
