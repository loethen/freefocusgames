import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { isPathAvailable } from "@/lib/locale-availability";

// 定义面包屑项的接口
export interface BreadcrumbItem {
    label: string;
    href?: string; // 可选，如果没有则表示当前页面
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
    const t = useTranslations("common");
    const locale = useLocale();

    return (
        <nav className={`text-sm mb-4 ${className}`} aria-label="Breadcrumb">
            <ol className="flex items-center flex-wrap gap-1 text-muted-foreground">
                {/* 首页始终是第一个项目 */}
                <li>
                    <Link
                        href="/"
                        className="hover:text-foreground transition-colors"
                    >
                        {t("home")}
                    </Link>
                </li>

                {/* 动态生成其余的面包屑项 */}
                {items.map((item, index) => (
                    <li key={index} className="flex items-center">
                        <ChevronRight className="h-4 w-4 mx-1" />
                        {/* A parent page missing in this language is shown as plain text. */}
                        {item.href && isPathAvailable(locale, item.href) ? (
                            <Link
                                href={item.href}
                                className="hover:text-foreground transition-colors"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-foreground font-medium">
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
