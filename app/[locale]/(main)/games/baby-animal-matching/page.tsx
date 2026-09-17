import { Metadata } from "next";
import BabyAnimalMatchingGame from "./components/Game";
import { GamePageTemplate } from '@/components/GamePageTemplate';
import { Brain, Eye, Search } from 'lucide-react'; // Example icons
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server'; // Import server-side translator
import { use } from 'react';
import { routing } from '@/i18n/routing';
import { generateAlternates } from '@/lib/utils';

// Define types for placeholders
interface Benefit {
    icon: React.ReactNode;
    title: string;
    description: string;
}
interface FAQItem {
    question: string;
    answer: string;
}

// Generate static params for all locales
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

// Enhanced metadata generation for better SEO
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'games.babyAnimalMatching' });

    // Load translated metadata
    const title = t('metaTitle');
    const description = t('metaDescription');
    const keywordsString = t('metaKeywords');
    const keywords = keywordsString.split(',').map((k: string) => k.trim()).filter((k: string) => k); // Split comma-separated keywords

    return {
        title,
        description,
        keywords,
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            type: "website",
            images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }], // Keep image URL static for now
        },
        twitter: {
            card: "summary_large_image",
            title: t('twitterTitle'),
            description: t('twitterDescription'),
        },
        alternates: generateAlternates(locale, 'games/baby-animal-matching'),
    };
}

export default function BabyAnimalMatchingPageContainer({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);
    // Initialize translations for the 'games.babyAnimalMatching' namespace
    const t = useTranslations('games.babyAnimalMatching');

    // Use translation keys
    const title = t('title');
    const subtitle = t('subtitle');
    const howToPlayIntro = t('howToPlayIntro');
    // Construct the steps array using translation keys
    const howToPlaySteps = [
        t('howToPlayStep1'),
        t('howToPlayStep2'),
        t('howToPlayStep3'),
        t('howToPlayStep4'),
        t('howToPlayStep5'),
        t('howToPlayStep6'),
        t('howToPlayStep7')
    ];
    // Construct the benefits array using translation keys
    const benefits: Benefit[] = [
        { icon: <Brain className="w-10 h-10" />, title: t('benefit1_title'), description: t('benefit1_desc') },
        { icon: <Eye className="w-10 h-10" />, title: t('benefit2_title'), description: t('benefit2_desc') },
        { icon: <Search className="w-10 h-10" />, title: t('benefit3_title'), description: t('benefit3_desc') }
    ];
    // Construct the FAQ array using translation keys
    const faq: FAQItem[] = [
        { question: t('faq1_question'), answer: t('faq1_answer') },
        { question: t('faq2_question'), answer: t('faq2_answer') },
        { question: t('faq3_question'), answer: t('faq3_answer') }
    ];

    return (
        <GamePageTemplate
            gameId="baby-animal-matching"
            title={title} // Use translated title
            subtitle={subtitle} // Use translated subtitle
            gameComponent={<BabyAnimalMatchingGame />}
            howToPlay={
                <>
                    <p>{howToPlayIntro}</p> {/* Use translated intro */}
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        {howToPlaySteps.map((step: string, index: number) => (
                            <li key={index}>{step}</li> // Use translated steps
                        ))}
                    </ul>
                </>
            }
            // Map directly from the constructed arrays
            benefits={benefits.map((b) => ({
                icon: b.icon,
                title: b.title,
                description: b.description
            }))}
            faq={faq.map((f) => ({
                question: f.question,
                answer: f.answer
            }))}
            relatedGames={["schulte-table", "block-memory-challenge", "reaction-time"]}
        />
    );
} 
