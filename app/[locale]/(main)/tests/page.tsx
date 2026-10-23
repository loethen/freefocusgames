import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { generateAlternates } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import LinkClickTracker from '@/components/link-click-tracker';
import { ArrowRight, Baby, BriefcaseBusiness, Hash, ListChecks, Route, UserRound, Zap, type LucideIcon } from 'lucide-react';
import { use } from 'react';

interface TestItem {
  id: string;
  href: string;
  icon: LucideIcon;
}

const COGNITIVE_TESTS: TestItem[] = [
  { id: 'trailMaking', href: '/games/trail-making-test', icon: Route },
  { id: 'digitSpan', href: '/games/digit-span-test', icon: Hash },
  { id: 'shortTermMemory', href: '/games/free-short-term-memory-test', icon: ListChecks },
  { id: 'reactionTime', href: '/games/reaction-time', icon: Zap },
];

const ADHD_TESTS: TestItem[] = [
  { id: 'childAdhd', href: '/adhd-assessment', icon: Baby },
  { id: 'adultAdhd', href: '/adult-adhd-assessment', icon: UserRound },
];

const CAREER_TESTS: TestItem[] = [
  { id: 'career', href: '/career-tests', icon: BriefcaseBusiness },
];

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

  // Rows rise in one after another across all sections.
  let rowIndex = 0;

  const sections = [
    { id: 'cognitive', items: COGNITIVE_TESTS },
    { id: 'adhd', items: ADHD_TESTS, note: t('screeningNote') },
    // Career tests are English-only.
    ...(locale === 'en' ? [{ id: 'career', items: CAREER_TESTS }] : []),
  ];

  return (
    <LinkClickTracker fromPage="tests" className="mx-auto max-w-4xl px-0 py-8">
      <Breadcrumbs items={[{ label: t('title') }]} />

      <header className="mx-auto mt-10 mb-12 max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t('title')}</h1>
        <p className="mt-4 leading-7 text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`tests-${section.id}`} data-link-location={`tests_${section.id}`}>
            <h2 id={`tests-${section.id}`} className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t(`sections.${section.id}`)}
            </h2>
            <ul className="flex flex-col gap-1 rounded-[2rem] bg-muted/50 p-2">
              {section.items.map(({ id, href, icon: Icon }) => (
                <li key={id} className="tests-rise" style={{ animationDelay: `${(0.08 * rowIndex++).toFixed(2)}s` }}>
                  <Link
                    href={href}
                    className="group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-colors hover:bg-background/80 focus-visible:bg-background/80 focus-visible:outline-none sm:px-5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-foreground/70 shadow-sm transition-[color,transform] duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:text-foreground motion-reduce:transition-none motion-reduce:group-hover:transform-none">
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <h3 className="text-base font-semibold tracking-tight">{t(`items.${id}.title`)}</h3>
                      <span className="line-clamp-2 text-sm text-muted-foreground">{t(`items.${id}.description`)}</span>
                    </span>
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{t(`items.${id}.meta`)}</span>
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
            {section.note && (
              <p className="mt-3 px-2 text-xs leading-5 text-muted-foreground">{section.note}</p>
            )}
          </section>
        ))}
      </div>

      <p className="mt-14 text-center text-sm text-muted-foreground" data-link-location="tests_game_picker">
        {t('pickerPrompt')}{' '}
        <Link href="/get-started" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
          {t('pickerLink')}
        </Link>
      </p>
    </LinkClickTracker>
  );
}
