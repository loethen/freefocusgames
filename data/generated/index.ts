// Auto-generated blog data index
// Do not edit manually - run 'npm run generate-blog' to regenerate

import enPosts from './blog-en.json';
import zhPosts from './blog-zh.json';

export interface BlogSource {
  title: string;
  url?: string;
  authors?: string;
  year?: string | number;
  publisher?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  seoTitle?: string;
  metaDescription?: string;
  date: string;
  updatedAt?: string;
  excerpt: string;
  coverImage?: string;
  keywords?: string;
  sources?: BlogSource[];
  author: {
    name: string;
    type?: 'Person' | 'Organization';
    picture?: string;
    url?: string;
  };
  content: string;
}

export const blogData: Record<string, BlogPost[]> = {
  en: enPosts as BlogPost[],
  zh: zhPosts as BlogPost[],
};
