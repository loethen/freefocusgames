import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { generateAlternates } from '@/lib/utils';
import { CONTENT_LAST_UPDATED_EN } from '@/lib/site-constants';
import { pageLocaleParams } from '@/lib/locale-availability';

export function generateStaticParams() {
  return pageLocaleParams('terms-of-service');
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal.terms' });
  
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: generateAlternates(locale, 'terms-of-service'),
  };
}

export default function TermsOfServicePage() {
  const t = useTranslations('legal.terms');
  
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
            <strong>{t('lastUpdated')}</strong> {CONTENT_LAST_UPDATED_EN}
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('acceptance.title')}</h2>
            <p className="mb-4">{t('acceptance.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('description.title')}</h2>
            <p className="mb-4">{t('description.content')}</p>
            <p className="mb-4">{t('description.purpose')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('usage.title')}</h2>
            <p className="mb-4">{t('usage.intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('usage.personal')}</li>
              <li>{t('usage.lawful')}</li>
              <li>{t('usage.noHarm')}</li>
              <li>{t('usage.noInterference')}</li>
              <li>{t('usage.noReproduction')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('intellectual.title')}</h2>
            <p className="mb-4">{t('intellectual.ownership')}</p>
            <p className="mb-4">{t('intellectual.license')}</p>
            <p className="mb-4">{t('intellectual.restrictions')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('userContent.title')}</h2>
            <p className="mb-4">{t('userContent.description')}</p>
            <p className="mb-4">{t('userContent.responsibility')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.title')}</h2>
            <p className="mb-4">{t('privacy.reference')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('disclaimer.title')}</h2>
            <p className="mb-4">{t('disclaimer.asis')}</p>
            <p className="mb-4">{t('disclaimer.warranty')}</p>
            <p className="mb-4">{t('disclaimer.accuracy')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('limitation.title')}</h2>
            <p className="mb-4">{t('limitation.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('indemnification.title')}</h2>
            <p className="mb-4">{t('indemnification.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('termination.title')}</h2>
            <p className="mb-4">{t('termination.right')}</p>
            <p className="mb-4">{t('termination.effect')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('governing.title')}</h2>
            <p className="mb-4">{t('governing.law')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('changes.title')}</h2>
            <p className="mb-4">{t('changes.right')}</p>
            <p className="mb-4">{t('changes.notification')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('contact.title')}</h2>
            <p className="mb-4">{t('contact.description')}</p>
            <p className="text-sm text-muted-foreground">{t('contact.email')}</p>
          </section>
        </div>
      </div>
    </div>
  );
} 
