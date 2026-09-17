/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const BLOG_DIR = path.join(process.cwd(), 'data', 'blog');
const TRANSLATED_BLOG_DIR = path.join(process.cwd(), 'data', 'blog-translations');
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'generated');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function processMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const filePath = path.join(dir, file);
      const slug = file.replace(/\.md$/, '');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContent);

      return {
        slug,
        title: data.title || '',
        date: data.date || '',
        ...(data.updatedAt ? { updatedAt: data.updatedAt } : {}),
        excerpt: data.excerpt || '',
        coverImage: data.coverImage,
        keywords: data.keywords || '',
        author: {
          name: data.author?.name || 'Anonymous',
          picture: data.author?.picture,
        },
        content,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function main() {
  console.log('Generating blog data...');

  ensureDir(OUTPUT_DIR);

  const enPosts = processMarkdownFiles(BLOG_DIR);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'blog-en.json'),
    JSON.stringify(enPosts, null, 2)
  );
  console.log(`Generated ${enPosts.length} English posts`);

  const zhPosts = processMarkdownFiles(path.join(TRANSLATED_BLOG_DIR, 'zh'));
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'blog-zh.json'),
    JSON.stringify(zhPosts, null, 2)
  );
  console.log(`Generated ${zhPosts.length} Chinese posts`);

  const indexContent = `// Auto-generated blog data index
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
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);
  console.log('Generated index.ts');
}

main();
