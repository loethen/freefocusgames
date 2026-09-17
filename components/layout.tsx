"use client";

import { Link } from "@/i18n/navigation";
import { Header } from "./header"
import { useState, useEffect, useCallback } from "react"
import { Footer } from "./Footer"
import { useLocale, useTranslations } from 'next-intl';

export function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const t = useTranslations('common');
    const locale = useLocale();
    // CSS chooses the initial viewport layout before hydration.
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 1024px)");

        const handleMediaChange = (e: MediaQueryListEvent) => {
            const isDesktop = e.matches;
            setIsSidebarOpen(isDesktop);
            setIsMobile(!isDesktop);
        };

        // Initialize state based on actual client window
        const isDesktop = mediaQuery.matches;
        setIsSidebarOpen(isDesktop);
        setIsMobile(!isDesktop);

        mediaQuery.addEventListener("change", handleMediaChange);
        return () =>
            mediaQuery.removeEventListener("change", handleMediaChange);
    }, []);

    // 在导航链接中添加移动端点击关闭侧边栏的逻辑
    const navLinkClick = useCallback(() => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    }, [isMobile]);

    // 将NavItem移动到Layout组件内部
    const NavItem = ({
        href,
        children,
    }: {
        href: string;
        children: React.ReactNode;
    }) => (
        <Link
            href={href}
            onClick={navLinkClick}
            className="block hover:bg-accent p-2 rounded text-foreground font-semibold relative hover:pl-3 transition-all duration-200
               after:content-['→'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 
               after:opacity-0 hover:after:opacity-100 after:transition-opacity"
        >
            {children}
        </Link>
    );

    return (
        <div className="min-h-screen">
            <Header onToggleSidebar={() => setIsSidebarOpen(open => !(open ?? !isMobile))} />

            {/* Sidebar */}
            <div
                className={`
          fixed top-0 h-screen
          w-full lg:w-[180px]
          flex pt-40
          transform transition-all duration-300 ease-in-out
          shadow-lg lg:shadow-none
          bg-background/50 backdrop-blur-lg z-30 lg:bg-transparent
          ${isSidebarOpen === null
                        ? "invisible -translate-x-full opacity-0 pointer-events-none lg:visible lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto"
                        : isSidebarOpen
                            ? "visible translate-x-0 opacity-100"
                            : "invisible -translate-x-full opacity-0 pointer-events-none"
                    }
        `}
            >
                <nav className="w-full space-y-1 pl-4 text-sm">
                    <NavItem href="/">{t('home')}</NavItem>
                    <NavItem href="/categories">{t('categories')}</NavItem>
                    <NavItem href="/games">{t('games')}</NavItem>
                    {locale === "en" && (
                        <NavItem href="/career-tests">Career Tests</NavItem>
                    )}
                    <NavItem href="/tests">{t('tests')}</NavItem>
                    <NavItem href="/guides">{t('guides')}</NavItem>
                    <NavItem href="/blog">{t('blog')}</NavItem>
                    <NavItem href="/about">{t('about')}</NavItem>
                </nav>
            </div>

            {/* Main content */}
            <div className="flex">
                <aside
                    className={`w-0 shrink-0 transition-[width] duration-300 ease-in-out motion-reduce:transition-none ${isSidebarOpen !== false ? "lg:w-[180px]" : ""}`}
                />
                <main
                    className="min-w-0 w-full flex-1 px-4 md:px-8 bg-background"
                >
                    {children}

                    <Footer />
                </main>
            </div>
        </div>
    );
}
