"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Star } from "lucide-react";

const TRUSTPILOT_BUSINESS_UNIT_ID = "MVUTEeYqtilSjQB4";
const TRUSTPILOT_REVIEW_URL = "https://www.trustpilot.com/review/freefocusgames.com";

export default function TrustpilotSection() {
  const t = useTranslations("home.trustpilot");
  const widgetRef = useRef<HTMLDivElement>(null);

  // Re-initialise the widget after Next.js hydration
  useEffect(() => {
    const tp = (
      window as unknown as {
        Trustpilot?: { loadFromElement: (el: HTMLElement) => void };
      }
    ).Trustpilot;
    if (tp && widgetRef.current) {
      tp.loadFromElement(widgetRef.current);
    }
  }, []);

  return (
    <section className="mb-24 max-w-4xl mx-auto px-6">
      {/* Trustpilot bootstrap script – loaded once, lazily */}
      <Script
        id="trustpilot-widget-bootstrap"
        src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="lazyOnload"
        onLoad={() => {
          const tp = (
            window as unknown as {
              Trustpilot?: { loadFromElement: (el: HTMLElement) => void };
            }
          ).Trustpilot;
          if (tp && widgetRef.current) {
            tp.loadFromElement(widgetRef.current);
          }
        }}
      />

      {/* Section header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium mb-4">
          <Star className="h-4 w-4 fill-current" />
          {t("badge")}
        </div>
        <h2 className="text-3xl font-bold mb-3">{t("title")}</h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          {t("subtitle")}
        </p>
      </div>

      {/* Trustpilot Widget — "Micro Review Count" style */}
      <div className="flex justify-center mb-8">
        <div
          ref={widgetRef}
          className="trustpilot-widget"
          data-locale="en-US"
          data-template-id="53aa8807dec7e10d38f59f32"
          data-businessunit-id={TRUSTPILOT_BUSINESS_UNIT_ID}
          data-style-height="130px"
          data-style-width="100%"
          data-theme="light"
        >
          {/* Fallback link for SEO and accessibility */}
          <a
            href={TRUSTPILOT_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("ctaButton")}
          </a>
        </div>
      </div>

      {/* CTA — invite users to leave a review */}
      <div className="rounded-2xl border bg-muted/30 dark:bg-muted/10 p-8 text-center">
        <p className="text-base text-muted-foreground mb-2">{t("ctaBody")}</p>
        <p className="text-sm text-muted-foreground mb-6">{t("ctaNote")}</p>
        <a
          href={TRUSTPILOT_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 bg-[#00b67a] hover:bg-[#00a368] text-white font-semibold text-sm transition-colors shadow-sm"
        >
          <Star className="h-4 w-4 fill-white" />
          {t("ctaButton")}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
