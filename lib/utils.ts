import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { routing } from '@/i18n/routing';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 生成元数据中的alternates属性，用于支持多语言SEO
 * @param locale 当前语言
 * @param pagePath 当前页面路径（不包含语言前缀）
 * @returns 包含canonical和languages的alternates对象
 */
export function generateAlternates(locale: string, pagePath: string = '') {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.freefocusgames.com").replace(/\/+$/, '');
  const cleanPath = pagePath.replace(/^\/+|\/+$/g, '');
  const pathSuffix = cleanPath ? `/${cleanPath}` : '';
  
  // 为所有支持的语言创建备选语言链接
  const alternateLanguages = routing.locales.reduce((acc, lang) => {
    acc[lang] = `${baseUrl}${lang === 'en' ? '' : `/${lang}`}${pathSuffix}`;
    return acc;
  }, {} as Record<string, string>);
  alternateLanguages['x-default'] = `${baseUrl}${pathSuffix}`;
  
  return {
    canonical: `${baseUrl}${locale === 'en' ? '' : `/${locale}`}${pathSuffix}`,
    languages: alternateLanguages,
  };
}

export function formatDate(date: string, locale: string): string {
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return date;
  }
}
