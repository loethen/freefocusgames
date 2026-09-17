import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ["en", "zh"],

    // Used when no locale matches
    defaultLocale: "en",

    // Default locale doesn't need prefix
    localePrefix: "as-needed",
    // A public URL always serves the same language; the switcher changes the URL.
    localeDetection: false,
    // Page metadata and sitemap know which translations actually exist.
    alternateLinks: false,
});

