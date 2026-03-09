/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from "next";
import { generateAlternates } from "@/lib/utils";
import { Game, games } from "@/data/games";
import { FloatingNavigation } from "./components/FloatingNavigation";
import GameCard from "@/components/game-card";
import "./styles.css";
import { useTranslations } from "next-intl";
import { TrainingEffectChart } from "./components/TrainingEffectChart";
import { BrainRegionsDiagram } from "./components/BrainRegionsDiagram";
import { TrainingScheduleTable } from "./components/TrainingScheduleTable";
import { CONTENT_LAST_UPDATED_ISO } from "@/lib/site-constants";
import { routing } from "@/i18n/routing";

type TWorkingMemoryT = ReturnType<typeof useTranslations<"workingMemoryGuide">>;

export const dynamic = "force-static";
export const revalidate = 86400;

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'workingMemoryGuide' });

    return {
        title: t('metaTitle'),
        description: t('metaDescription'),
        keywords: t('metaKeywords').split(','),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            type: "article",
        },
        alternates: generateAlternates(locale, "/working-memory-guide"),
        other: {
            'script:ld+json': JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": t('metaTitle'),
                "description": t('metaDescription'),
                "image": "https://freefocusgames.com/og/oglogo.png",
                "datePublished": "2024-01-01",
                "dateModified": CONTENT_LAST_UPDATED_ISO,
                "author": {
                    "@type": "Organization",
                    "name": "Free Focus Games Team"
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "Free Focus Games",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://freefocusgames.com/logo.png"
                    }
                }
            })
        }
    };
}

export default async function WorkingMemoryGuide({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'workingMemoryGuide' });

    const relatedGames = games.filter(game =>
        game.slug === 'dual-n-back' ||
        game.slug === 'schulte-table' ||
        game.slug === 'free-short-term-memory-test'
    );

    return (
        <div className="min-h-screen">
            <nav className="max-w-7xl mx-auto px-4 py-4 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground">{t('breadcrumbHome')}</Link>
                <span className="mx-2">/</span>
                <span>{t('breadcrumbCurrent')}</span>
            </nav>

            <div className="max-w-5xl mx-auto px-4 lg:px-8">
                <main className="max-w-none">
                    <HeroSection t={t} />
                    <ContentSections t={t} />
                    <RelatedGamesSection t={t} games={relatedGames} />
                    <ClusterArticlesSection t={t} />
                </main>
            </div>

            <FloatingNavigation />
        </div>
    );
}

function HeroSection({ t }: { t: TWorkingMemoryT }) {
    const titleParts = t("title").split(":");
    return (
        <section className="py-16 mb-16 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-full bg-gradient-to-b from-muted/30 to-background -z-10" />

            <div className="text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    {t('metaKeywords').split(',')[0]}
                </div>

                <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
                    {titleParts[0]}
                    {titleParts[1] && <span className="text-muted-foreground font-normal block mt-2 text-2xl lg:text-3xl">{titleParts.slice(1).join(":")}</span>}
                </h1>

                <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
                    {t("subtitle")}
                </p>

                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        15 min read
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Science Based
                    </div>
                </div>
            </div>
        </section>
    );
}

