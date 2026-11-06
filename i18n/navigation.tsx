import type { ComponentProps } from "react";
import { useLocale } from "next-intl";
import { createNavigation } from "next-intl/navigation";
import { isPathAvailable } from "@/lib/locale-availability";
import { routing } from "./routing";

// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
const {
    Link: BaseLink,
    redirect,
    usePathname,
    useRouter,
    getPathname,
} = createNavigation(routing);

type LinkProps = ComponentProps<typeof BaseLink>;

function hrefPath(href: LinkProps["href"]): string | null {
    const path = typeof href === "string" ? href : href.pathname;
    return typeof path === "string" && path.startsWith("/") ? path : null;
}

// A page without a translation in the current language (Japanese is rolled out
// page by page) links to its English version instead of a redirecting URL.
export function Link({ locale, href, ...props }: LinkProps) {
    const currentLocale = useLocale();
    const targetLocale = locale ?? currentLocale;
    const path = hrefPath(href);
    const resolvedLocale = path && !isPathAvailable(targetLocale, path)
        ? routing.defaultLocale
        : locale;
    return <BaseLink href={href} locale={resolvedLocale} {...props} />;
}

export { redirect, usePathname, useRouter, getPathname };
