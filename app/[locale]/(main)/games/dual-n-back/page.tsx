import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Brain, Layers, Zap, Clock, BookOpen, Target, CalendarRange } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { use } from 'react';
import TutorialButton from './components/TutorialButton';
import DualNBackClearLeaderboard from './components/DualNBackClearLeaderboard';
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { generateAlternates } from '@/lib/utils';
import {
  DUAL_N_BACK_CLEAR_MIN_ACCURACY,
  DUAL_N_BACK_CLEAR_MIN_LEVEL,
  DUAL_N_BACK_CLEAR_MIN_TRIALS,
} from '@/lib/dual-n-back-clear-rules';

// Generate static params for all locales
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// 将静态元数据改为动态生成函数
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'games.dualNBack' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: t('metaKeywords').split(',').map(keyword => keyword.trim()),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
    },
    alternates: generateAlternates(locale, 'games/dual-n-back'),
  };
}

export default function DualNBackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('games.dualNBack');
  const tCommon = useTranslations('common');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://freefocusgames.com';
  const localePrefix = locale === 'en' ? '' : `/${locale}`;
  const pageUrl = `${baseUrl}${localePrefix}/games/dual-n-back`;

  const faq = [
    {
      question: t('faq.science.question'),
      answer: t('faq.science.answer')
    },
    {
      question: t('faq.practice.question'),
      answer: t('faq.practice.answer')
    },
    {
      question: t('faq.progress.question'),
      answer: t('faq.progress.answer')
    },
    {
      question: t('faq.challenging.question'),
      answer: t('faq.challenging.answer')
    },
    {
      question: t('faq.improvements.question'),
      answer: t('faq.improvements.answer')
    }
  ];

  const quickFacts = [
    {
      icon: <Target className="h-5 w-5 text-primary" />,
      title: t('landing.quickFacts.items.beginner.title'),
      body: t('landing.quickFacts.items.beginner.body')
    },
    {
      icon: <Layers className="h-5 w-5 text-primary" />,
      title: t('landing.quickFacts.items.levelUp.title'),
      body: t('landing.quickFacts.items.levelUp.body')
    },
    {
      icon: <Clock className="h-5 w-5 text-primary" />,
      title: t('landing.quickFacts.items.session.title'),
      body: t('landing.quickFacts.items.session.body')
    },
    {
      icon: <CalendarRange className="h-5 w-5 text-primary" />,
      title: t('landing.quickFacts.items.frequency.title'),
      body: t('landing.quickFacts.items.frequency.body')
    }
  ];

  const trainingPlan = [
    {
      title: t('landing.plan.weeks.week1.title'),
      body: t('landing.plan.weeks.week1.body')
    },
    {
      title: t('landing.plan.weeks.week2.title'),
      body: t('landing.plan.weeks.week2.body')
    },
    {
      title: t('landing.plan.weeks.week3.title'),
      body: t('landing.plan.weeks.week3.body')
    },
    {
      title: t('landing.plan.weeks.week4.title'),
      body: t('landing.plan.weeks.week4.body')
    }
  ];

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
      featureList: [
        'Free dual n-back online gameplay',
        '30-second interactive tutorial',
        'Adjustable N-back difficulty',
        'Visual and audio recall training',
        'Browser-based daily practice'
      ],
      educationalUse: 'Working Memory Training',
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
  ];

  return (
    <GamePageTemplate
      gameId="dual-n-back"
      title={t('title')}
      subtitle={t('subtitle')}
      gameComponent={<Game />}
      howToPlay={
        <>
          <Link href="/working-memory-guide" className="block mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors group">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-primary">
                {tCommon('learnMoreAboutWorkingMemory')}
              </span>
            </div>
          </Link>
          <p>{t('howToPlayIntro')}</p>
          <div className="my-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-orange-400 rounded-r-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-orange-800">{t('gameUI.tutorial.learnToPlay')}</p>
                  <p className="text-xs text-orange-600">{t('gameUI.tutorial.perfectForBeginners')}</p>
                </div>
              </div>
              <TutorialButton />
            </div>
          </div>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>{t('howToPlay1')}</li>
            <li>{t('howToPlay2')}</li>
            <li>{t('howToPlay3')}</li>
            <li>{t('howToPlay4')}</li>
          </ul>
        </>
      }
      additionalContent={
        <>
          <div className="rounded-3xl bg-muted/35 p-6 md:p-8">
            <div className="mb-6 max-w-3xl">
              <h2 className="mb-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {t('landing.quickFacts.title')}
              </h2>
              <p className="text-base leading-7 text-muted-foreground">
                {t('landing.quickFacts.intro')}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {quickFacts.map((fact) => (
                <div key={fact.title} className="rounded-2xl bg-background/80 p-5 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {fact.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{fact.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{fact.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-muted/35 p-6 md:p-8">
            <div className="mb-6 max-w-3xl">
              <h2 className="mb-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {t('landing.plan.title')}
              </h2>
              <p className="text-base leading-7 text-muted-foreground">
                {t('landing.plan.intro')}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {trainingPlan.map((item) => (
                <div key={item.title} className="rounded-2xl bg-background/80 p-5 shadow-sm">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-primary/80">
                    {item.title}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      }
      benefits={[
        {
          icon: <Brain className="w-10 h-10" />,
          title: t('benefits.workingMemory.title'),
          description: t('benefits.workingMemory.description')
        },
        {
          icon: <Layers className="w-10 h-10" />,
          title: t('benefits.fluidIntelligence.title'),
          description: t('benefits.fluidIntelligence.description')
        },
        {
          icon: <Zap className="w-10 h-10" />,
          title: t('benefits.attentionControl.title'),
          description: t('benefits.attentionControl.description')
        }
      ]}
      science={{
        title: t('science.title'),
        description: t('science.description'),
        blogArticleUrl: "/blog/the-science-behind-n-back-training-boost-working-memory",
        blogArticleTitle: t('science.blogArticleTitle'),
      }}
      faq={faq}
      relatedGames={["mahjong-dual-n-back", "block-memory-challenge"]}
      leaderboardTitle={t('leaderboards.title')}
      leaderboardIntro={
        <p>
          {t('leaderboards.intro', {
            accuracy: DUAL_N_BACK_CLEAR_MIN_ACCURACY,
            level: DUAL_N_BACK_CLEAR_MIN_LEVEL,
            rounds: DUAL_N_BACK_CLEAR_MIN_TRIALS,
          })}
        </p>
      }
      leaderboardComponent={<DualNBackClearLeaderboard />}
      structuredData={structuredData}
    />
  );
} 
