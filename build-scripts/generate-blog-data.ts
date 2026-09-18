/**
 * Pre-build script to convert markdown blog posts to JSON
 * Run this before `next build` to generate blog data that can be imported
 * without fs access in edge runtime
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface BlogSource {
    title: string;
    url?: string;
    authors?: string;
    year?: string | number;
    publisher?: string;
}

interface BlogPost {
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

const BLOG_DIR = path.join(process.cwd(), 'data', 'blog');
const TRANSLATED_BLOG_DIR = path.join(process.cwd(), 'data', 'blog-translations');
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'generated');

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function processMarkdownFiles(dir: string): BlogPost[] {
    if (!fs.existsSync(dir)) {
        return [];
    }

    const files = fs.readdirSync(dir);
    const posts = files
        .filter((file) => file.endsWith('.md'))
        .map((file) => {
            const filePath = path.join(dir, file);
            const slug = file.replace(/\.md$/, '');
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const { data, content } = matter(fileContent);

            return {
                slug,
                title: data.title || '',
                ...(data.seoTitle ? { seoTitle: data.seoTitle } : {}),
                ...(data.metaDescription ? { metaDescription: data.metaDescription } : {}),
                date: data.date || '',
                ...(data.updatedAt ? { updatedAt: data.updatedAt } : {}),
                excerpt: data.excerpt || '',
                coverImage: data.coverImage,
                keywords: data.keywords || '',
                ...(Array.isArray(data.sources) && data.sources.length > 0 ? { sources: data.sources } : {}),
                author: {
                    name: data.author?.name || 'Anonymous',
                    ...(data.author?.type ? { type: data.author.type } : {}),
                    picture: data.author?.picture,
                    ...(data.author?.url ? { url: data.author.url } : {}),
                },
                content,
            };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return posts;
}

function main() {
    console.log('📝 Generating blog data...');

    ensureDir(OUTPUT_DIR);

    // Process English posts
    const enPosts = processMarkdownFiles(BLOG_DIR);
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'blog-en.json'),
        JSON.stringify(enPosts, null, 2)
    );
    console.log(`  ✓ Generated ${enPosts.length} English posts`);

    // Process Chinese translations
    const zhDir = path.join(TRANSLATED_BLOG_DIR, 'zh');
    const zhPosts = processMarkdownFiles(zhDir);
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'blog-zh.json'),
        JSON.stringify(zhPosts, null, 2)
    );
    console.log(`  ✓ Generated ${zhPosts.length} Chinese posts`);

    // Generate index file for easy imports
    const indexContent = `// Auto-generated blog data index
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
`;

    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);
    console.log('  ✓ Generated index.ts');

    console.log('✅ Blog data generation complete!');
}

main();
