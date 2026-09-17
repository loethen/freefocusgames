import { MetadataRoute } from 'next'
import { games } from '../data/games'
import { categories } from '../data/categories'
import { blogData } from '@/data/generated'
import { generateAlternates } from '@/lib/utils'
import { getBlogLocales } from '@/lib/blog'
import { PAGE_UPDATED_AT } from '@/lib/page-updates'

const LOCALES = ['en', 'zh'] // 支持的语言列表
export const revalidate = 86400

function lastModified(path: string): Date | undefined {
  return PAGE_UPDATED_AT[path] ? new Date(PAGE_UPDATED_AT[path]) : undefined;
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
    { path: 'adult-adhd-assessment', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: 'privacy-policy', changeFrequency: 'yearly' as const, priority: 0.4 },
    { path: 'terms-of-service', changeFrequency: 'yearly' as const, priority: 0.4 },
  ]

  return basePages.map((page) => ({
    url: generateAlternates(locale, page.path).canonical,
    lastModified: lastModified(`${localePrefix}${page.path ? `/${page.path}` : ''}` || '/'),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
    alternates: {
      languages: generateAlternates(locale, page.path).languages,
    },
  }))
}

// 生成游戏页面路由
function generateGameRoutes(locale: string): MetadataRoute.Sitemap {
  const localePrefix = locale === 'en' ? '' : `/${locale}`
  return games.map((game) => ({
    url: generateAlternates(locale, `games/${game.slug}`).canonical,
    lastModified: lastModified(`${localePrefix}/games/${game.slug}`),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    alternates: {
      languages: generateAlternates(locale, `games/${game.slug}`).languages,
    },
  }))
}

function generateEnglishOnlyRoutes(): MetadataRoute.Sitemap {
  return [
    '/partnerships',
    '/career-tests',
    '/career-tests/criticall-practice-test',
    '/career-tests/911-dispatcher-typing-test',
  ].map((path) => ({
    url: generateAlternates('en', path, ['en']).canonical,
    lastModified: lastModified(path),
    changeFrequency: 'weekly' as const,
    priority: path === '/career-tests' ? 0.9 : 0.8,
  }))
}

// 生成分类页面路由
function generateCategoryRoutes(locale: string): MetadataRoute.Sitemap {
  const localePrefix = locale === 'en' ? '' : `/${locale}`
  return categories.map((category) => ({
    url: generateAlternates(locale, `categories/${category.slug}`).canonical,
    lastModified: lastModified(`${localePrefix}/categories/${category.slug}`),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
    alternates: {
      languages: generateAlternates(locale, `categories/${category.slug}`).languages,
    },
  }))
}

// 生成博客文章路由
function generateBlogRoutes(locale: string): MetadataRoute.Sitemap {
  const posts = blogData[locale] || []

  return posts.map((post) => ({
    url: generateAlternates(locale, `blog/${post.slug}`).canonical,
    lastModified: post.updatedAt || post.date ? new Date(post.updatedAt || post.date) : undefined,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    alternates: {
      languages: generateAlternates(locale, `blog/${post.slug}`, getBlogLocales(post.slug)).languages,
    },
  }))
}

// 静态生成sitemap
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [...generateEnglishOnlyRoutes()]

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
