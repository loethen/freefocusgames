import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/magicui/marquee";
import { cn, generateAlternates } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from "next";
import { getBlogPosts } from "@/lib/blog";
import FeaturedBentoGrid from "@/components/featured-bento-grid";
import LatestGames from "@/components/latest-games";
import Image from "next/image";
import { games } from "@/data/games";
import { Wind, Gamepad2, ArrowRight, Play } from "lucide-react";

export const dynamic = "force-static";
export const revalidate = 86400;

// 为首页定义特定的元数据
export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'home' });

    return {
        // 首页特定标题
        title: t('metaTitle'),
        // 首页特定描述
        description: t('metaDescription'),
        // 首页特定关键词
        keywords: t('metaKeywords').split(',').map(keyword => keyword.trim()),
        // 首页特定 Open Graph 数据
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
        },
        // 多语言替代版本
        alternates: generateAlternates(locale),
    };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale });
    const testimonials = await getTranslations({ locale, namespace: 'home.testimonials' });
    const guidesT = await getTranslations({ locale, namespace: 'guides' });
    const posts = await getBlogPosts(locale);
    const postsBySlug = new Map(posts.map((post) => [post.slug, post]));
    const featuredResources = [
        {
            id: "workingMemoryGuide",
            href: "/working-memory-guide",
            label: t("home.featuredResources.items.workingMemoryGuide.label"),
            title: guidesT("workingMemory.title"),
            description: t("home.featuredResources.items.workingMemoryGuide.description"),
            cta: t("common.readGuide")
        },
        {
            id: "schulteBenefits",
            href: "/blog/the-science-of-schulte-tables-boost-visual-attention-reading-speed",
            label: t("home.featuredResources.items.schulteBenefits.label"),
            title: postsBySlug.get("the-science-of-schulte-tables-boost-visual-attention-reading-speed")?.title || "",
            description: postsBySlug.get("the-science-of-schulte-tables-boost-visual-attention-reading-speed")?.excerpt || "",
            cta: t("blog.readMore")
        },
        {
            id: "adultAdhdAsrs",
            href: "/blog/adult-adhd-asrs-comprehensive-guide",
            label: t("home.featuredResources.items.adultAdhdAsrs.label"),
            title: postsBySlug.get("adult-adhd-asrs-comprehensive-guide")?.title || "",
            description: postsBySlug.get("adult-adhd-asrs-comprehensive-guide")?.excerpt || "",
            cta: t("blog.readMore")
        }
    ];

    // Schema Markup for SEO
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Free Focus Games",
        "url": "https://freefocusgames.com",
        "description": t("home.metaDescription"),
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://freefocusgames.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };

    // 第一组评价
    const firstRowReviews = [
        {
            name: testimonials('sarah.name'),
            username: testimonials('sarah.username'),
            body: testimonials('sarah.body'),
            gradient: "from-blue-400 to-cyan-500",
        },
        {
            name: testimonials('mike.name'),
            username: testimonials('mike.username'),
            body: testimonials('mike.body'),
            gradient: "from-purple-400 to-pink-500",
        },
        {
            name: testimonials('emma.name'),
            username: testimonials('emma.username'),
            body: testimonials('emma.body'),
            gradient: "from-green-400 to-emerald-500",
        },
        {
            name: testimonials('sophia.name'),
            username: testimonials('sophia.username'),
            body: testimonials('sophia.body'),
            gradient: "from-rose-400 to-pink-500",
        },
        {
            name: testimonials('liam.name'),
            username: testimonials('liam.username'),
            body: testimonials('liam.body'),
            gradient: "from-sky-400 to-blue-500",
        },
    ];

    // 第二组评价
    const secondRowReviews = [
        {
            name: testimonials('tom.name'),
            username: testimonials('tom.username'),
            body: testimonials('tom.body'),
            gradient: "from-orange-400 to-red-500",
        },
        {
            name: testimonials('lisa.name'),
            username: testimonials('lisa.username'),
            body: testimonials('lisa.body'),
            gradient: "from-yellow-400 to-amber-500",
        },
        {
            name: testimonials('david.name'),
            username: testimonials('david.username'),
            body: testimonials('david.body'),
            gradient: "from-indigo-400 to-violet-500",
        },
        {
            name: testimonials('olivia.name'),
            username: testimonials('olivia.username'),
            body: testimonials('olivia.body'),
            gradient: "from-teal-400 to-cyan-500",
        },
        {
            name: testimonials('ethan.name'),
            username: testimonials('ethan.username'),
            body: testimonials('ethan.body'),
            gradient: "from-amber-400 to-orange-500",
        },
    ];

    const quickStartLinks = [
        { id: "focusGames", href: "/games" },
        { id: "reactionTime", href: "/games/reaction-time" },
        { id: "adhdGames", href: "/categories/adhd-games" },
        { id: "schulteTable", href: "/games/schulte-table" },
        { id: "adultAdhdAssessment", href: "/adult-adhd-assessment" },
        { id: "workingMemoryGuide", href: "/working-memory-guide" }
    ];

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div>
                {/* Hero Section */}
                <section className="max-w-[1600px] mx-auto rounded-3xl sm:p-6 md:p-12 mb-16 dark:from-transparent dark:to-transparent">
                    <div className="flex flex-col-reverse md:flex-row items-center gap-8">
                        <div className="w-full md:w-3/5 text-center md:text-left flex flex-col justify-center">
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-6 leading-tight">
                                {t("home.title")}
                            </h1>
                            <p className="sm:text-xl lg:text-2xl mb-8">
                                {t("home.subtitle")}
                            </p>
                            <div className="mb-4">
                                <Link href="/get-started">
                                    <InteractiveHoverButton>
                                        {t("home.ctaButton")}
                                    </InteractiveHoverButton>
                                </Link>
                            </div>

                            {/* SEO Feature Badges */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4 text-sm text-muted-foreground font-medium">
                                {(t.raw("home.heroFeatures") as string[] || []).map((feature: string, index: number) => (
                                    <span key={index} className="flex items-center">
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="w-full md:w-2/5 flex items-center justify-center py-4">
                            <Image
                                src="/herocat.png"
                                alt={t("home.heroImageAlt")}
                                width={400}
                                height={400}
                                style={{
                                    maxWidth: "400px",
                                    width: "100%",
                                    height: "auto",
                                }}
                                priority
                                className="floating-image rounded-full overflow-hidden"
                            />
                        </div>
                    </div>
                </section>

                {/* Games Section - Featured Bento Grid */}
                <section className="mb-24 max-w-[1600px] mx-auto px-6">
                    <FeaturedBentoGrid />
                </section>

                <section className="mb-24 max-w-[1600px] mx-auto px-6">
                    <div className="mb-8 max-w-2xl">
                        <h2 className="text-3xl font-bold mb-3">
                            {t("home.searchPaths.title")}
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            {t("home.searchPaths.subtitle")}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                        {quickStartLinks.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <span className="text-sm font-medium text-primary">
                                        {t(`home.searchPaths.items.${item.id}.eyebrow`)}
                                    </span>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    {t(`home.searchPaths.items.${item.id}.title`)}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {t(`home.searchPaths.items.${item.id}.description`)}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Latest Games */}
                <section className="mb-24 max-w-[1600px] mx-auto px-6">
                    <LatestGames />
                </section>

                {/* Breathing Zone - Bento Layout */}
                <section className="mb-24 max-w-[1600px] mx-auto px-6">
                    <div className="flex items-center gap-2 mb-8">
                        <Wind className="h-6 w-6 text-teal-500" />
                        <h2 className="text-2xl font-semibold">
                            {t("home.breathingZone")}
                        </h2>
                    </div>
                    {(() => {
                        const breathingGames = games.filter(g => g.categories.includes('relaxation'));
                        const mainGame = breathingGames.find(g => g.id === 'box-breathing') || breathingGames[0];
                        const sideGames = breathingGames.filter(g => g.id !== mainGame?.id);
                        if (!mainGame) return null;
                        const getIdKey = (id: string) => id.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase()).replace(/-/g, '');
                        return (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-ads-inside">
                                {/* Main Featured Breathing Game */}
                                <div className="lg:col-span-2 relative group overflow-hidden rounded-3xl bg-gray-50 dark:bg-zinc-900 border border-border transition-all hover:shadow-xl">
                                    <div className="flex flex-col-reverse md:flex-row h-full">
                                        <div className="flex-1 p-8 flex flex-col justify-center gap-4 z-10 relative bg-white/50 dark:bg-black/20 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
                                            <div>
                                                <h3 className="text-3xl md:text-4xl font-bold mb-3">
                                                    {t(`games.${getIdKey(mainGame.id)}.title`)}
                                                </h3>
                                                <p className="text-muted-foreground text-lg line-clamp-3">
                                                    {t(`games.${getIdKey(mainGame.id)}.homeDescription`)}
                                                </p>
                                            </div>
                                            <Link href={`/games/${mainGame.slug}`}>
                                                <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-lg hover:translate-y-[-2px] transition-transform w-full md:w-auto">
                                                    <Play className="mr-2 h-5 w-5" fill="currentColor" />
                                                    {t("buttons.start")}
                                                </Button>
                                            </Link>
                                        </div>
                                        <div className="flex-1 min-h-[250px] md:min-h-[300px] flex items-center justify-center relative">
                                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 rounded-full blur-3xl transform scale-75 opacity-50" />
                                            <div className="relative z-0">
                                                {mainGame.preview}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Side Breathing Cards */}
                                <div className="grid grid-rows-2 gap-6 h-full">
                                    {sideGames.map(game => (
                                        <Link
                                            key={game.id}
                                            href={`/games/${game.slug}`}
                                            className="relative group overflow-hidden rounded-3xl bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors min-h-[180px]"
                                        >
                                            <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                                <div className="flex justify-between items-start">
                                                    <div className="w-12 h-12 rounded-2xl bg-background shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Wind className="h-6 w-6 text-teal-500" />
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                                        <div className="bg-background rounded-full p-2 shadow-sm">
                                                            <ArrowRight className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg mb-1 line-clamp-1">
                                                        {t(`games.${getIdKey(game.id)}.title`)}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {t(`games.${getIdKey(game.id)}.description`)}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </section>

                {/* For Fun */}
                {games.filter(g => g.categories.includes('spring-festival')).length > 0 && (
                    <section className="mb-24 max-w-[1600px] mx-auto px-6">
                        <div className="flex items-center gap-2 mb-8">
                            <Gamepad2 className="h-6 w-6" />
                            <h2 className="text-2xl font-semibold">
                                {t("home.forFun")}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {games.filter(g => g.categories.includes('spring-festival')).map(game => (
                                <Link key={game.id} href={`/games/${game.slug}`} className="group block">
                                    <div className="relative aspect-video rounded-xl overflow-hidden border border-purple-200 dark:border-purple-900 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02] bg-purple-50/50 dark:bg-purple-950/20">
                                        <div className="w-full h-full flex items-center justify-center">
                                            {game.preview}
                                        </div>
                                    </div>
                                    <h3 className="mt-3 font-bold text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                        {game.title}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Types of Brain Training */}
                <section className="mb-24 max-w-[1600px] mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">{t("typesOfGames.title")}</h2>
                        <p className="text-xl text-muted-foreground">{t("typesOfGames.subtitle")}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { id: 'nback', icon: '🧠', color: 'bg-indigo-50 text-indigo-700', href: '/games/dual-n-back' },
                            { id: 'schulte', icon: '⚡', color: 'bg-amber-50 text-amber-700', href: '/games/schulte-table' },
                            { id: 'stroop', icon: '🛑', color: 'bg-red-50 text-red-700', href: '/games/stroop-effect-test' },
                            { id: 'memory', icon: '🧩', color: 'bg-emerald-50 text-emerald-700', href: '/categories/working-memory' }
                        ].map(type => (
                            <Link key={type.id} href={type.href} className="group block">
                                <div className="p-6 rounded-2xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl", type.color)}>
                                            {type.icon}
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{t(`typesOfGames.${type.id}.title`)}</h3>
                                    <p className="text-muted-foreground">{t(`typesOfGames.${type.id}.description`)}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Featured Guides */}
                <section className="mb-24 max-w-[1600px] mx-auto px-0 sm:px-6">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-3xl font-bold mb-3">
                                {t("home.featuredResources.title")}
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-3xl">
                                {t("home.featuredResources.subtitle")}
                            </p>
                        </div>
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                        >
                            {t("home.featuredResources.viewAll")}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {featuredResources.map((resource) => (
                            <Link
                                key={resource.id}
                                href={resource.href}
                                className="group border rounded-2xl p-6 shadow-xs hover:shadow-md transition-all hover:-translate-y-1 bg-card"
                            >
                                <div className="text-xs font-medium uppercase tracking-wide text-primary mb-3">
                                    {resource.label}
                                </div>
                                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                                    {resource.title}
                                </h3>
                                <p className="text-muted-foreground mb-5 line-clamp-4">
                                    {resource.description}
                                </p>
                                <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                                    {resource.cta}
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="mb-24 max-w-3xl mx-auto px-0 sm:px-6">
                    <h2 className="text-3xl font-bold text-center mb-8">
                        {t("home.benefitsTitle")}
                    </h2>

                    <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                        <p>{t("home.benefitsIntro")}</p>

                        <div className="flex items-start gap-4 p-6 bg-background/50 rounded-xl">
                            <div className="shrink-0 text-2xl">👨👧</div>
                            <div>
                                <h3 className="font-medium mb-2 text-foreground">
                                    {t("home.familyLifeTitle")}
                                </h3>
                                <p>{t("home.familyLifeDesc")}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-6 bg-background/50 rounded-xl">
                            <div className="shrink-0 text-2xl">💼</div>
                            <div>
                                <h3 className="font-medium mb-2 text-foreground">
                                    {t("home.workPerformanceTitle")}
                                </h3>
                                <p>{t("home.workPerformanceDesc")}</p>
                                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                                    <Link
                                        href="/games/pomodoro-timer"
                                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                                    >
                                        {t("games.pomodoroTimer.title")}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-6 bg-background/50 rounded-xl">
                            <div className="shrink-0 text-2xl">🎯</div>
                            <div>
                                <h3 className="font-medium mb-2 text-foreground">
                                    {t("home.personalGrowthTitle")}
                                </h3>
                                <p>{t("home.personalGrowthDesc")}</p>
                                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                                    <Link
                                        href="/games/schulte-table"
                                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                                    >
                                        {t("games.schulteTable.title")}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <Link
                                        href="/games/reaction-time"
                                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                                    >
                                        {t("games.reactionTime.title")}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <p className="text-center mt-8">
                            {t("home.dailyPractice")}
                            <br />
                            <span className="text-primary font-medium">
                                {t("home.benefitsConclusion")}
                            </span>
                        </p>
                    </div>
                </section>


                {/* Science Behind Section */}
                <section className="mb-24 max-w-4xl mx-auto px-6 text-center">
                    <div className="bg-muted/30 dark:bg-muted/10 p-8 sm:p-12 rounded-3xl border border-border">
                        <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold tracking-wider text-foreground uppercase bg-muted rounded-full">
                            {t("home.scienceBehind.tag")}
                        </span>
                        <h2 className="text-3xl font-bold mb-4 text-foreground">
                            {t("home.scienceBehind.title")}
                        </h2>
                        <p className="text-xl font-medium text-foreground mb-4">
                            {t("home.scienceBehind.subtitle")}
                        </p>
                        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                            {t("home.scienceBehind.description")}
                        </p>
                        <Link href="/working-memory-guide">
                            <InteractiveHoverButton className="w-full sm:w-auto">
                                {t("home.scienceBehind.cta")}
                            </InteractiveHoverButton>
                        </Link>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="mb-24 max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        {t("home.testimonialsTitle")}
                    </h2>

                    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden px-6">
                        <Marquee pauseOnHover className="[--duration:20s] mb-8">
                            {firstRowReviews.map((review) => (
                                <div key={review.username} className="mx-4 w-72">
                                    <div
                                        className={cn(
                                            "relative h-full cursor-pointer overflow-hidden rounded-xl border p-6",
                                            "bg-background/80 hover:bg-border/10",
                                            "border"
                                        )}
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`h-16 w-16 rounded-full bg-linear-to-r ${review.gradient}`}
                                                />
                                                <div className="">
                                                    <h3 className="text-lg font-semibold">
                                                        {review.name}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {review.username}
                                                    </p>
                                                </div>
                                            </div>
                                            <blockquote className="mt-2 text-sm">
                                                {review.body}
                                            </blockquote>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Marquee>

                        <Marquee reverse pauseOnHover className="[--duration:20s]">
                            {secondRowReviews.map((review) => (
                                <div key={review.username} className="mx-4 w-72">
                                    <div
                                        className={cn(
                                            "relative h-full cursor-pointer overflow-hidden rounded-xl border p-6",
                                            "bg-background/80 hover:bg-border/10",
                                            "border"
                                        )}
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`h-16 w-16 rounded-full bg-linear-to-r ${review.gradient}`}
                                                />
                                                <div className="">
                                                    <h3 className="text-lg font-semibold">
                                                        {review.name}
                                                    </h3>
                                                    <h4 className="text-sm text-muted-foreground">
                                                        {review.username}
                                                    </h4>
                                                </div>
                                            </div>
                                            <blockquote className="mt-2 text-sm">
                                                {review.body}
                                            </blockquote>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Marquee>

                        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-background"></div>
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l from-background"></div>
                    </div>
                </section>
            </div>
        </>
    );
}
