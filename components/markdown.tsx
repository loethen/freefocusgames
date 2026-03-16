import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { InteractiveGameDemo } from './interactive-game-demo';

interface MarkdownProps {
  content: string;
}

const components: Components = {
  // 优化图片渲染
  img: ({ src, alt }) => {
    if (!src) return null;
    
    return (
      <div className="relative h-64 w-full my-6 rounded-lg overflow-hidden md:h-[400px]">
        <Image
          src={src}
          alt={alt || ''}
          fill
          className="object-cover"
        />
      </div>
    );
  },
  // 支持figure标签和figcaption
  figure: ({ children }) => (
    <figure className="my-8">
      {children}
    </figure>
  ),
  figcaption: ({ children }) => (
    <figcaption className="text-center text-sm text-muted-foreground mt-2 italic">
      {children}
    </figcaption>
  ),
  // 优化引用块
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary pl-4 py-1 my-6 bg-muted/50 rounded-r-md">
      {children}
    </blockquote>
  ),
  // 优化标题
  h2: ({ children }) => (
    <h2 className="text-2xl font-bold mt-10 mb-6 border-b pb-2">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-semibold mt-8 mb-4 text-primary">
      {children}
    </h3>
  ),
  // 优化段落
  p: ({ children }) => (
    <p className="leading-relaxed mb-5 text-[17px]">
      {children}
    </p>
  ),
  // 优化链接
  a: ({ href, children }) => {
    // 外部链接
    if (href && (href.startsWith('http') || href.startsWith('//'))) {
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
        >
          {children}
        </a>
      );
    }
    
    // 内部链接
    return href ? (
      <Link href={href} className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
        {children}
      </Link>
    ) : null;
  },
  // 优化代码渲染
  code: ({ className, children }) => {
    if (className) {
      return (
        <code className={`${className} rounded p-1`}>
          {children}
        </code>
      );
    }
    return <code className="bg-muted text-muted-foreground rounded px-1 py-0.5">{children}</code>;
  },
  // 优化水平分割线
  hr: () => <hr className="my-10 border-t border-muted-foreground/20" />,
  table: ({ children }) => (
    <div className="my-8 overflow-x-auto rounded-xl border border-border bg-background shadow-sm">
      <table className="w-full min-w-[640px] border-collapse text-left text-base">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/70">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-border">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="border-b border-border/80 last:border-b-0 even:bg-muted/30">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-sm font-semibold tracking-normal text-foreground align-top">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-sm leading-6 text-foreground/85 align-top">
      {children}
    </td>
  ),
  caption: ({ children }) => (
    <caption className="px-4 py-3 text-sm text-muted-foreground caption-bottom">
      {children}
    </caption>
  )
};

export default function Markdown({ content }: MarkdownProps) {
  // 处理GameDemo占位符
  const renderContent = () => {
    const sectionsWithGameDemo = content.split('*[Interactive GameDemo component would be embedded here]*');

    return sectionsWithGameDemo.map((section, index) => (
      <React.Fragment key={index}>
        <ReactMarkdown
          components={components}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSlug]}
        >
          {section.trim()}
        </ReactMarkdown>

        {/* 插入GameDemo组件 */}
        {index < sectionsWithGameDemo.length - 1 && <InteractiveGameDemo />}
      </React.Fragment>
    ));
  };

  return (
    <div className="max-w-none">
      {renderContent()}
    </div>
  );
}
