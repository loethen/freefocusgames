import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AdhdAssessmentFlow from './components/AdhdAssessmentFlow';
import { generateAlternates } from '@/lib/utils';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'adhdAssessment.metadata' });

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      type: 'website',
    },
    alternates: generateAlternates(locale, 'adhd-assessment'),
  };
}

export default function AdhdAssessmentPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <AdhdAssessmentFlow />
    </div>
  );
}