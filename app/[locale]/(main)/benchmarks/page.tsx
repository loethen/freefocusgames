import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BenchmarkChart } from '@/components/benchmark-chart';
import LinkClickTracker from '@/components/link-click-tracker';
import { Link } from '@/i18n/navigation';
import { BENCHMARKS, NBACK_BENCHMARK, type Benchmark } from '@/lib/benchmarks';
import { SITE_BASE_URL } from '@/lib/site-constants';
import { generateAlternates } from '@/lib/utils';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'benchmarks' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: generateAlternates(locale, 'benchmarks'),
  };
}

export default async function BenchmarksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'benchmarks' });

  const formatCount = (n: number) => n.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US');
  const withUnit = (benchmark: Benchmark, value: string) => `${value} ${t(`units.${benchmark.unit}`)}`;
  const pageUrl = `${SITE_BASE_URL}${locale === 'en' ? '' : `/${locale}`}/benchmarks`;
  const faq = t.raw('faq.items') as { q: string; a: string }[];

  // Describes the published benchmarks for dataset search; individual results are never published.
  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: t('metaTitle'),
    description: t('metaDescription'),
    url: pageUrl,
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    temporalCoverage: '2026-03-08/2026-10-25',
    creator: {
      '@type': 'Organization',
      name: 'FreeFocusGames',
      url: SITE_BASE_URL,
      sameAs: ['https://github.com/loethen/freefocusgames', 'https://x.com/2also397879'],
    },
    variableMeasured: BENCHMARKS.map((benchmark) => t(`items.${benchmark.id}.name`)),
  };

  return (
    <LinkClickTracker fromPage="benchmarks" className="container mx-auto max-w-4xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
      <Breadcrumbs items={[{ label: t('title') }]} />

      <header className="mt-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('title')}</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">{t('intro')}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {t('updated')} ·{' '}
          <Link href="/methodology" className="underline underline-offset-4 hover:text-foreground">
            {t('methodLink')}
          </Link>
        </p>
      </header>

      <section aria-labelledby="summary" className="mt-10" data-link-location="benchmarks_summary">
        <h2 id="summary" className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {t('summaryTitle')}
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead className="bg-muted/70">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('table.test')}</th>
                <th className="px-4 py-3 font-semibold">{t('table.median')}</th>
                <th className="px-4 py-3 font-semibold">{t('table.top10')}</th>
                <th className="px-4 py-3 text-right font-semibold">{t('table.players')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {BENCHMARKS.map((benchmark) => (
                <tr key={benchmark.id}>
                  <td className="px-4 py-3 font-medium">
                    <a href={`#${benchmark.id}`} className="hover:underline">{t(`items.${benchmark.id}.name`)}</a>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{withUnit(benchmark, benchmark.median)}</td>
                  <td className="px-4 py-3 tabular-nums">{withUnit(benchmark, benchmark.top10)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatCount(benchmark.players)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-12 space-y-14">
        {BENCHMARKS.map((benchmark) => (
          <section
            key={benchmark.id}
            id={benchmark.id}
            aria-labelledby={`${benchmark.id}-heading`}
            className="scroll-mt-24"
            data-link-location={`benchmarks_${benchmark.id}`}
          >
            <h2 id={`${benchmark.id}-heading`} className="text-2xl font-bold tracking-tight">
              {t(`items.${benchmark.id}.heading`)}
            </h2>
            <p className="mt-3 leading-7 text-foreground/85">{t(`items.${benchmark.id}.text`)}</p>

            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: t('stats.median'), value: withUnit(benchmark, benchmark.median) },
                { label: t('stats.top10'), value: withUnit(benchmark, benchmark.top10) },
                ...(benchmark.top1 ? [{ label: t('stats.top1'), value: withUnit(benchmark, benchmark.top1) }] : []),
                { label: t('stats.players'), value: formatCount(benchmark.players) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-muted/50 px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums">{stat.value}</dd>
                </div>
              ))}
            </dl>

            <figure className="mt-5 rounded-xl border border-border p-4 sm:p-6">
              <BenchmarkChart
                benchmark={benchmark}
                axisLabel={t(`items.${benchmark.id}.axis`)}
                ariaLabel={t(`items.${benchmark.id}.aria`)}
              />
              <figcaption className="mt-3 text-xs leading-5 text-muted-foreground">
                {t(`items.${benchmark.id}.note`)}
              </figcaption>
            </figure>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={benchmark.game}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                {t('actions.play')}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                href={benchmark.article}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                {t('actions.article')}
              </Link>
            </div>
          </section>
        ))}

        <section id="dualNBack" aria-labelledby="nback-heading" className="scroll-mt-24" data-link-location="benchmarks_nback">
          <h2 id="nback-heading" className="text-2xl font-bold tracking-tight">{t('nback.heading')}</h2>
          <p className="mt-3 leading-7 text-foreground/85">{t('nback.text')}</p>
          <div className="mt-5 overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-muted/70">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t('nback.level')}</th>
                  <th className="px-4 py-3 font-semibold">{t('nback.share')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {NBACK_BENCHMARK.levels.map((row) => (
                  <tr key={row.level}>
                    <td className="px-4 py-3 font-medium">{row.level}-back</td>
                    <td className="px-4 py-3 tabular-nums">{t('nback.atLeast', { share: row.share })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {t('nback.accuracy', { accuracy: NBACK_BENCHMARK.medianAccuracy })}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={NBACK_BENCHMARK.game}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t('actions.play')}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              href={NBACK_BENCHMARK.article}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              {t('actions.article')}
            </Link>
          </div>
        </section>

        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-2xl font-bold tracking-tight">{t('faq.title')}</h2>
          <dl className="mt-5 space-y-5">
            {faq.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold">{item.q}</dt>
                <dd className="mt-1 leading-7 text-foreground/85">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="border-t border-border pt-6 text-sm text-muted-foreground">
          {t('cite')}{' '}
          <Link href="/methodology#cite" className="underline underline-offset-4 hover:text-foreground">
            {t('methodLink')}
          </Link>
        </p>
      </div>
    </LinkClickTracker>
  );
}
