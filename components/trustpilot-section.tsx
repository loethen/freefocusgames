"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, Star } from "lucide-react";

const TRUSTPILOT_REVIEW_URL = "https://www.trustpilot.com/review/freefocusgames.com";

export default function TrustpilotSection() {
  const t = useTranslations("home.trustpilot");

  return (
    <section className="mb-20 max-w-4xl mx-auto px-2 sm:mb-24 sm:px-6">
      {/* CTA — invite users to leave a review */}
      <div className="rounded-2xl border bg-muted/30 p-5 py-7 text-center dark:bg-muted/10 sm:p-8">
        <p className="text-base text-muted-foreground mb-2">{t("ctaBody")}</p>
        <p className="text-sm text-muted-foreground mb-6">{t("ctaNote")}</p>
        <a
          href={TRUSTPILOT_REVIEW_URL}
          target="_blank"
          rel="nofollow noopener noreferrer"
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
