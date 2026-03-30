import { Metadata } from "next";
import GameCategories from "@/components/game-categories";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternates } from "@/lib/utils";
import { getGamesByCategory } from "@/data/games";
import { categories } from "@/data/categories";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-static";
export const revalidate = 86400;

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
  const popularCategoryIds = ["working-memory", "reaction-time", "adhd-games", "relaxation"];
  const popularCategories = categories.filter((category) => popularCategoryIds.includes(category.id));
  
  return (
      <div className="container mx-auto py-8">
        <Breadcrumbs items={[
          { label: t('title') },
        ]} />
          <h1 className="text-3xl md:text-4xl font-bold mt-12 mb-6 text-center">
            {t('heading')}
          </h1>
          <p className="text-muted-foreground mb-10 max-w-3xl mx-auto text-center leading-7">
            {t('description')}
          </p>
          <div className="max-w-5xl mx-auto mb-14">
            <h2 className="text-xl font-semibold text-center mb-3">{t('popularTitle')}</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {t('popularDescription')}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {popularCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="rounded-full border px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  {t(`categoryNames.${category.id}`, { defaultMessage: category.name })} · {t('gameCount', { count: getGamesByCategory(category.id).length })}
                </Link>
              ))}
            </div>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-center mb-3">{t('allCategoriesTitle')}</h2>
              <p className="text-sm text-muted-foreground text-center max-w-3xl mx-auto">
                {t('allCategoriesDescription')}
              </p>
            </div>
            <GameCategories gameId="all" displayAll={true} showDescription={true} />
          </div>
      </div>
  );
} 
