import { MetadataRoute } from 'next'
import { games } from '../data/games'
import { categories } from '../data/categories'
import { blogData } from '@/data/generated'
import { CONTENT_LAST_UPDATED_DATE, SITE_BASE_URL } from '@/lib/site-constants'

const LOCALES = ['en', 'zh'] // 支持的语言列表
const CAREER_TEST_LAST_UPDATED_DATE = new Date('2026-08-17T00:00:00.000Z')
export const revalidate = 86400

function getLanguages(pagePath: string) {
  const cleanPath = pagePath.replace(/^\/+|\/+$/g, '');
  const pathSuffix = cleanPath ? `/${cleanPath}` : '';
  return {
    en: `${SITE_BASE_URL}${pathSuffix}`,
    zh: `${SITE_BASE_URL}/zh${pathSuffix}`,
  };
}

// 生成基本页面路由
function generateBaseRoutes(locale: string): MetadataRoute.Sitemap {
  const localePrefix = locale === 'en' ? '' : `/${locale}`
  const basePages = [
    { path: '', changeFrequency: 'weekly' as const, priority: 1.0 },
    { path: 'games', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: 'categories', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: 'blog', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: 'about', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: 'tests', changeFrequency: 'monthly' as const, priority: 0.9 },
    { path: 'guides', changeFrequency: 'monthly' as const, priority: 0.9 },
    { path: 'get-started', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: 'working-memory-guide', changeFrequency: 'monthly' as const, priority: 0.9 },
    { path: 'adhd-assessment', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: 'partnerships', changeFrequency: 'monthly' as const, priority: 0.6 },
    { path: 'privacy-policy', changeFrequency: 'yearly' as const, priority: 0.4 },
    { path: 'terms-of-service', changeFrequency: 'yearly' as const, priority: 0.4 },
  ]

  return basePages.map((page) => ({
    url: `${SITE_BASE_URL}${localePrefix}${page.path ? `/${page.path}` : ''}`,
    lastModified: CONTENT_LAST_UPDATED_DATE,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
    alternates: {
      languages: getLanguages(page.path),
    },
  }))
}

// 生成游戏页面路由
function generateGameRoutes(locale: string): MetadataRoute.Sitemap {
  const localePrefix = locale === 'en' ? '' : `/${locale}`
  return games.map((game) => ({
    url: `${SITE_BASE_URL}${localePrefix}/games/${game.slug}`,
    lastModified: CONTENT_LAST_UPDATED_DATE,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    alternates: {
      languages: getLanguages(`games/${game.slug}`),
    },
  }))
}

function generateCareerTestRoutes(): MetadataRoute.Sitemap {
  return [
    '/career-tests',
    '/career-tests/criticall-practice-test',
    '/career-tests/911-dispatcher-typing-test',
  ].map((path) => ({
    url: `${SITE_BASE_URL}${path}`,
    lastModified: CAREER_TEST_LAST_UPDATED_DATE,
    changeFrequency: 'weekly' as const,
    priority: path === '/career-tests' ? 0.9 : 0.8,
  }))
}

// 生成分类页面路由
function generateCategoryRoutes(locale: string): MetadataRoute.Sitemap {
  const localePrefix = locale === 'en' ? '' : `/${locale}`
  return categories.map((category) => ({
    url: `${SITE_BASE_URL}${localePrefix}/categories/${category.slug}`,
    lastModified: CONTENT_LAST_UPDATED_DATE,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
    alternates: {
      languages: getLanguages(`categories/${category.slug}`),
    },
  }))
}

// 生成博客文章路由
function generateBlogRoutes(locale: string): MetadataRoute.Sitemap {
  const localePrefix = locale === 'en' ? '' : `/${locale}`
  const posts = blogData[locale] || blogData.en || []

  return posts.map((post) => ({
    url: `${SITE_BASE_URL}${localePrefix}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : CONTENT_LAST_UPDATED_DATE,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    alternates: {
      languages: getLanguages(`blog/${post.slug}`),
    },
  }))
}

// 静态生成sitemap
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [...generateCareerTestRoutes()]

  for (const locale of LOCALES) {
    routes.push(
      ...generateBaseRoutes(locale),
      ...generateGameRoutes(locale),
      ...generateCategoryRoutes(locale),
      ...generateBlogRoutes(locale)
    )
  }

  return routes
}
