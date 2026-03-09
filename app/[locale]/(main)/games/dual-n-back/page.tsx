import { Metadata } from 'next'
import Game from './components/Game'
import { GamePageTemplate } from '@/components/GamePageTemplate'
import { Brain, Layers, Zap, Clock, BookOpen } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { use } from 'react';
import TutorialButton from './components/TutorialButton';
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

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
    other: {
      // JSON-LD for enhanced SEO
      'script:ld+json': JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": t('title'),
        "description": t('metaDescription'),
        "url": `https://freefocusgames.com/${locale}/games/dual-n-back`,
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "featureList": [
          "30-second Interactive Tutorial",
          "Beginner-Friendly Design",
          "Scientifically-Backed Training",
          "Real-time Feedback",
          "Progressive Difficulty"
        ],
        "educationalUse": "Cognitive Training",
        "learningResourceType": "Interactive Tutorial",
        "interactivityType": "active"
      })
    }
  };
}

export default function DualNBackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('games.dualNBack');
  const tCommon = useTranslations('common');

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
        authorityLinks: [
          {
            title: "Jaeggi et al. (2008) - PNAS",
            url: "https://www.pnas.org/content/105/19/6829",
            description: t('science.authorityLinks.jaeggi')
          },
          {
            title: "Working Memory - Wikipedia",
            url: "https://en.wikipedia.org/wiki/Working_memory",
            description: t('science.authorityLinks.wikipedia')
          },
          {
            title: "Dual N-Back Task - Cognitive Training Data",
            url: "https://www.cognitivetrainingdata.org/the-dual-n-back-task/",
            description: t('science.authorityLinks.cognitiveTraining')
          }
        ]
      }}
      faq={[
        {
          question: t('faq.science.question'),
          answer: t('faq.science.answer')
        },
        {
          question: t('faq.practice.question'),
          answer: t('faq.practice.answer')
        },
        {
          question: t('faq.challenging.question'),
          answer: t('faq.challenging.answer')
        },
        {
          question: t('faq.improvements.question'),
          answer: t('faq.improvements.answer')
        }
      ]}
      relatedGames={["mahjong-dual-n-back", "block-memory-challenge"]}
    />
  );
} 
