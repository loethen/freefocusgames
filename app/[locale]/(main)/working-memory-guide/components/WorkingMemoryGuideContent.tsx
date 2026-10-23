import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getTranslations } from 'next-intl/server';
import { games, Game } from "@/data/games";
import { FloatingNavigation } from "./FloatingNavigation";
import GameCard from "@/components/game-card";
import "../styles.css";

type TFunction = {
    (key: string): string;
    raw(key: string): string;
};

export default async function WorkingMemoryGuideContent({ locale }: { locale: string }) {
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

function HeroSection({ t }: { t: TFunction }) {
    const titleParts = t('title').split(':');
    return (
        <section className="py-12 mb-16">
            <div className="text-center lg:text-left">
                <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                    {titleParts[0]}:
                    <span className="block text-primary">
                        {titleParts.slice(1).join(':')}
                    </span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                    {t('subtitle')}
                </p>
            </div>
        </section>
    );
}

function ContentSections({ t }: { t: TFunction }) {
    return (
        <article className="prose prose-lg max-w-none mb-16">
            {/* Introduction Section */}
            <section id="introduction" className="mb-16 content-section">
                <h2 className="text-3xl font-bold mb-8 text-foreground">{t('introduction.title')}</h2>
                <div id="introduction-0" className="mb-10">
                    <h3 className="text-2xl font-semibold mb-6">{t('introduction.whatIs.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6 text-lg">{t('introduction.whatIs.p1')}</p>
                    <div className="highlight-box">
                        <h4 className="font-semibold mb-4 text-lg">{t('introduction.whatIs.baddeleyModel.title')}</h4>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                                <h5 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">{t('introduction.whatIs.baddeleyModel.card1.title')}</h5>
                                <p className="text-sm text-blue-600 dark:text-blue-300">{t('introduction.whatIs.baddeleyModel.card1.p')}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                                <h5 className="font-semibold mb-2 text-green-800 dark:text-green-200">{t('introduction.whatIs.baddeleyModel.card2.title')}</h5>
                                <p className="text-sm text-green-600 dark:text-green-300">{t('introduction.whatIs.baddeleyModel.card2.p')}</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-4 rounded-lg">
                                <h5 className="font-semibold mb-2 text-purple-800 dark:text-purple-200">{t('introduction.whatIs.baddeleyModel.card3.title')}</h5>
                                <p className="text-sm text-purple-600 dark:text-purple-300">{t('introduction.whatIs.baddeleyModel.card3.p')}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="introduction-1" className="mb-10">
                    <h3 className="text-2xl font-semibold mb-6">{t('introduction.neuroscience.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: t.raw('introduction.neuroscience.p1') }} />
                    <div className="bg-card border p-6 rounded-lg">
                        <h4 className="font-semibold mb-3">{t('introduction.neuroscience.keyAreas.title')}</h4>
                        <ul className="space-y-3 text-sm">
                            <li dangerouslySetInnerHTML={{ __html: t.raw('introduction.neuroscience.keyAreas.li1') }} />
                            <li dangerouslySetInnerHTML={{ __html: t.raw('introduction.neuroscience.keyAreas.li2') }} />
                            <li dangerouslySetInnerHTML={{ __html: t.raw('introduction.neuroscience.keyAreas.li3') }} />
                            <li dangerouslySetInnerHTML={{ __html: t.raw('introduction.neuroscience.keyAreas.li4') }} />
                        </ul>
                    </div>
                </div>
                <div id="introduction-2" className="mb-10">
                    <h3 className="text-2xl font-semibold mb-6">{t('introduction.dailyImpact.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{t('introduction.dailyImpact.p1')}</p>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-foreground">{t('introduction.dailyImpact.academic.title')}</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>{t('introduction.dailyImpact.academic.li1')}</li>
                                <li>{t('introduction.dailyImpact.academic.li2')}</li>
                                <li>{t('introduction.dailyImpact.academic.li3')}</li>
                                <li>{t('introduction.dailyImpact.academic.li4')}</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-semibold text-foreground">{t('introduction.dailyImpact.workplace.title')}</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>{t('introduction.dailyImpact.workplace.li1')}</li>
                                <li>{t('introduction.dailyImpact.workplace.li2')}</li>
                                <li>{t('introduction.dailyImpact.workplace.li3')}</li>
                                <li>{t('introduction.dailyImpact.workplace.li4')}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dual N-Back Section */}
            <section id="dual-n-back" className="mb-16 content-section">
                <h2 className="text-3xl font-bold mb-8 text-foreground">{t('dnb.title')}</h2>
                <div id="dual-n-back-0" className="mb-10">
                    <h3 className="text-2xl font-semibold mb-6">{t('dnb.jaeggiStudy.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: t.raw('dnb.jaeggiStudy.p1') }} />
                    <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-6 rounded-lg">
                        <h4 className="font-semibold mb-4 text-orange-800 dark:text-orange-200">{t('dnb.jaeggiStudy.coreFindings.title')}</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h5 className="font-medium mb-2">{t('dnb.jaeggiStudy.coreFindings.design.title')}</h5>
                                <ul className="space-y-1 text-sm">
                                    <li>{t('dnb.jaeggiStudy.coreFindings.design.li1')}</li>
                                    <li>{t('dnb.jaeggiStudy.coreFindings.design.li2')}</li>
                                    <li>{t('dnb.jaeggiStudy.coreFindings.design.li3')}</li>
                                    <li>{t('dnb.jaeggiStudy.coreFindings.design.li4')}</li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-medium mb-2">{t('dnb.jaeggiStudy.coreFindings.results.title')}</h5>
                                <ul className="space-y-1 text-sm">
                                    <li>{t('dnb.jaeggiStudy.coreFindings.results.li1')}</li>
                                    <li>{t('dnb.jaeggiStudy.coreFindings.results.li2')}</li>
                                    <li>{t('dnb.jaeggiStudy.coreFindings.results.li3')}</li>
                                    <li>{t('dnb.jaeggiStudy.coreFindings.results.li4')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="dual-n-back-1" className="mb-10">
                    <h3 className="text-2xl font-semibold mb-6">{t('dnb.mechanism.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{t('dnb.mechanism.p1')}</p>
                    <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg">
                        <div>
                            <h4 className="font-semibold mb-3">{t('dnb.mechanism.card1.title')}</h4>
                            <p className="text-sm mb-3">{t('dnb.mechanism.card1.p')}</p>
                            <div className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t.raw('dnb.mechanism.card1.details') }} />
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                            <h4 className="font-semibold mb-3">{t('dnb.mechanism.card2.title')}</h4>
                            <p className="text-sm mb-3">{t('dnb.mechanism.card2.p')}</p>
                            <div className="text-xs text-muted-foreground">{t('dnb.mechanism.card2.details')}</div>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                            <h4 className="font-semibold mb-3">{t('dnb.mechanism.card3.title')}</h4>
                            <p className="text-sm mb-3">{t('dnb.mechanism.card3.p')}</p>
                            <div className="text-xs text-muted-foreground">{t('dnb.mechanism.card3.details')}</div>
                        </div>
                    </div>
                </div>
                <div id="dual-n-back-2" className="mb-10">
                    <h3 className="text-2xl font-semibold mb-6">{t('dnb.neuroplasticity.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{t('dnb.neuroplasticity.p1')}</p>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-card border rounded-lg p-6">
                            <h4 className="font-semibold mb-4 text-foreground">{t('dnb.neuroplasticity.structural.title')}</h4>
                            <ul className="space-y-2 text-sm">
                                <li>{t('dnb.neuroplasticity.structural.li1')}</li>
                                <li>{t('dnb.neuroplasticity.structural.li2')}</li>
                                <li>{t('dnb.neuroplasticity.structural.li3')}</li>
                            </ul>
                        </div>
                        <div className="bg-card border rounded-lg p-6">
                            <h4 className="font-semibold mb-4 text-foreground">{t('dnb.neuroplasticity.functional.title')}</h4>
                            <ul className="space-y-2 text-sm">
                                <li>{t('dnb.neuroplasticity.functional.li1')}</li>
                                <li>{t('dnb.neuroplasticity.functional.li2')}</li>
                                <li>{t('dnb.neuroplasticity.functional.li3')}</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div id="dual-n-back-3" className="mb-10">
                    <h3 className="text-2xl font-semibold mb-6">{t('dnb.protocol.title')}</h3>
                    <div className="bg-card border p-6 rounded-lg">
                        <h4 className="font-semibold mb-4">{t('dnb.protocol.boxTitle')}</h4>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <h5 className="font-medium mb-2">{t('dnb.protocol.params.title')}</h5>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>{t('dnb.protocol.params.li1')}</li>
                                    <li>{t('dnb.protocol.params.li2')}</li>
                                    <li>{t('dnb.protocol.params.li3')}</li>
                                    <li>{t('dnb.protocol.params.li4')}</li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-medium mb-2">{t('dnb.protocol.expectations.title')}</h5>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>{t('dnb.protocol.expectations.li1')}</li>
                                    <li>{t('dnb.protocol.expectations.li2')}</li>
                                    <li>{t('dnb.protocol.expectations.li3')}</li>
                                    <li>{t('dnb.protocol.expectations.li4')}</li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-medium mb-2">{t('dnb.protocol.successFactors.title')}</h5>
                                <ul className="space-y-1 text-sm">
                                    <li>{t('dnb.protocol.successFactors.li1')}</li>
                                    <li>{t('dnb.protocol.successFactors.li2')}</li>
                                    <li>{t('dnb.protocol.successFactors.li3')}</li>
                                    <li>{t('dnb.protocol.successFactors.li4')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Schulte Table Section */}
            <section id="schulte-table" className="mb-16 content-section">
                <h2 className="text-3xl font-bold mb-8 text-foreground">{t('schulte.title')}</h2>
                <div id="schulte-table-0" className="mb-10">
                    <h3 className="text-2xl font-semibold mb-6">{t('schulte.posnerTheory.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{t('schulte.posnerTheory.p1')}</p>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-6 rounded-lg">
                            <h4 className="font-semibold mb-3 text-amber-800 dark:text-amber-200">{t('schulte.posnerTheory.card1.title')}</h4>
                            <p className="text-sm mb-3 text-amber-700 dark:text-amber-300">{t('schulte.posnerTheory.card1.p')}</p>
                            <div className="text-xs text-amber-600 dark:text-amber-400" dangerouslySetInnerHTML={{ __html: t.raw('schulte.posnerTheory.card1.details') }} />
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-6 rounded-lg">
                            <h4 className="font-semibold mb-3 text-emerald-800 dark:text-emerald-200">{t('schulte.posnerTheory.card2.title')}</h4>
                            <p className="text-sm mb-3 text-emerald-700 dark:text-emerald-300">{t('schulte.posnerTheory.card2.p')}</p>
                            <div className="text-xs text-emerald-600 dark:text-emerald-400" dangerouslySetInnerHTML={{ __html: t.raw('schulte.posnerTheory.card2.details') }} />
                        </div>
                        <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 p-6 rounded-lg">
                            <h4 className="font-semibold mb-3 text-violet-800 dark:text-violet-200">{t('schulte.posnerTheory.card3.title')}</h4>
                            <p className="text-sm mb-3 text-violet-700 dark:text-violet-300">{t('schulte.posnerTheory.card3.p')}</p>
                            <div className="text-xs text-violet-600 dark:text-violet-400" dangerouslySetInnerHTML={{ __html: t.raw('schulte.posnerTheory.card3.details') }} />
                        </div>
                    </div>
                </div>
                <div id="schulte-table-1" className="mb-10">
                    <h3 className="text-2xl font-semibold mb-6">{t('schulte.readingSpeed.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{t('schulte.readingSpeed.p1')}</p>
                    <div className="space-y-6">
                        <div className="bg-card border p-6 rounded-lg">
                            <h4 className="font-semibold mb-4">{t('schulte.readingSpeed.russiaStudy.title')}</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h5 className="font-medium mb-2">{t('schulte.readingSpeed.russiaStudy.visual.title')}</h5>
                                    <ul className="space-y-1 text-sm" dangerouslySetInnerHTML={{ __html: t.raw('schulte.readingSpeed.russiaStudy.visual.list') }} />
                                </div>
                                <div>
                                    <h5 className="font-medium mb-2">{t('schulte.readingSpeed.russiaStudy.reading.title')}</h5>
                                    <ul className="space-y-1 text-sm" dangerouslySetInnerHTML={{ __html: t.raw('schulte.readingSpeed.russiaStudy.reading.list') }} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-card border p-6 rounded-lg">
                            <h4 className="font-semibold mb-4">{t('schulte.readingSpeed.psychologyStudy.title')}</h4>
                            <p className="text-sm mb-3">{t('schulte.readingSpeed.psychologyStudy.p1')}</p>
                            <ul className="space-y-1 text-sm" dangerouslySetInnerHTML={{ __html: t.raw('schulte.readingSpeed.psychologyStudy.list') }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Memory Improvement Section */}
            <section id="memory-improvement" className="mb-16 content-section">
                <h2 className="text-3xl font-bold mb-8 text-foreground">{t('memory.title')}</h2>
                <div id="memory-improvement-0" className="mb-10">
                    <h3 className="text-2xl font-semibold mb-6">{t('memory.hippocampus.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{t('memory.hippocampus.p1')}</p>
                    <div className="bg-card border p-6 rounded-lg">
                        <h4 className="font-semibold mb-4">{t('memory.hippocampus.causes.title')}</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div>
                                    <h5 className="font-medium text-foreground">{t('memory.hippocampus.causes.cause1.title')}</h5>
                                    <p className="text-sm text-muted-foreground">{t('memory.hippocampus.causes.cause1.p')}</p>
                                </div>
                                <div>
                                    <h5 className="font-medium text-foreground">{t('memory.hippocampus.causes.cause2.title')}</h5>
                                    <p className="text-sm text-muted-foreground">{t('memory.hippocampus.causes.cause2.p')}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <h5 className="font-medium text-foreground">{t('memory.hippocampus.causes.cause3.title')}</h5>
                                    <p className="text-sm text-muted-foreground">{t('memory.hippocampus.causes.cause3.p')}</p>
                                </div>
                                <div>
                                    <h5 className="font-medium text-foreground">{t('memory.hippocampus.causes.cause4.title')}</h5>
                                    <p className="text-sm text-muted-foreground">{t('memory.hippocampus.causes.cause4.p')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Training Protocol Section */}
            <section id="training-protocol" className="mb-16 content-section">
                <h2 className="text-3xl font-bold mb-8 text-foreground">{t('trainingProtocol.title')}</h2>
                <div id="training-protocol-0" className="mb-10">
                    <h3 className="text-2xl font-semibold mb-6">{t('trainingProtocol.personalized.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{t('trainingProtocol.personalized.p1')}</p>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-6 rounded-lg">
                            <h4 className="font-semibold mb-4 text-green-800 dark:text-green-200">{t('trainingProtocol.personalized.beginner.title')}</h4>
                            <div className="space-y-3">
                                <div>
                                    <h5 className="font-medium text-sm">{t('trainingProtocol.personalized.audience')}</h5>
                                    <p className="text-xs text-muted-foreground">{t('trainingProtocol.personalized.beginner.audience')}</p>
                                </div>
                                <div>
                                    <h5 className="font-medium text-sm">{t('trainingProtocol.personalized.focus')}</h5>
                                    <ul className="text-xs space-y-1" dangerouslySetInnerHTML={{ __html: t.raw('trainingProtocol.personalized.beginner.focus') }} />
                                </div>
                                <div>
                                    <h5 className="font-medium text-sm">{t('trainingProtocol.personalized.effect')}</h5>
                                    <p className="text-xs text-muted-foreground">{t('trainingProtocol.personalized.beginner.effect')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-6 rounded-lg">
                            <h4 className="font-semibold mb-4 text-blue-800 dark:text-blue-200">{t('trainingProtocol.personalized.advanced.title')}</h4>
                             <div className="space-y-3">
                                <div>
                                    <h5 className="font-medium text-sm">{t('trainingProtocol.personalized.audience')}</h5>
                                    <p className="text-xs text-muted-foreground">{t('trainingProtocol.personalized.advanced.audience')}</p>
                                </div>
                                <div>
                                    <h5 className="font-medium text-sm">{t('trainingProtocol.personalized.focus')}</h5>
                                    <ul className="text-xs space-y-1" dangerouslySetInnerHTML={{ __html: t.raw('trainingProtocol.personalized.advanced.focus') }} />
                                </div>
                                <div>
                                    <h5 className="font-medium text-sm">{t('trainingProtocol.personalized.effect')}</h5>
                                    <p className="text-xs text-muted-foreground">{t('trainingProtocol.personalized.advanced.effect')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-6 rounded-lg">
                            <h4 className="font-semibold mb-4 text-purple-800 dark:text-purple-200">{t('trainingProtocol.personalized.expert.title')}</h4>
                             <div className="space-y-3">
                                <div>
                                    <h5 className="font-medium text-sm">{t('trainingProtocol.personalized.audience')}</h5>
                                    <p className="text-xs text-muted-foreground">{t('trainingProtocol.personalized.expert.audience')}</p>
                                </div>
                                <div>
                                    <h5 className="font-medium text-sm">{t('trainingProtocol.personalized.focus')}</h5>
                                    <ul className="text-xs space-y-1" dangerouslySetInnerHTML={{ __html: t.raw('trainingProtocol.personalized.expert.focus') }} />
                                </div>
                                <div>
                                    <h5 className="font-medium text-sm">{t('trainingProtocol.personalized.effect')}</h5>
                                    <p className="text-xs text-muted-foreground">{t('trainingProtocol.personalized.expert.effect')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

             {/* Research Evidence Section */}
            <section id="research-evidence" className="mb-16 content-section">
                <h2 className="text-3xl font-bold mb-8 text-foreground">{t('research.title')}</h2>
                <div id="research-evidence-0" className="mb-10">
                    <h3 className="text-2xl font-semibold mb-6">{t('research.milestones.title')}</h3>
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border">
                            <h4 className="font-semibold mb-4 text-foreground">{t('research.milestones.jaeggi.title')}</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h5 className="font-medium mb-2">{t('research.milestones.design')}</h5>
                                    <ul className="text-sm space-y-1" dangerouslySetInnerHTML={{ __html: t.raw('research.milestones.jaeggi.design') }} />
                                </div>
                                <div>
                                    <h5 className="font-medium mb-2">{t('research.milestones.findings')}</h5>
                                    <ul className="text-sm space-y-1" dangerouslySetInnerHTML={{ __html: t.raw('research.milestones.jaeggi.findings') }} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-card border p-6 rounded-lg">
                            <h4 className="font-semibold mb-4 text-foreground">{t('research.milestones.erickson.title')}</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h5 className="font-medium mb-2">{t('research.milestones.background')}</h5>
                                    <p className="text-sm mb-2">{t('research.milestones.erickson.background')}</p>
                                    <ul className="text-sm space-y-1" dangerouslySetInnerHTML={{ __html: t.raw('research.milestones.erickson.design') }} />
                                </div>
                                <div>
                                    <h5 className="font-medium mb-2">{t('research.milestones.findings')}</h5>
                                    <ul className="text-sm space-y-1" dangerouslySetInnerHTML={{ __html: t.raw('research.milestones.erickson.findings') }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </article>
    );
}

function RelatedGamesSection({ t, games }: { t: TFunction, games: Game[] }) {
    return (
        <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-foreground">
                {t('relatedGames.title')}
            </h2>
            <p className="text-center text-muted-foreground mb-10 text-lg">
                {t('relatedGames.subtitle')}
            </p>
            <div className="grid md:grid-cols-3 gap-8">
                {games.map((game) => (
                    <GameCard key={game.id} game={game} />
                ))}
            </div>
            
            <div className="mt-12 bg-card border p-8 rounded-xl">
                <h3 className="text-xl font-bold mb-4 text-center">{t('protocol.box.title')}</h3>
                <div className="grid md:grid-cols-3 gap-6 text-sm">
                    <div className="text-center">
                        <div className="text-2xl mb-2">⏰</div>
                        <h4 className="font-semibold mb-2">{t('protocol.box.duration.title')}</h4>
                        <p className="text-muted-foreground">{t('protocol.box.duration.p')}</p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl mb-2">📈</div>
                        <h4 className="font-semibold mb-2">{t('protocol.box.progress.title')}</h4>
                        <p className="text-muted-foreground">{t('protocol.box.progress.p')}</p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl mb-2">🎯</div>
                        <h4 className="font-semibold mb-2">{t('protocol.box.principles.title')}</h4>
                        <p className="text-muted-foreground">{t('protocol.box.principles.p')}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

function ClusterArticlesSection({ t }: { t: TFunction }) {
    const articles = [
        {
            title: t('clusterArticles.article1.title'),
            description: t('clusterArticles.article1.description'),
            slug: "the-science-behind-n-back-training-boost-working-memory",
            highlights: t('clusterArticles.article1.highlights').split(','),
            tag: t('clusterArticles.article1.tag'),
            readTime: t('clusterArticles.article1.readTime'),
            difficulty: t('clusterArticles.article1.difficulty')
        },
        {
            title: t('clusterArticles.article2.title'),
            description: t('clusterArticles.article2.description'),
            slug: "the-science-of-schulte-tables-boost-visual-attention-reading-speed",
            highlights: t('clusterArticles.article2.highlights').split(','),
            tag: t('clusterArticles.article2.tag'),
            readTime: t('clusterArticles.article2.readTime'),
            difficulty: t('clusterArticles.article2.difficulty')
        },
        {
            title: t('clusterArticles.article3.title'),
            description: t('clusterArticles.article3.description'),
            slug: "how-to-improve-short-term-memory",
            highlights: t('clusterArticles.article3.highlights').split(','),
            tag: t('clusterArticles.article3.tag'),
            readTime: t('clusterArticles.article3.readTime'),
            difficulty: t('clusterArticles.article3.difficulty')
        }
    ];

    return (
        <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-foreground">
                {t('clusterArticles.title')}
            </h2>
            <p className="text-center text-muted-foreground mb-10 text-lg">
                {t('clusterArticles.subtitle')}
            </p>
            
            <div className="grid md:grid-cols-1 gap-6">
                {articles.map((article, index) => (
                    <Link key={article.slug} href={`/blog/${article.slug}`}>
                        <article className="group bg-card border rounded-lg p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">
                                            {index === 0 ? "🎯" : index === 1 ? "👁️" : "🔬"}
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
                                        {article.highlights.slice(0, 3).map((highlight, i) => (
                                            <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
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
                    <Button variant="outline" size="lg" className="hover:bg-primary hover:text-primary-foreground">
                        {t('clusterArticles.buttonText')}
                    </Button>
                </Link>
            </div>
        </section>
    );
}