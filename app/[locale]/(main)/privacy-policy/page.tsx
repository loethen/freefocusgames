import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { use } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { generateAlternates } from '@/lib/utils';
import { CONTENT_LAST_UPDATED_DATE } from '@/lib/site-constants';
import { getLocaleMeta } from '@/lib/locale-meta';
import { pageLocaleParams } from '@/lib/locale-availability';

export function generateStaticParams() {
  return pageLocaleParams('privacy-policy');
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal.privacy' });
  
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: generateAlternates(locale, 'privacy-policy'),
  };
}

export default function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  // Without this the statically rendered body falls back to English.
  setRequestLocale(locale);
  const t = useTranslations('legal.privacy');
  const lastUpdated = CONTENT_LAST_UPDATED_DATE.toLocaleDateString(getLocaleMeta(locale).intl, {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Breadcrumbs
        items={[
          { label: t("title") }
        ]}
      />
      
      <div className="mt-8">
        <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-muted-foreground mb-8">
            <strong>{t('lastUpdated')}</strong> {lastUpdated}
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('overview.title')}</h2>
            <p className="mb-4">{t('overview.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('dataCollection.title')}</h2>
            <p className="mb-4">{t('dataCollection.intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('dataCollection.analytics')}</li>
              <li>{t('dataCollection.technical')}</li>
              <li>{t('dataCollection.cookies')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('thirdParty.title')}</h2>
            <div className="mb-4">
              <h3 className="text-xl font-medium mb-2">{t('thirdParty.googleAnalytics.title')}</h3>
              <p className="mb-2">{t('thirdParty.googleAnalytics.description')}</p>
              <p className="text-sm">
                <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  {t('thirdParty.googleAnalytics.link')}
                </a>
              </p>
            </div>
            <div className="mb-4">
              <h3 className="text-xl font-medium mb-2">{t('thirdParty.cloudflare.title')}</h3>
              <p className="mb-2">{t('thirdParty.cloudflare.description')}</p>
              <p className="text-sm">
                <a href="https://www.cloudflare.com/privacy/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  {t('thirdParty.cloudflare.link')}
                </a>
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('dataUse.title')}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('dataUse.improve')}</li>
              <li>{t('dataUse.monitor')}</li>
              <li>{t('dataUse.security')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('cookies.title')}</h2>
            <p className="mb-4">{t('cookies.description')}</p>
            <p className="mb-4">{t('cookies.control')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('userRights.title')}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('userRights.access')}</li>
              <li>{t('userRights.correct')}</li>
              <li>{t('userRights.delete')}</li>
              <li>{t('userRights.optOut')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('contact.title')}</h2>
            <p className="mb-4">{t('contact.description')}</p>
            <p className="text-sm text-muted-foreground">{t('contact.email')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('changes.title')}</h2>
            <p>{t('changes.description')}</p>
          </section>
        </div>
      </div>
    </div>
  );
} 
