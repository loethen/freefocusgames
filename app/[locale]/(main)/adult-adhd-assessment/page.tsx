import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternates } from '@/lib/utils';
import AdultAdhdAssessmentFlow from './components/AdultAdhdAssessmentFlow';
import { pageLocaleParams } from '@/lib/locale-availability';

export function generateStaticParams() {
  return pageLocaleParams('adult-adhd-assessment');
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'adultAdhdAssessment.metadata' });

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      type: 'website',
    },
    alternates: generateAlternates(locale, 'adult-adhd-assessment'),
  };
}

export default async function AdultAdhdAssessmentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container mx-auto px-4 py-8">
      <AdultAdhdAssessmentFlow />
    </div>
  );
}
