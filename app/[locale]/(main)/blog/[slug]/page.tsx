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
import { Link } from '@/i18n/navigation';
import { SITE_BASE_URL } from '@/lib/site-constants';

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

  const pageTitle = post.seoTitle || post.title;
  const pageDescription = post.metaDescription || post.excerpt;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: post.keywords,
    openGraph: {
      images: post.coverImage || "/og/blog.jpg",
      title: pageTitle,
      description: pageDescription,
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

  const baseUrl = SITE_BASE_URL;
  const localePrefix = locale === 'en' ? '' : `/${locale}`;
  const pageUrl = `${baseUrl}${localePrefix}/blog/${slug}`;
  const authorHref = post.author.url || '/about';
  const authorUrl = authorHref.startsWith('http')
    ? authorHref
    : `${baseUrl}${localePrefix}${authorHref.startsWith('/') ? authorHref : `/${authorHref}`}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.coverImage
      ? (post.coverImage.startsWith('http') ? post.coverImage : `${baseUrl}${post.coverImage}`)
      : `${baseUrl}/og/blog.jpg`,
    datePublished: post.date,
    dateModified: post.updatedAt || post.date,
    author: {
      '@type': post.author.type || 'Person',
      name: post.author.name,
      url: authorUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'FreeFocusGames',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/og/oglogo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
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
              <div className="font-medium">
                {authorHref.startsWith('http') ? (
                  <a href={authorHref} target="_blank" rel="noopener noreferrer" className="hover:underline text-foreground">
                    {post.author.name}
                  </a>
                ) : (
                  <Link href={authorHref} className="hover:underline text-foreground">
                    {post.author.name}
                  </Link>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
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

          {post.sources && post.sources.length > 0 && (
            <section
              id="references"
              aria-labelledby="references-heading"
              className="mt-12 pt-8 border-t border-border"
            >
              <h2 id="references-heading" className="text-2xl font-bold mb-4">
                {locale === 'zh' ? '参考文献与权威来源' : 'References & Sources'}
              </h2>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                {post.sources.map((source, index) => (
                  <li key={index}>
                    {source.authors && <span className="font-medium text-foreground">{source.authors} </span>}
                    {source.year && <span>({source.year}). </span>}
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {source.title}
                      </a>
                    ) : (
                      <span className="text-foreground italic">{source.title}</span>
                    )}
                    {source.publisher && <span>. {source.publisher}</span>}
                  </li>
                ))}
              </ol>
            </section>
          )}
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
