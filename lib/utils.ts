import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { routing } from '@/i18n/routing';
import { SITE_BASE_URL } from '@/lib/site-constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 生成元数据中的alternates属性，用于支持多语言SEO
 * @param locale 当前语言
 * @param pagePath 当前页面路径（不包含语言前缀）
 * @returns 包含canonical和languages的alternates对象
 */
export function generateAlternates(
  locale: string,
  pagePath: string = '',
  availableLocales: readonly string[] = routing.locales
) {
  const cleanPath = pagePath.split(/[?#]/, 1)[0].replace(/^\/+|\/+$/g, '');
  const pageUrl = (lang: string) =>
    `${SITE_BASE_URL}${lang === 'en' ? '' : `/${lang}`}${cleanPath ? `/${cleanPath}` : ''}`;
  const languages = Object.fromEntries(availableLocales.map(lang => [lang, pageUrl(lang)]));
  if (availableLocales.length) {
    languages['x-default'] = pageUrl(availableLocales.includes('en') ? 'en' : availableLocales[0]);
  }
  return { canonical: pageUrl(locale), languages };
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
