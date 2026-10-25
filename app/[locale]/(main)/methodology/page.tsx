import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { use } from 'react';
import { generateAlternates } from '@/lib/utils';
import { Link } from '@/i18n/navigation';

const SOURCE_URL = 'https://github.com/loethen/freefocusgames';

// Benchmarks published in articles, in the order of the filter table.
const BENCHMARKS = [
  { key: 'reaction', article: '/blog/what-is-a-good-reaction-time' },
  { key: 'schulte', article: '/blog/what-is-a-good-schulte-table-time' },
  { key: 'cps', article: '/blog/what-is-a-good-cps-test-score' },
  { key: 'tenSeconds', article: '/blog/10-seconds-challenge-viral-game' },
  { key: 'nback', article: '/blog/interactive-dual-n-back-tutorial-complete-guide' },
  { key: 'digitSpan', article: '/blog/digit-span-test-explained' },
  { key: 'trail', article: '/blog/trail-making-test-explained' },
] as const;

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'methodology' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: generateAlternates(locale, 'methodology'),
  };
}

export default function MethodologyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('methodology');

  const list = (key: string) => (
    <ul className="list-disc pl-6 space-y-2">
      {(t.raw(key) as string[]).map((item) => <li key={item}>{item}</li>)}
    </ul>
  );

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Breadcrumbs items={[{ label: t('title') }]} />

      <div className="mt-8">
        <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-muted-foreground mb-8">{t('intro')}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('record.title')}</h2>
            <p className="mb-4">{t('record.intro')}</p>
            {list('record.items')}
            <p className="mt-4">{t('record.note')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('counting.title')}</h2>
            {list('counting.items')}
          </section>

          <section id="filters" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold mb-4">{t('filters.title')}</h2>
            <p className="mb-4">{t('filters.intro')}</p>
            <div className="not-prose overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead className="bg-muted/70">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{t('filters.headTest')}</th>
                    <th className="px-4 py-3 font-semibold">{t('filters.headScore')}</th>
                    <th className="px-4 py-3 font-semibold">{t('filters.headExcluded')}</th>
                    <th className="px-4 py-3 font-semibold">{t('filters.headArticle')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {BENCHMARKS.map(({ key, article }) => (
                    <tr key={key}>
                      <td className="px-4 py-3 font-medium text-foreground">{t(`filters.rows.${key}.test`)}</td>
                      <td className="px-4 py-3 text-foreground/85">{t(`filters.rows.${key}.score`)}</td>
                      <td className="px-4 py-3 text-foreground/85">{t(`filters.rows.${key}.excluded`)}</td>
                      <td className="px-4 py-3">
                        <Link href={article} className="text-blue-600 hover:underline dark:text-blue-400">
                          {t('filters.read')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('limits.title')}</h2>
            {list('limits.items')}
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('updates.title')}</h2>
            <p>{t('updates.content')}</p>
          </section>

          <section id="cite" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold mb-4">{t('cite.title')}</h2>
            <p className="mb-4">{t('cite.content')}</p>
            <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">{t('cite.example')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('openSource.title')}</h2>
            <p>
              {t.rich('openSource.content', {
                github: (chunks) => (
                  <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
