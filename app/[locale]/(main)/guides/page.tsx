import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { generateAlternates } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';
import { use } from 'react';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'guides' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: t('metaKeywords'),
    alternates: generateAlternates(locale, 'guides'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      type: 'website',
    },
  };
}

export default function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('guides');
  const common = useTranslations('common');

  const guides = [
    {
      id: 'working-memory',
      href: '/working-memory-guide',
      title: t('workingMemory.title'),
      description: t('workingMemory.description'),
      readTime: t('workingMemory.readTime'),
      difficulty: t('workingMemory.difficulty'),
      color: 'from-indigo-500 to-blue-500',
      featured: true
    }
    // More guides can be added here in the future
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

        <div className="grid grid-cols-1 gap-8 mb-12">
          {guides.map((guide) => (
            <div
              key={guide.id}
              className={`relative group bg-gradient-to-br from-background to-muted/30 border border-border rounded-xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                guide.featured ? 'md:col-span-2 lg:col-span-3' : ''
              }`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${guide.color} opacity-5 rounded-full -mr-16 -mt-16 blur-2xl`}></div>

              <div className="flex items-start gap-6">
                <div className={`p-4 rounded-xl bg-gradient-to-br ${guide.color} flex-shrink-0`}>
                  <BookOpen className="w-8 h-8 text-white" />
                </div>

                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl font-semibold">
                      {guide.title}
                    </h2>
                    {guide.featured && (
                      <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                        {t('featured')}
                      </span>
                    )}
                  </div>

                  <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                    {guide.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="bg-muted px-3 py-1 rounded-full">
                        {guide.readTime}
                      </span>
                      <span className="bg-muted px-3 py-1 rounded-full">
                        {guide.difficulty}
                      </span>
                    </div>

                    <Link href={guide.href}>
                      <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 group">
                        {common('readGuide')}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">{t('moreGuides.title')}</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('moreGuides.description')}
          </p>
        </div>
      </div>
    </div>
  );
}
