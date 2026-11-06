import jaPages from "@/i18n/ja-pages.json";
import { routing } from "@/i18n/routing";

// Locales that every translated page has. Japanese is listed page by page in
// i18n/ja-pages.json, so an untranslated page never appears under /ja/.
const FULL_LOCALES: readonly string[] = ["en", "zh"];
const JA_PATHS = new Set(Object.keys(jaPages.pages));

export function normalizePagePath(path: string): string {
    return path.split(/[?#]/, 1)[0].replace(/^\/+|\/+$/g, "");
}

// True for locales that have every page; Japanese has only the pages listed in the registry.
export function isFullLocale(locale: string): boolean {
    return FULL_LOCALES.includes(locale);
}

export function isPathAvailable(locale: string, path: string): boolean {
    if (FULL_LOCALES.includes(locale)) return true;
    if (locale === "ja") return JA_PATHS.has(normalizePagePath(path));
    return false;
}

export function getPageLocales(path: string): string[] {
    return routing.locales.filter((locale) => isPathAvailable(locale, path));
}

export function pageLocaleParams(path: string) {
    return getPageLocales(path).map((locale) => ({ locale }));
}

// Game lists on a page show only games that exist in the page's language.
export function filterGamesForLocale<T extends { slug: string }>(locale: string, items: readonly T[]): T[] {
    return items.filter((item) => isPathAvailable(locale, `games/${item.slug}`));
}
