import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const messageCache = new Map<string, Record<string, unknown>>();

const COMPILED_MESSAGES = {
    en: () => import("../messages/en/compiled.json"),
    zh: () => import("../messages/zh/compiled.json"),
} as const;

async function loadMessages(locale: string) {
    // Development reloads must pick up edits to the compiled translations.
    const cacheMessages = process.env.NODE_ENV === "production";
    const cachedMessages = cacheMessages ? messageCache.get(locale) : undefined;
    if (cachedMessages) {
        return cachedMessages;
    }

    const loader = COMPILED_MESSAGES[locale as keyof typeof COMPILED_MESSAGES] ?? COMPILED_MESSAGES[routing.defaultLocale];
    const messages = (await loader()).default as Record<string, unknown>;

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
