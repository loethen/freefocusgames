import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const messageCache = new Map<string, Record<string, unknown>>();

const COMPILED_MESSAGES = {
    en: () => import("../messages/en/compiled.json"),
    zh: () => import("../messages/zh/compiled.json"),
    ja: () => import("../messages/ja/compiled.json"),
} as const;

// Japanese is translated page by page. Untranslated keys fall back to English so
// shared components never print raw keys; only pages listed in i18n/ja-pages.json
// are served under /ja/, and `npm run check:i18n` requires those to be complete.
const FALLBACK_TO_ENGLISH = new Set(["ja"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeMessages(base: Record<string, unknown>, override: Record<string, unknown>) {
    const merged: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(override)) {
        merged[key] = isPlainObject(value) && isPlainObject(merged[key])
            ? mergeMessages(merged[key] as Record<string, unknown>, value)
            : value;
    }
    return merged;
}

async function loadMessages(locale: string) {
    // Development reloads must pick up edits to the compiled translations.
    const cacheMessages = process.env.NODE_ENV === "production";
    const cachedMessages = cacheMessages ? messageCache.get(locale) : undefined;
    if (cachedMessages) {
        return cachedMessages;
    }

    const loader = COMPILED_MESSAGES[locale as keyof typeof COMPILED_MESSAGES] ?? COMPILED_MESSAGES[routing.defaultLocale];
    let messages = (await loader()).default as Record<string, unknown>;
    if (FALLBACK_TO_ENGLISH.has(locale)) {
        const english = (await COMPILED_MESSAGES.en()).default as Record<string, unknown>;
        messages = mergeMessages(english, messages);
    }

    if (cacheMessages) {
        messageCache.set(locale, messages);
    }
    return messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = hasLocale(routing.locales, requested)
        ? requested
        : routing.defaultLocale;

    return {
        locale,
        messages: await loadMessages(locale),
    };
});
