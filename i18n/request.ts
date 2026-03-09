import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const I18N_MODULES = [
    'common',
    'metadata',
    'workingMemoryGuide',
    'home',
    'typesOfGames',
    'adhdAssessment',
    'adultAdhdAssessment',
    'categories',
    'games',
    'buttons',
    'blog',
    'getStarted',
    'about',
    'legal',
    'tests',
    'guides',
] as const;

const messageCache = new Map<string, Record<string, unknown>>();

async function loadMessages(locale: string) {
    const cachedMessages = messageCache.get(locale);
    if (cachedMessages) {
        return cachedMessages;
    }

    const modules = await Promise.all(
        I18N_MODULES.map(async (module) => {
            try {
                return (await import(`../messages/${locale}/${module}.json`)).default as Record<string, unknown>;
            } catch {
                console.warn(`i18n module not found: ${locale}/${module}.json`);
                return null;
            }
        })
    );

    const messages = modules.reduce<Record<string, unknown>>((accumulator, moduleMessages) => {
        if (moduleMessages) {
            Object.assign(accumulator, moduleMessages);
        }
        return accumulator;
    }, {});

    messageCache.set(locale, messages);
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
