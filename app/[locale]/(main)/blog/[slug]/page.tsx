import { getBlogPosts, getBlogPost, getPostNavigation, getBlogLocales } from '@/lib/blog';
import { notFound, permanentRedirect } from 'next/navigation';
import Image from 'next/image';
import { formatDate, generateAlternates } from '@/lib/utils';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import Markdown from '@/components/markdown';
import { Breadcrumb } from '@/components/breadcrumb';
import { PostNavigation } from '@/components/post-navigation';
import { ShareButton } from '@/components/share-button';
import { routing } from '@/i18n/routing';

async function getLocalizedPost(slug: string, locale: string) {
  const post = await getBlogPost(slug, locale);
  if (post) return post;
  const locales = getBlogLocales(slug);
  if (!locales.length) notFound();
  const fallbackLocale = locales.includes('en') ? 'en' : locales[0];
  permanentRedirect(`${fallbackLocale === 'en' ? '' : `/${fallbackLocale}`}/blog/${slug}`);
}

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  const params = [];
  for (const locale of routing.locales) {
    const posts = await getBlogPosts(locale);
    for (const post of posts) {
      params.push({ locale, slug: post.slug });
    }
  }
  return params;
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; slug: string }> }
): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = await getLocalizedPost(slug, locale);

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.keywords,
    openGraph: {
      images: post.coverImage || "/og/blog.jpg",
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updatedAt || post.date,
    },
    alternates: generateAlternates(locale, `blog/${slug}`, getBlogLocales(slug)),
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'blog' });
  const commonT = await getTranslations({ locale, namespace: 'common' });
  const post = await getLocalizedPost(slug, locale);

  const navigation = await getPostNavigation(slug, locale);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Breadcrumb
          items={[
            { label: t('title'), href: '/blog' },
            { label: t('currentArticle') }
          ]}
          homeLabel={commonT('home')}
          locale={locale}
        />

        <article>
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center mb-6">
            {post.author.picture && (
              <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
                <Image
                  src={post.author.picture}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <div className="font-medium">{post.author.name}</div>
              <div className="text-sm text-muted-foreground">
                {formatDate(post.date, locale)}
                {post.updatedAt && (
                  <span> · {locale === 'zh' ? '更新于' : 'Updated'} <time dateTime={post.updatedAt}>{formatDate(post.updatedAt, locale)}</time></span>
                )}
              </div>
            </div>
          </div>

          {post.coverImage && (
            <div className="relative h-[300px] md:h-[400px] mb-8 rounded-lg overflow-hidden">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="mb-8">
            <ShareButton title={post.title} />
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none post-ul-list">
            <Markdown content={post.content} />
          </div>
        </article>

        <PostNavigation
          previousPost={navigation.previousPost}
          nextPost={navigation.nextPost}
          locale={locale}
          labels={{
            previousPost: t('previousPost'),
            nextPost: t('nextPost')
          }}
        />
      </div>
    </div>
  );
} 
