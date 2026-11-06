// Formatting and metadata codes for each site locale. Use these instead of
// `locale === 'zh' ? … : …` so a new locale never falls into the English branch.
const LOCALE_META = {
    en: { label: "English", intl: "en-US", openGraph: "en_US", schema: "en" },
    zh: { label: "中文", intl: "zh-CN", openGraph: "zh_CN", schema: "zh-CN" },
    ja: { label: "日本語", intl: "ja-JP", openGraph: "ja_JP", schema: "ja" },
} as const;

export type LocaleMeta = (typeof LOCALE_META)[keyof typeof LOCALE_META];

export function getLocaleMeta(locale: string): LocaleMeta {
    return LOCALE_META[locale as keyof typeof LOCALE_META] ?? LOCALE_META.en;
}
