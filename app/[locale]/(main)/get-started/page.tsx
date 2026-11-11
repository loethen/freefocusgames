import OnboardingFlow from "./components/OnboardingFlow";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateAlternates } from '@/lib/utils';
import { pageLocaleParams } from '@/lib/locale-availability';

export function generateStaticParams() {
  return pageLocaleParams('get-started');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'getStarted.meta' });

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords').split(',').map(keyword => keyword.trim()),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
    },
    alternates: generateAlternates(locale, 'get-started'),
  };
}

export default async function GetStartedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'getStarted' });

  return (
    <div className="py-6 sm:py-10">
      <OnboardingFlow
        header={
          <header className="mx-auto mb-8 max-w-3xl text-center">
            <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">{t('headline')}</h1>
            <p className="mx-auto max-w-xl text-muted-foreground">{t('intro')}</p>
          </header>
        }
      />
    </div>
  );
}
