import OnboardingFlow from "./components/OnboardingFlow";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateAlternates } from '@/lib/utils';

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

export default function GetStartedPage() {
  return <OnboardingFlow />;
}