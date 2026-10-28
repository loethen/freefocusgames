import { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CATEGORY_DOT } from "@/components/game-card";
import { CATEGORY_ICONS } from "@/components/game-categories";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { cn, generateAlternates } from "@/lib/utils";
import { getGamesByCategory } from "@/data/games";
import { categories, type Category } from "@/data/categories";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-static";
export const revalidate = false;

// Curated collections are listed apart from the core cognitive skills.
const COLLECTION_IDS = ["adhd-games", "brain-games-for-kids", "double-decision-games", "relaxation", "personality-tests"];

const guideLinkClass = "font-medium text-foreground underline underline-offset-4 hover:text-primary";

// 使用动态生成元数据替代静态元数据
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'categories' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: t('metaKeywords').split(',').map(keyword => keyword.trim()),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
    },
    alternates: generateAlternates(locale, 'categories'),
  };
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'categories' });
  const skills = categories.filter((category) => !COLLECTION_IDS.includes(category.id));
  const collections = categories.filter((category) => COLLECTION_IDS.includes(category.id));

  const renderTile = (category: Category, onPanel: boolean) => {
    const Icon = category.icon ? CATEGORY_ICONS[category.icon] : undefined;
    const gameCount = getGamesByCategory(category.id).length;

    return (
      <li key={category.id}>
        <Link
          href={`/categories/${category.slug}`}
          className={cn(
            "group flex h-full flex-col gap-4 rounded-2xl p-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            onPanel
              ? "bg-background hover:bg-background/70"
              : "border border-border bg-card hover:border-foreground/25"
          )}
        >
          <span className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl text-foreground/70 transition-colors group-hover:text-foreground",
            onPanel ? "bg-muted/70" : "bg-muted/60"
          )}>
            {Icon && <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />}
          </span>
          <span className="flex flex-1 flex-col gap-1">
            <h3 className="text-base font-semibold tracking-tight">
              {t(`categoryNames.${category.id}`, { defaultMessage: category.name })}
            </h3>
            <span className="text-sm leading-6 text-muted-foreground">
              {t(`categoryTaglines.${category.id}`)}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: CATEGORY_DOT[category.id] ?? "#888780" }}
            />
            {t('gameCount', { count: gameCount })}
            <ArrowRight
              aria-hidden="true"
              className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </span>
        </Link>
      </li>
    );
  };

  return (
    <div className="mx-auto max-w-6xl py-8">
      <Breadcrumbs items={[
        { label: t('title') },
      ]} />

      <header className="mx-auto mt-12 mb-14 max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {t('heading')}
        </h1>
        <p className="mt-4 text-muted-foreground leading-7">
          {t('description')}
        </p>
      </header>

      <section aria-labelledby="skills-title" className="mb-14">
        <h2 id="skills-title" className="mb-5 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {t('skillsTitle')}
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((category) => renderTile(category, false))}
        </ul>
      </section>

      <section aria-labelledby="collections-title">
        <h2 id="collections-title" className="mb-5 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {t('collectionsTitle')}
        </h2>
        <ul className="grid grid-cols-1 gap-3 rounded-[2rem] bg-muted/50 p-3 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((category) => renderTile(category, true))}
        </ul>
      </section>

      <section aria-labelledby="guide-title" className="mx-auto mt-16 max-w-2xl space-y-3 text-sm leading-7 text-muted-foreground">
        <h2 id="guide-title" className="text-base font-semibold text-foreground">
          {t('guide.title')}
        </h2>
        <p>{t('guide.grouping')}</p>
        <p>
          {t.rich('guide.start', {
            reaction: (chunks) => <Link href="/categories/reaction-time" className={guideLinkClass}>{chunks}</Link>,
            memory: (chunks) => <Link href="/categories/working-memory" className={guideLinkClass}>{chunks}</Link>,
            relax: (chunks) => <Link href="/categories/relaxation" className={guideLinkClass}>{chunks}</Link>,
          })}
        </p>
        <p>
          {t.rich('guide.picker', {
            picker: (chunks) => <Link href="/get-started" className={guideLinkClass}>{chunks}</Link>,
          })}
        </p>
      </section>
    </div>
  );
}