function ContentSections({ t }: { t: TWorkingMemoryT }) {
    return (
        <article className="prose prose-lg dark:prose-invert max-w-none mb-16">
            {/* Introduction Section */}
            <section id="introduction" className="mb-20 content-section">
                <h2 className="text-3xl font-bold mb-8 text-foreground flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                    {t("introduction.title")}
                </h2>
                <div id="introduction-0" className="mb-12">
                    <h3 className="text-2xl font-semibold mb-6">
                        {t("introduction.whatIs.title")}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
                        {t("introduction.whatIs.p1")}
                    </p>
                    <div className="highlight-box">
                        <h4 className="font-semibold mb-6 text-lg text-center">
                            {t("introduction.whatIs.analogy.workbench.title")}
                        </h4>

                        {/* Mental Workbench Analogy Image */}
                        <div className="mb-10 flex justify-center">
                            <div className="relative w-full max-w-2xl bg-white rounded-xl overflow-hidden shadow-sm border border-border/50">
                                <Image
                                    src="/working-memory-analogy.png"
                                    alt="Mental Workbench Analogy"
                                    width={800}
                                    height={400}
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-background/50 border border-border p-5 rounded-xl transition-all hover:bg-muted/30 hover:border-primary/20 hover:shadow-sm">
                                <h5 className="font-semibold mb-2 text-foreground">
                                    {t("introduction.whatIs.analogy.workbench.title")}
                                </h5>
                                <p className="text-sm text-muted-foreground">
                                    {t("introduction.whatIs.analogy.workbench.p")}
                                </p>
                            </div>
                            <div className="bg-background/50 border border-border p-5 rounded-xl transition-all hover:bg-muted/30 hover:border-primary/20 hover:shadow-sm">
                                <h5 className="font-semibold mb-2 text-foreground">
                                    {t("introduction.whatIs.analogy.limited.title")}
                                </h5>
                                <p className="text-sm text-muted-foreground">
                                    {t("introduction.whatIs.analogy.limited.p")}
                                </p>
                            </div>
                            <div className="bg-background/50 border border-border p-5 rounded-xl transition-all hover:bg-muted/30 hover:border-primary/20 hover:shadow-sm">
                                <h5 className="font-semibold mb-2 text-foreground">
                                    {t("introduction.whatIs.analogy.processing.title")}
                                </h5>
                                <p className="text-sm text-muted-foreground">
                                    {t("introduction.whatIs.analogy.processing.p")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="introduction-1" className="mb-12">
                    <h3 className="text-2xl font-semibold mb-6">
                        {t("introduction.neuroscience.title")}
                    </h3>
                    <p
                        className="text-muted-foreground leading-relaxed mb-6"
                        dangerouslySetInnerHTML={{
                            __html: t.raw("introduction.neuroscience.p1"),
                        }}
                    />
                    <div className="bg-muted/10 border border-border p-8 rounded-xl">
                        <div className="grid lg:grid-cols-2 gap-8 items-center">
                            <div>
                                <h4 className="font-semibold mb-4 text-lg">
                                    {t("introduction.neuroscience.keyAreas.title")}
                                </h4>
                                <ul className="space-y-4 text-sm">
                                    {[1, 2, 3, 4].map((num) => (
                                        <li key={num} className="flex gap-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                            <span dangerouslySetInnerHTML={{
                                                __html: t.raw(`introduction.neuroscience.keyAreas.li${num}` as any)
                                            }} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-background rounded-lg p-4 border border-border/50">
                                <BrainRegionsDiagram />
                            </div>
                        </div>
                    </div>
                </div>
                <div id="introduction-2" className="mb-12">
                    <h3 className="text-2xl font-semibold mb-6">
                        {t("introduction.dailyImpact.title")}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-8">
                        {t("introduction.dailyImpact.p1")}
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="group bg-card hover:bg-muted/20 border border-transparent hover:border-border transition-all p-6 rounded-xl">
                            <div className="mb-4 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-foreground mb-4 text-lg">
                                {t("introduction.dailyImpact.academic.title")}
                            </h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {[1, 2, 3, 4].map((num) => (
                                    <li key={num} className="flex gap-2">
                                        <span>•</span>
                                        {t(`introduction.dailyImpact.academic.li${num}` as any)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="group bg-card hover:bg-muted/20 border border-transparent hover:border-border transition-all p-6 rounded-xl">
                            <div className="mb-4 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-foreground mb-4 text-lg">
                                {t("introduction.dailyImpact.workplace.title")}
                            </h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {[1, 2, 3, 4].map((num) => (
                                    <li key={num} className="flex gap-2">
                                        <span>•</span>
                                        {t(`introduction.dailyImpact.workplace.li${num}` as any)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dual N-Back Section */}
            <section id="dual-n-back" className="mb-20 content-section">
                <h2 className="text-3xl font-bold mb-8 text-foreground flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                    {t("dnb.title")}
                </h2>
                <div id="dual-n-back-0" className="mb-12">
                    <h3 className="text-2xl font-semibold mb-6">
                        {t("dnb.jaeggiStudy.title")}
                    </h3>
                    <p
                        className="text-muted-foreground leading-relaxed mb-6"
                        dangerouslySetInnerHTML={{
                            __html: t.raw("dnb.jaeggiStudy.p1"),
                        }}
                    />
                    <div className="bg-muted/10 border border-border p-8 rounded-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <h4 className="font-semibold text-lg">
                                {t("dnb.jaeggiStudy.coreFindings.title")}
                            </h4>
                            <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium">Seminal Study</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h5 className="font-medium text-foreground flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/40"></span>
                                    {t("dnb.jaeggiStudy.coreFindings.design.title")}
                                </h5>
                                <ul className="space-y-2 text-sm text-muted-foreground pl-4 border-l-2 border-border">
                                    {[1, 2, 3, 4].map((num) => (
                                        <li key={num}>{t(`dnb.jaeggiStudy.coreFindings.design.li${num}` as any)}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h5 className="font-medium text-foreground flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/40"></span>
                                    {t("dnb.jaeggiStudy.coreFindings.results.title")}
                                </h5>
                                <ul className="space-y-2 text-sm text-muted-foreground pl-4 border-l-2 border-border">
                                    {[1, 2, 3, 4].map((num) => (
                                        <li key={num}>{t(`dnb.jaeggiStudy.coreFindings.results.li${num}` as any)}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Training Effect Chart */}
                        <div className="mt-10 bg-background rounded-lg p-6 border border-border/50">
                            <TrainingEffectChart />
                        </div>
                    </div>
                </div>
                <div id="dual-n-back-1" className="mb-12">
                    <h3 className="text-2xl font-semibold mb-6">
                        {t("dnb.mechanism.title")}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-8">
                        {t("dnb.mechanism.p1")}
                    </p>
                    <div className="space-y-4">
                        {[1, 2, 3].map((num) => (
                            <div key={num} className="bg-card border border-border p-6 rounded-xl hover:border-primary/30 transition-colors">
                                <div className="flex flex-col md:flex-row gap-4 md:items-start">
                                    <div className="flex-grow">
                                        <h4 className="font-semibold mb-2 text-lg">
                                            {t(`dnb.mechanism.card${num}.title` as any)}
                                        </h4>
                                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                                            {t(`dnb.mechanism.card${num}.p` as any)}
                                        </p>
                                        <div
                                            className="text-xs text-muted-foreground/80 bg-muted/30 p-2 rounded"
                                            dangerouslySetInnerHTML={{
                                                __html: t.raw(`dnb.mechanism.card${num}.details` as any),
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div id="dual-n-back-2" className="mb-12">
                    <h3 className="text-2xl font-semibold mb-6">
                        {t("dnb.neuroplasticity.title")}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        {['structural', 'functional'].map((type) => (
                            <div key={type} className="bg-card border border-border rounded-xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
                                </div>
                                <h4 className="font-semibold mb-4 text-foreground text-lg z-10 relative">
                                    {t(`dnb.neuroplasticity.${type}.title` as any)}
                                </h4>
                                <ul className="space-y-3 text-sm z-10 relative">
                                    {[1, 2, 3].map((num) => (
                                        <li key={num} className="flex gap-2">
                                            <span className="text-primary">•</span>
                                            {t(`dnb.neuroplasticity.${type}.li${num}` as any)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div id="dual-n-back-3" className="mb-12">
                    <h3 className="text-2xl font-semibold mb-6">
                        {t("dnb.protocol.title")}
                    </h3>
                    <div className="bg-gradient-to-br from-muted/30 to-background border border-border p-8 rounded-xl">
                        <h4 className="font-semibold mb-8 text-center text-xl">
                            {t("dnb.protocol.boxTitle")}
                        </h4>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { key: 'params', icon: '⚡' },
                                { key: 'expectations', icon: '📈' },
                                { key: 'successFactors', icon: '🔑' }
                            ].map((section) => (
                                <div key={section.key}>
                                    <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                                        <span className="text-xl">{section.icon}</span>
                                        <h5 className="font-medium text-foreground">
                                            {t(`dnb.protocol.${section.key}.title` as any)}
                                        </h5>
                                    </div>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        {[1, 2, 3, 4].map((num) => (
                                            <li key={num} className="text-center md:text-left">
                                                {t(`dnb.protocol.${section.key}.li${num}` as any)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Schulte Table Section */}
            <section id="schulte-table" className="mb-20 content-section">
                <h2 className="text-3xl font-bold mb-8 text-foreground flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                    {t("schulte.title")}
                </h2>
                <div id="schulte-table-0" className="mb-12">
                    <div className="grid md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((num) => (
                            <div key={num} className="bg-background border border-border hover:border-primary/40 p-6 rounded-xl transition-all">
                                <div className="text-4xl font-bold text-muted/20 mb-2">0{num}</div>
                                <h4 className="font-semibold mb-3 text-lg">
                                    {t(`schulte.posnerTheory.card${num}.title` as any)}
                                </h4>
                                <p className="text-sm mb-4 text-muted-foreground">
                                    {t(`schulte.posnerTheory.card${num}.p` as any)}
                                </p>
                                <div
                                    className="text-xs text-muted-foreground/75 pt-4 border-t border-border/50"
                                    dangerouslySetInnerHTML={{
                                        __html: t.raw(`schulte.posnerTheory.card${num}.details` as any),
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div id="schulte-table-1" className="mb-12">
                    <h3 className="text-2xl font-semibold mb-6">
                        {t("schulte.readingSpeed.title")}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-card border border-border p-6 rounded-xl">
                            <h4 className="font-semibold mb-4 text-lg border-b border-border/50 pb-2">
                                {t("schulte.readingSpeed.russiaStudy.title")}
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <h5 className="font-medium text-sm text-muted-foreground mb-2">{t("schulte.readingSpeed.russiaStudy.visual.title")}</h5>
                                    <ul className="text-sm space-y-1 pl-3 border-l-2 border-primary/20" dangerouslySetInnerHTML={{ __html: t.raw("schulte.readingSpeed.russiaStudy.visual.list") }} />
                                </div>
                                <div>
                                    <h5 className="font-medium text-sm text-muted-foreground mb-2">{t("schulte.readingSpeed.russiaStudy.reading.title")}</h5>
                                    <ul className="text-sm space-y-1 pl-3 border-l-2 border-primary/20" dangerouslySetInnerHTML={{ __html: t.raw("schulte.readingSpeed.russiaStudy.reading.list") }} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-card border border-border p-6 rounded-xl">
                            <h4 className="font-semibold mb-4 text-lg border-b border-border/50 pb-2">
                                {t("schulte.readingSpeed.psychologyStudy.title")}
                            </h4>
                            <p className="text-sm mb-4">{t("schulte.readingSpeed.psychologyStudy.p1")}</p>
                            <ul className="text-sm space-y-2 pl-3" dangerouslySetInnerHTML={{ __html: t.raw("schulte.readingSpeed.psychologyStudy.list") }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Memory Improvement Section */}
            <section id="memory-improvement" className="mb-20 content-section">
                <h2 className="text-3xl font-bold mb-8 text-foreground flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                    {t("memory.title")}
                </h2>
                <div className="bg-muted/10 border border-border rounded-xl p-8">
                    <div className="grid md:grid-cols-2 gap-10">
                        <div>
                            <h3 className="text-2xl font-semibold mb-4">{t("memory.hippocampus.title")}</h3>
                            <p className="text-muted-foreground leading-relaxed mb-6">{t("memory.hippocampus.p1")}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((num) => (
                                <div key={num} className="bg-background p-4 rounded-lg border border-border/50">
                                    <h5 className="font-semibold text-foreground text-sm mb-1">{t(`memory.hippocampus.causes.cause${num}.title` as any)}</h5>
                                    <p className="text-xs text-muted-foreground">{t(`memory.hippocampus.causes.cause${num}.p` as any)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Training Protocol Section */}
            <section id="training-protocol" className="mb-20 content-section">
                <h2 className="text-3xl font-bold mb-8 text-foreground flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                    {t("trainingProtocol.title")}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {['beginner', 'advanced'].map((level) => (
                        <div key={level} className={`border p-6 rounded-xl relative ${level === 'advanced' ? 'bg-primary/5 border-primary/20' : 'bg-background border-border'}`}>
                            {level === 'advanced' && <span className="absolute top-4 right-4 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">PRO</span>}
                            <h4 className="font-semibold mb-6 text-xl">
                                {t(`trainingProtocol.personalized.${level}.title` as any)}
                            </h4>
                            <div className="space-y-6">
                                <div>
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("trainingProtocol.personalized.audience")}</div>
                                    <p className="text-sm">{t(`trainingProtocol.personalized.${level}.audience` as any)}</p>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("trainingProtocol.personalized.focus")}</div>
                                    <ul className="text-sm space-y-1" dangerouslySetInnerHTML={{ __html: t.raw(`trainingProtocol.personalized.${level}.focus` as any) }} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("trainingProtocol.personalized.effect")}</div>
                                    <p className="text-sm">{t(`trainingProtocol.personalized.${level}.effect` as any)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Training Schedule Table */}
                <div className="mt-12">
                    <TrainingScheduleTable />
                </div>
            </section>

            {/* Research Evidence Section */}
            <section id="research-evidence" className="mb-16 content-section">
                <h2 className="text-3xl font-bold mb-8 text-foreground flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                    {t("research.title")}
                </h2>
                <div id="research-evidence-0" className="mb-10">
                    <h3 className="text-2xl font-semibold mb-6">
                        {t("research.milestones.title")}
                    </h3>
                    <div className="space-y-6">
                        <div className="bg-muted/10 p-6 rounded-lg border border-border">
                            <h4 className="font-semibold mb-4 text-foreground">
                                {t("research.milestones.jaeggi.title")}
                            </h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h5 className="font-medium mb-2">
                                        {t("research.milestones.design")}
                                    </h5>
                                    <ul
                                        className="text-sm space-y-1 text-muted-foreground"
                                        dangerouslySetInnerHTML={{
                                            __html: t.raw(
                                                "research.milestones.jaeggi.design"
                                            ),
                                        }}
                                    />
                                </div>
                                <div>
                                    <h5 className="font-medium mb-2">
                                        {t("research.milestones.findings")}
                                    </h5>
                                    <ul
                                        className="text-sm space-y-1 text-muted-foreground"
                                        dangerouslySetInnerHTML={{
                                            __html: t.raw(
                                                "research.milestones.jaeggi.findings"
                                            ),
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-card border border-border p-6 rounded-lg">
                            <h4 className="font-semibold mb-4 text-foreground">
                                {t("research.milestones.erickson.title")}
                            </h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h5 className="font-medium mb-2">
                                        {t("research.milestones.background")}
                                    </h5>
                                    <p className="text-sm mb-2 text-muted-foreground">
                                        {t(
                                            "research.milestones.erickson.background"
                                        )}
                                    </p>
                                    <ul
                                        className="text-sm space-y-1 text-muted-foreground"
                                        dangerouslySetInnerHTML={{
                                            __html: t.raw(
                                                "research.milestones.erickson.design"
                                            ),
                                        }}
                                    />
                                </div>
                                <div>
                                    <h5 className="font-medium mb-2">
                                        {t("research.milestones.findings")}
                                    </h5>
                                    <ul
                                        className="text-sm space-y-1 text-muted-foreground"
                                        dangerouslySetInnerHTML={{
                                            __html: t.raw(
                                                "research.milestones.erickson.findings"
                                            ),
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </article>
    );
}

function RelatedGamesSection({
    t,
    games,
}: {
    t: TWorkingMemoryT;
    games: Game[];
}) {
    return (
        <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-foreground">
                {t("relatedGames.title")}
            </h2>
            <p className="text-center text-muted-foreground mb-10 text-lg">
                {t("relatedGames.subtitle")}
            </p>
            <div className="grid md:grid-cols-3 gap-8">
                {games.map((game) => (
                    <GameCard
                        key={game.id}
                        game={game}
                        preview={game.preview}
                    />
                ))}
            </div>

            <div className="mt-12 bg-card border p-8 rounded-xl">
                <h3 className="text-xl font-bold mb-4 text-center">
                    {t("protocol.box.title")}
                </h3>
                <div className="grid md:grid-cols-3 gap-6 text-sm">
                    <div className="text-center">
                        <div className="text-2xl mb-2">⏰</div>
                        <h4 className="font-semibold mb-2">
                            {t("protocol.box.duration.title")}
                        </h4>
                        <p className="text-muted-foreground">
                            {t("protocol.box.duration.p")}
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl mb-2">📈</div>
                        <h4 className="font-semibold mb-2">
                            {t("protocol.box.progress.title")}
                        </h4>
                        <p className="text-muted-foreground">
                            {t("protocol.box.progress.p")}
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl mb-2">🎯</div>
                        <h4 className="font-semibold mb-2">
                            {t("protocol.box.principles.title")}
                        </h4>
                        <p className="text-muted-foreground">
                            {t("protocol.box.principles.p")}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

function ClusterArticlesSection({ t }: { t: TWorkingMemoryT }) {
    const articles = [
        {
            title: t("clusterArticles.article1.title"),
            description: t("clusterArticles.article1.description"),
            slug: "the-science-behind-n-back-training-boost-working-memory",
            highlights: t("clusterArticles.article1.highlights").split(","),
            tag: t("clusterArticles.article1.tag"),
            readTime: t("clusterArticles.article1.readTime"),
            difficulty: t("clusterArticles.article1.difficulty"),
        },
        {
            title: t("clusterArticles.article2.title"),
            description: t("clusterArticles.article2.description"),
            slug: "the-science-of-schulte-tables-boost-visual-attention-reading-speed",
            highlights: t("clusterArticles.article2.highlights").split(","),
            tag: t("clusterArticles.article2.tag"),
            readTime: t("clusterArticles.article2.readTime"),
            difficulty: t("clusterArticles.article2.difficulty"),
        },
        {
            title: t("clusterArticles.article3.title"),
            description: t("clusterArticles.article3.description"),
            slug: "how-to-improve-short-term-memory",
            highlights: t("clusterArticles.article3.highlights").split(","),
            tag: t("clusterArticles.article3.tag"),
            readTime: t("clusterArticles.article3.readTime"),
            difficulty: t("clusterArticles.article3.difficulty"),
        },
    ];

    return (
        <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-foreground">
                {t("clusterArticles.title")}
            </h2>
            <p className="text-center text-muted-foreground mb-10 text-lg">
                {t("clusterArticles.subtitle")}
            </p>

            <div className="grid md:grid-cols-1 gap-6">
                {articles.map((article, index) => (
                    <Link key={article.slug} href={`/blog/${article.slug}`}>
                        <article className="group bg-card border rounded-lg p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">
                                            {index === 0
                                                ? "🎯"
                                                : index === 1
                                                    ? "👁️"
                                                    : "🔬"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-medium text-primary px-2 py-1 bg-primary/10 rounded">
                                            {article.tag}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {article.readTime}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            • {article.difficulty}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                        {article.title}
                                    </h3>

                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                        {article.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {article.highlights
                                            .slice(0, 3)
                                            .map((highlight, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs bg-muted px-2 py-1 rounded"
                                                >
                                                    {highlight}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </article>
                    </Link>
                ))}
            </div>

            <div className="mt-12 text-center">
                <Link href="/blog">
                    <Button
                        variant="outline"
                        size="lg"
                        className="hover:bg-primary hover:text-primary-foreground"
                    >
                        {t("clusterArticles.buttonText")}
                    </Button>
                </Link>
            </div>
        </section>
    );
}
