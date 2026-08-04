import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const handleI18nRouting = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // sitemap.xml 和 robots.txt 直接放行
    if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
        return NextResponse.next();
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
    }

    // 让next-intl处理其余的路由逻辑
    return handleI18nRouting(request);
}

export const config = {
    // 匹配所有路径除了API、静态资源、sitemap.xml、robots.txt等
    matcher: [
        // 包含所有页面路径，但排除 sitemap.xml 和 robots.txt 以及常见的静态资源文件
        "/((?!api|embedded|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav|ogg|mp4|webm|txt|xml|json)$).*)",
    ],
};
