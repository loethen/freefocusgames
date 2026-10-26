"use client";

import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { XLogo } from './ui/XLogo';
import { Link } from '@/i18n/navigation';
import { Github } from 'lucide-react';
import { CaptionCatFooterCat } from './captioncat-footer-cat';

// Methodology lives on the About and Benchmarks pages, which keeps this to one line.
const FOOTER_LINKS = [
  { href: "/categories", label: "categories" },
  { href: "/benchmarks", label: "benchmarks" },
  { href: "/about", label: "about" },
  { href: "/privacy-policy", label: "privacyPolicy" },
  { href: "/terms-of-service", label: "termsOfService" },
] as const;

export function Footer() {
  const t = useTranslations('common');

  return (
    <footer className="mx-auto mt-12 max-w-4xl pb-8 text-center text-sm">
      <CaptionCatFooterCat />
      <div className="flex items-center justify-center space-x-4 flex-wrap text-muted-foreground/60">
        {FOOTER_LINKS.map(({ href, label }) => (
          <Fragment key={href}>
            <Link
              href={href}
              className="hover:text-muted-foreground transition-colors underline-offset-4 hover:underline"
            >
              {t(label)}
            </Link>
            <span>•</span>
          </Fragment>
        ))}
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
