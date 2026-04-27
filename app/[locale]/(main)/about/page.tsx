import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { generateAlternates } from '@/lib/utils';
import { use } from 'react';
import { Coffee } from 'lucide-react';
import './style.css';

const KOFI_URL = "https://ko-fi.com/freefocusgames";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: generateAlternates(locale, 'about'),
  };
}

export default function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('about');
  const tCommon = useTranslations('common');
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Breadcrumbs
        items={[
          { label: t("title") }
        ]}
      />
      
      <div className="mt-8">
        {/* Letter-style container */}
        <div className="letter-container">
          {/* Letter content */}
          <div className="letter-content">
            <h1 className="letter-title">{t('title')}</h1>
            <p className="handwriting-text">{t('content.paragraph1')}</p>
            <p className="handwriting-text">{t('content.paragraph2')}</p>
            <p className="handwriting-text">{t('content.paragraph3')}</p>
            <p className="handwriting-text">{t('content.paragraph4')}</p>
            <div className="support-note">
              <p className="handwriting-text !mb-4">{t('support.text')}</p>
              <Button asChild variant="outline" className="support-button">
                <a href={KOFI_URL} target="_blank" rel="noopener noreferrer">
                  <Coffee className="h-4 w-4" />
                  {tCommon('supportProject')}
                </a>
              </Button>
            </div>
            <p className="handwriting-text">{t('content.paragraph5')}</p>
            
            {/* Video signature */}
            <div className="video-signature">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
              >
                <source src="/logo.mp4" type="video/mp4" />
              </video>
              <p className="signature-text">- FreeFocusGames Team</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
