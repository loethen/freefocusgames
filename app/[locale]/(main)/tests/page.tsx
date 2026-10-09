import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { generateAlternates } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Brain, Clock, Target } from 'lucide-react';
import { use } from 'react';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tests' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: t('metaKeywords'),
    alternates: generateAlternates(locale, 'tests'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      type: 'website',
    },
  };
}

export default function TestsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('tests');
  const common = useTranslations('common');

  const tests = [
    { id: 'trail-making-test', href: '/games/trail-making-test', icon: <Target className="w-8 h-8" />, title: locale === 'zh' ? '连线测试' : 'Trail Making Test', description: locale === 'zh' ? '连接数字与字母，分别记录 A/B 用时与错误数。' : 'Connect numbers and letters, with separate time and errors for Parts A and B.', duration: locale === 'zh' ? '按部分计时' : 'Timed by part', color: 'from-neutral-600 to-neutral-700' },
    { id: 'digit-span-test', href: '/games/digit-span-test', icon: <Brain className="w-8 h-8" />, title: locale === 'zh' ? '数字广度测试' : 'Digit Span Test', description: locale === 'zh' ? '正背与倒背数字回忆，提供试次回顾。' : 'Forward and backward digit recall with a review of each attempt.', duration: locale === 'zh' ? '输入不限时' : 'Untimed input', color: 'from-neutral-600 to-neutral-700' },
    {
      id: 'cognitive-assessment',
      href: '/get-started',
      icon: <Brain className="w-8 h-8" />,
      title: t('cognitive.title'),
      description: t('cognitive.description'),
      duration: t('cognitive.duration'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'adhd-assessment',
      href: '/adhd-assessment',
      icon: <Target className="w-8 h-8" />,
      title: t('adhd.title'),
      description: t('adhd.description'),
      duration: t('adhd.duration'),
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'adult-adhd-assessment',
      href: '/adult-adhd-assessment',
      icon: <Clock className="w-8 h-8" />,
      title: t('adultAdhd.title'),
      description: t('adultAdhd.description'),
      duration: t('adultAdhd.duration'),
      color: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <Breadcrumbs
        items={[
          { label: t("title") }
        ]}
      />

      <div className="mt-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {tests.map((test) => (
            <div
              key={test.id}
              className="relative group bg-gradient-to-br from-background to-muted/30 border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${test.color} opacity-10 rounded-full -mr-8 -mt-8 blur-xl`}></div>

              <div className={`mb-4 p-3 rounded-lg bg-gradient-to-br ${test.color} w-fit`}>
                <div className="text-white">
                  {test.icon}
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-3">
                {test.title}
              </h3>

              <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                {test.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {test.duration}
                </span>
                <Link href={test.href}>
                  <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80">
                    {common('startTest')}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">{t('whyTest.title')}</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('whyTest.description')}
          </p>
        </div>
      </div>
    </div>
  );
}
