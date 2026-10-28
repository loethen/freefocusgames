import { Metadata } from 'next'
import { use } from 'react'
import { Brain, Eye, Zap } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { useTranslations } from 'next-intl'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { generateAlternates } from '@/lib/utils'
import { routing } from '@/i18n/routing'
import { SchoolRunGame } from './components/SchoolRunGame'

// Prototype: kept out of search and the games list until it is play-tested. It is not in
// data/games.tsx, so the sitemap skips it too.
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
    robots: { index: false, follow: false },
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
    />
  )
}
