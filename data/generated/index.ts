// Auto-generated blog data index
// Do not edit manually - run 'npm run generate-blog' to regenerate

import enPosts from './blog-en.json';
import zhPosts from './blog-zh.json';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  updatedAt?: string;
  excerpt: string;
  coverImage?: string;
  keywords?: string;
  author: {
    name: string;
    picture?: string;
  };
  content: string;
}

export const blogData: Record<string, BlogPost[]> = {
  en: enPosts as BlogPost[],
  zh: zhPosts as BlogPost[],
};
