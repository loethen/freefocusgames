// Blog data access layer
// Uses pre-generated JSON data for Cloudflare edge runtime compatibility

import { blogData, BlogPost } from '@/data/generated';

export type { BlogPost } from '@/data/generated';

export interface BlogAuthor {
  name: string;
  picture?: string;
}

export interface PostNavigation {
  previousPost: BlogPost | null;
  nextPost: BlogPost | null;
}

// Get all blog posts for a locale
export async function getBlogPosts(locale: string = 'en'): Promise<BlogPost[]> {
  return blogData[locale] || [];
}

export function getBlogLocales(slug: string): string[] {
  return Object.keys(blogData).filter(locale => blogData[locale].some(post => post.slug === slug));
}

// Never silently render an English article at an indexable Chinese URL.
export async function getBlogPost(slug: string, locale: string = 'en'): Promise<BlogPost | null> {
  return (await getBlogPosts(locale)).find(post => post.slug === slug) || null;
}

// Get navigation (previous/next) for a blog post
export async function getPostNavigation(slug: string, locale: string = 'en'): Promise<PostNavigation> {
  const posts = await getBlogPosts(locale);
  const currentIndex = posts.findIndex(post => post.slug === slug);

  if (currentIndex === -1 || posts.length <= 1) {
    return {
      previousPost: null,
      nextPost: null
    };
  }

  // Sort is by date descending, so next (newer) has smaller index
  const previousPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? posts[currentIndex - 1] : null;

  return {
    previousPost,
    nextPost
  };
}