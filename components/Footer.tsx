"use client";

import { useTranslations } from 'next-intl';
import { XLogo } from './ui/XLogo';
import { Link } from '@/i18n/navigation';
import { Github } from 'lucide-react';

const KOFI_URL = "https://ko-fi.com/freefocusgames";

export function Footer() {
  const t = useTranslations('common');

  return (
    <footer className="text-center text-sm mt-12 pb-8">
      <div className="flex items-center justify-center space-x-4 flex-wrap text-muted-foreground/60">
        <span>2026</span>
        <span>•</span>
        <Link
          href="/about"
          className="hover:text-muted-foreground transition-colors underline-offset-4 hover:underline"
        >
          {t('about')}
        </Link>
        <span>•</span>
        <Link
          href="/privacy-policy"
          className="hover:text-muted-foreground transition-colors underline-offset-4 hover:underline"
        >
          {t('privacyPolicy')}
        </Link>
        <span>•</span>
        <Link
          href="/terms-of-service"
          className="hover:text-muted-foreground transition-colors underline-offset-4 hover:underline"
        >
          {t('termsOfService')}
        </Link>
        <span>•</span>
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground transition-colors underline-offset-4 hover:underline"
        >
          {t('supportProject')}
        </a>
        <span>•</span>
        <a
          href="https://x.com/2also397879"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground transition-colors"
          aria-label="Follow on X"
        >
          <XLogo className="w-4 h-4" />
        </a>
        <a
          href="https://github.com/loethen/freefocusgames"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground transition-colors"
          aria-label="View on GitHub"
        >
          <Github className="w-4 h-4" />
        </a>
      </div>
    </footer>
  );
}
