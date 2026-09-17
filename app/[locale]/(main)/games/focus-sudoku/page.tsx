import { Metadata } from 'next';
import { GamePageTemplate } from '@/components/GamePageTemplate';
import FocusSudokuClient from './components/FocusSudokuClient';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { generateAlternates } from '@/lib/utils';

// Generate static params for all locales
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'games.focusSudoku' });

    return {
        title: t('title'),
        description: t('subtitle'),
        openGraph: {
            title: t('title'),
            description: t('subtitle'),
            images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
        },
        alternates: generateAlternates(locale, 'games/focus-sudoku'),
    };
}

// Server component wrapper that imports client component
export default async function FocusSudokuPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'games.focusSudoku' });

    const howToPlayContent = (
        <div className="space-y-4">
            <div>
                <h4 className="font-bold text-slate-900">{t('howToPlay.objectiveTitle')}</h4>
                <p>{t('howToPlay.objectiveContent')}</p>
            </div>
            <div>
                <h4 className="font-bold text-slate-900">{t('howToPlay.rulesTitle')}</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li dangerouslySetInnerHTML={{ __html: t.raw('howToPlay.rule1') }} />
                    <li dangerouslySetInnerHTML={{ __html: t.raw('howToPlay.rule2') }} />
                    <li dangerouslySetInnerHTML={{ __html: t.raw('howToPlay.rule3') }} />
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-slate-900">{t('howToPlay.tipsTitle')}</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li dangerouslySetInnerHTML={{ __html: t.raw('howToPlay.tip1') }} />
                    <li dangerouslySetInnerHTML={{ __html: t.raw('howToPlay.tip2') }} />
                    <li dangerouslySetInnerHTML={{ __html: t.raw('howToPlay.tip3') }} />
                </ul>
            </div>
        </div>
    );

    return (
        <GamePageTemplate
            gameId="focus-sudoku"
            title={t('title')}
            subtitle={t('subtitle')}
            gameComponent={<FocusSudokuClient />}
            howToPlay={howToPlayContent}
            benefits={[
                {
                    title: t('benefits.wmTitle'),
                    description: t('benefits.wmDesc'),
                    icon: <span className="text-2xl">🧠</span>
                },
                {
                    title: t('benefits.logicTitle'),
                    description: t('benefits.logicDesc'),
                    icon: <span className="text-2xl">🔍</span>
                }
            ]}
        />
    );
}
