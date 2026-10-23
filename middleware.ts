import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const handleI18nRouting = createMiddleware(routing);

// Old or mistyped URLs that still receive search impressions.
const legacyRedirects: Record<string, string> = {
    '/partnerships': '/about',
    '/challenge-10-seconds': '/games/challenge-10-seconds',
    '/pomodoro-timer': '/games/pomodoro-timer',
    '/stroop-effect-test': '/games/stroop-effect-test',
    '/games/challenge-10s': '/games/challenge-10-seconds',
    '/games/free-focus-games': '/games',
    '/blog/the-science-of-stroop-effect-cognitive-control': '/blog/the-science-of-stroop-effect-cognitive-flexibility-training',
    '/blog/how-watching-jim-kwik-memory-video-changed-the-way-i-improve-memory': '/blog/how-to-improve-short-term-memory',
};

function getLegacyRedirect(pathname: string) {
    const match = pathname.match(/^(\/zh)?(\/.*)$/);
    if (!match) return null;
    const [, localePrefix = '', path] = match;
    const target = legacyRedirects[path]
        ?? (path.startsWith('/games/games/') ? path.replace(/^\/games\/games\//, '/games/') : null);
    return target ? localePrefix + target : null;
}

export default async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // sitemap.xml 和 robots.txt 直接放行
    if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
        return NextResponse.next();
    }

    // Career Tests are intentionally English-only. Keep their public URLs
    // unprefixed and ignore any previously selected site-language cookie.
    if (/^\/(?:en|zh)\/career-tests(?:\/|$)/.test(pathname)) {
        const englishOnlyPath = pathname.replace(/^\/(?:en|zh)/, '') || '/career-tests';
        return NextResponse.redirect(
            new URL(englishOnlyPath + request.nextUrl.search, request.url),
            301
        );
    }

    if (/^\/career-tests(?:\/|$)/.test(pathname)) {
        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = `/en${pathname}`;
        return NextResponse.rewrite(rewriteUrl);
    }

    // 检查路径是否以无效的语言前缀开头
    const pathSegments = pathname.split('/').filter(Boolean);

    if (pathSegments.length > 0) {
        const firstSegment = pathSegments[0];

        // 定义已知的无效语言代码（之前支持但现在不支持的）
        const removedLanguageCodes = ['de', 'ja', 'es', 'ko', 'fr', 'jp'];

        if (removedLanguageCodes.includes(firstSegment)) {
            // 移除这些已知的无效语言前缀，重定向到正确的路径
            const newPath = '/' + pathSegments.slice(1).join('/');
            const searchParams = request.nextUrl.search;

            return NextResponse.redirect(new URL(newPath + searchParams, request.url), 301);
        }

        // English is unprefixed; make the /en alias a permanent redirect
        // instead of next-intl's default 307.
        if (firstSegment === 'en') {
            const newPath = '/' + pathSegments.slice(1).join('/');
            return NextResponse.redirect(new URL(newPath + request.nextUrl.search, request.url), 301);
        }
    }

    const legacyTarget = getLegacyRedirect(pathname);
    if (legacyTarget) {
        return NextResponse.redirect(new URL(legacyTarget + request.nextUrl.search, request.url), 301);
    }

    // 让next-intl处理其余的路由逻辑
    return handleI18nRouting(request);
}

export const config = {
    // 匹配所有路径除了API、静态资源、sitemap.xml、robots.txt等
    matcher: [
        // 包含所有页面路径，但排除 sitemap.xml 和 robots.txt 以及常见的静态资源文件
        "/((?!api|embedded|captioncat|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav|ogg|mp4|webm|txt|xml|json)$).*)",
    ],
};
