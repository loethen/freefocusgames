import { getCategoryBySlug, categories } from "@/data/categories";
import { getGamesByCategory } from "@/data/games";
import GameCard from "@/components/game-card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from "@/i18n/routing";
import { generateAlternates } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-static";
export const revalidate = 86400;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    categories.map((category) => ({
      locale,
      slug: category.slug,
    }))
  );
}

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const category = getCategoryBySlug(slug);

  // Load translations once with a merged namespace
  const t = await getTranslations({ locale, namespace: 'categories' });

  if (!category) {
    return {
      title: t('categoryNotFound'),
      description: t('categoryNotFoundDesc')
    };
  }

  const categoryName = t(`categoryNames.${category.id}`, { defaultMessage: category.name });
  const categoryDescription = t(`categoryDescriptions.${category.id}`, { defaultMessage: category.description });

  // 翻译关键词
  let translatedKeywords = '';
  if (category.keywords && category.keywords.length > 0) {
    try {
      // Use the same translation function by adjusting the path structure in translation files
      const translatedKeywordsArray = category.keywords.map(keyword =>
        t(`keywords.${category.id}.${keyword}`, { defaultMessage: keyword })
      );
      translatedKeywords = translatedKeywordsArray.join(", ");
    } catch {
      // 如果翻译失败，使用原始关键词
      translatedKeywords = category.keywords.join(", ");
    }
  } else {
    translatedKeywords = `${categoryName.toLowerCase()} games, brain training, cognitive enhancement`;
  }

  return {
    title: t('categoryMetaTitle', {
      categoryName: categoryName
    }),
    description: t('categoryMetaDescription', {
      categoryName: categoryName,
      categoryDescription: categoryDescription
    }),
    keywords: translatedKeywords.split(",").map((keyword) => keyword.trim()).filter(Boolean),
    openGraph: {
      title: t('categoryOgTitle', {
        categoryName: categoryName
      }),
      description: t('categoryOgDescription', {
        categoryName: categoryName
      }),
      images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
    },
    alternates: generateAlternates(locale, `categories/${slug}`),
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const category = getCategoryBySlug(slug);

  if (!category) {
    return <div>Category not found</div>;
  }

  const games = getGamesByCategory(category.id);

  // 获取服务器端翻译
  const t = await getTranslations({ locale, namespace: 'categories' });
  const categoryName = t(`categoryNames.${category.id}`, { defaultMessage: category.name });
  const categoryDescription = t(`categoryDescriptions.${category.id}`, { defaultMessage: category.description });
  const categoryGamesHeading = t('categoryGamesHeading', { categoryName: categoryName });
  const categoriesTitle = t('title');
  const categoryIntro = t('categoryIntro', { categoryName });

  return (
    <div className="max-w-7xl mx-auto py-8">
      <Breadcrumbs
        items={[
          { label: categoriesTitle, href: "/categories" },
          { label: categoryName },
        ]}
      />

      <h1 className="text-3xl md:text-4xl font-bold mt-12 mb-6 text-center">
        {categoryGamesHeading}
      </h1>
      <p className="mb-4 max-w-4xl mx-auto text-center leading-8 text-foreground/90">{categoryDescription}</p>
      <p className="mb-8 max-w-3xl mx-auto text-center text-sm text-muted-foreground leading-7">{categoryIntro}</p>
      <div className="mb-12 text-center">
        <Link href="/categories" className="text-sm text-primary hover:underline">
          {t('backToAll')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {games.map((game) => (
          <GameCard key={game.id} game={game} preview={game.preview} />
        ))}
      </div>
    </div>
  );
} 
