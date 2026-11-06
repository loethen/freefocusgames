import { PanelLeft, Globe, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { routing } from "@/i18n/routing"
import { isPathAvailable } from "@/lib/locale-availability"
import { getLocaleMeta } from "@/lib/locale-meta"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// 语言切换下拉菜单组件
function LanguageSwitcher() {
  const pathname = usePathname()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const t = useTranslations('common')
  const router = useRouter()
  
  // 修改语言切换处理函数，在切换后刷新路由缓存
  const handleLocaleChange = (newLocale: string) => {
    setOpen(false)
    
    router.replace(pathname, { locale: newLocale })
    // startTransition(() => {
      // 先替换当前路径的语言
      // 然后刷新路由缓存，确保语言设置正确传播
      // router.refresh()
    // })
  }
  
  // 只列出当前页面实际存在的语言（日语逐页上线）
  const availableLocales = routing.locales.filter((l) => isPathAvailable(l, pathname))

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1 text-muted-foreground" aria-label={t('language')}>
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{getLocaleMeta(locale).label}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background">
        {availableLocales.map((l) => (
          <DropdownMenuItem key={l} lang={getLocaleMeta(l).schema} onSelect={() => handleLocaleChange(l)}>
            {getLocaleMeta(l).label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Header({ onToggleSidebar }: { 
  onToggleSidebar: () => void 
}) {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('common');

  return (
    <header className="sticky z-50 top-0 bg-background/80 backdrop-blur-xs">
      <div className="flex items-center h-16 px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="logo"
              width={32} 
              height={32}
              priority={true}
            />
            <span className="font-semibold text-foreground">
                FreeFocusGames
            </span>
          </Link>
          <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hidden md:inline-flex"
              onClick={onToggleSidebar}
              aria-label={t('toggleSidebar')}
          >
              <PanelLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1" />
        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 block dark:hidden" />
            <Moon className="h-5 w-5 hidden dark:block" />
            <span className="sr-only">{t('toggleTheme')}</span>
          </Button>
          
          {/* 桌面端语言切换 */}
          <LanguageSwitcher />
        </div>
        
        {/* 移动端控件 */}
        <div className="flex md:hidden items-center gap-2">
          {/* 移动端语言切换 */}
          <LanguageSwitcher />
          
          {/* 移动端主题切换 */}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 block dark:hidden" />
            <Moon className="h-5 w-5 hidden dark:block" />
            <span className="sr-only">{t('toggleTheme')}</span>
          </Button>
          
          {/* 移动端侧边栏切换 */}
          <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              onClick={onToggleSidebar}
              aria-label={t('toggleSidebar')}
          >
              <PanelLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
} 