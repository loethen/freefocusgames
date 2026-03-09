import { getBlogPosts } from '@/lib/blog';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/breadcrumb';
import { generateAlternates } from '@/lib/utils';

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({
        locale,
        namespace: "blog",
    });

    return {
        title: t("meta.title"),
        description: t("meta.description"),
        openGraph: {
            images: "/og/blog.jpg",
        },
        alternates: generateAlternates(locale, "blog"),
    };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'blog' });
  const commonT = await getTranslations({ locale, namespace: 'common' });
  const posts = await getBlogPosts(locale);
  
  return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb 
            items={[
              { label: t('title') }
            ]}
            homeLabel={commonT('home')}
            locale={locale}
          />
          
          <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
          <p className="text-muted-foreground mb-8">{t('description')}</p>
          
          <div className="grid gap-8">
            {posts.map((post) => (
                <article key={post.slug} className="border rounded-lg overflow-hidden shadow-xs hover:shadow-md transition-shadow">
                  <Link href={`/${locale}/blog/${post.slug}`}>
                    <div className="grid md:grid-cols-[1fr_2fr]">
                      {post.coverImage && (
                        <div className="relative h-48 md:h-full">
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                        <div className="text-sm text-muted-foreground mb-3">
                          {formatDate(post.date, locale)}
                        </div>
                        <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                        <div className="flex items-center">
                          {post.author.picture && (
                            <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2">
                              <Image
                                src={post.author.picture}
                                alt={post.author.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <span className="text-sm">{post.author.name}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
            ))}
          </div>
        </div>
      </div>
  );
} 
