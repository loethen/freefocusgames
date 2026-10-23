import { getBlogPosts, type BlogPost } from '@/lib/blog';
import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/utils';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import LinkClickTracker from '@/components/link-click-tracker';
import { generateAlternates } from '@/lib/utils';

export const dynamic = "force-static";
export const revalidate = false;

// Articles are grouped by the games and tests they go with, not by date.
const TOPICS = ['reaction', 'memory', 'attention', 'adhd'] as const;

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
  const guidesT = await getTranslations({ locale, namespace: 'guides' });
  const posts = (await getBlogPosts(locale)).filter((post) => !post.noindex);

  const rowClass = "group flex items-start gap-4 rounded-2xl px-4 py-4 transition-colors hover:bg-background/80 focus-visible:bg-background/80 focus-visible:outline-none sm:px-5";

  const renderPost = (post: BlogPost) => (
    <li key={post.slug}>
      <Link href={`/blog/${post.slug}`} className={rowClass}>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-base font-semibold leading-snug tracking-tight">{post.title}</h3>
          <span className="line-clamp-2 text-sm leading-6 text-muted-foreground">{post.excerpt}</span>
          <span className="text-xs text-muted-foreground">
            {formatDate(post.updatedAt || post.date, locale)}
          </span>
        </span>
        <ArrowRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    </li>
  );

  return (
      <LinkClickTracker fromPage="blog" className="mx-auto max-w-3xl py-8">
        <Breadcrumb
          items={[
            { label: t('title') }
          ]}
          homeLabel={commonT('home')}
          locale={locale}
        />

        <header className="mt-10 mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t('title')}</h1>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">{t('description')}</p>
        </header>

        <div className="space-y-10">
          {TOPICS.map((topic) => {
            const topicPosts = posts.filter((post) => post.topic === topic);
            const showGuide = topic === 'memory';
            if (!topicPosts.length && !showGuide) return null;

            return (
              <section key={topic} aria-labelledby={`blog-${topic}`} data-link-location={`blog_${topic}`}>
                <h2 id={`blog-${topic}`} className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {t(`topics.${topic}`)}
                </h2>
                <ul className="flex flex-col gap-1 rounded-[2rem] bg-muted/50 p-2">
                  {showGuide && (
                    <li>
                      <Link href="/working-memory-guide" className={rowClass}>
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="flex items-center gap-2">
                            <h3 className="text-base font-semibold leading-snug tracking-tight">{guidesT('workingMemory.title')}</h3>
                            <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {t('guideBadge')}
                            </span>
                          </span>
                          <span className="line-clamp-2 text-sm leading-6 text-muted-foreground">{t('guideDescription')}</span>
                        </span>
                        <ArrowRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </li>
                  )}
                  {topicPosts.map(renderPost)}
                </ul>
              </section>
            );
          })}
        </div>
      </LinkClickTracker>
  );
}
