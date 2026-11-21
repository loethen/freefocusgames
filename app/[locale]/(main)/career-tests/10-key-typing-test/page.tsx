import type { Metadata } from "next";
import Image from "next/image";
import { Keyboard } from "lucide-react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { CareerTestPageShell } from "@/components/career-tests/CareerTestPageShell";
import TenKeyTypingTest from "@/components/career-tests/TenKeyTypingTest";
import { getCareerTestBySlug } from "@/data/career-tests";
import { getGameBySlug } from "@/data/games";
import { Link } from "@/i18n/navigation";
import { buildFaqSchema, buildHowToSchema } from "@/lib/schema";
import { SITE_BASE_URL } from "@/lib/site-constants";

const SLUG = "10-key-typing-test";
const PAGE_PATH = `/career-tests/${SLUG}`;
const test = getCareerTestBySlug(SLUG)!;

const RELATED_PRACTICE = [
  {
    href: "/career-tests/911-dispatcher-typing-test",
    title: "911 Dispatcher Typing Test",
    skill: "Timed typing",
    description: "Build WPM and accuracy on full incident-note passages.",
  },
  {
    href: "/career-tests/criticall-practice-test",
    title: "CritiCall Skills Practice",
    skill: "Data entry & recall",
    description: "Practice multi-field data entry, audio entry, and code comparison.",
  },
  {
    href: "/games/digit-span-test",
    title: "Digit Span Test",
    skill: "Number working memory",
    description: "Strengthen short-term recall for phone numbers, ZIPs, and account IDs.",
  },
  {
    href: "/games/schulte-table",
    title: "Schulte Table",
    skill: "Visual scanning",
    description: "Speed up number scanning and reduce line-skipping errors.",
  },
].map((item) => ({
  ...item,
  coverImage: item.href.startsWith("/games/")
    ? getGameBySlug(item.href.slice("/games/".length))?.coverImage
    : undefined,
}));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return { robots: { index: false, follow: false } };

  const title = "Free 10-Key Typing Test (KPH) – Numeric Keypad Practice";
  const description =
    "Take a free 10-key typing test online and measure your KPH (keystrokes per hour) and accuracy. Practice numbers, currency decimals, and ZIP codes for 1, 3, or 5 minutes.";

  return {
    title,
    description,
    keywords: [
      "10 key typing test",
      "kph typing test",
      "10 key data entry test",
      "free 10 key test",
      "numeric keypad typing test",
      "data entry practice test",
    ],
    alternates: { canonical: `${SITE_BASE_URL}${PAGE_PATH}` },
    openGraph: {
      title,
      description,
      url: `${SITE_BASE_URL}${PAGE_PATH}`,
      type: "website",
      images: [{ url: "/og/oglogo.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og/oglogo.png"],
    },
  };
}

export default async function TenKeyTypingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  setRequestLocale(locale);

  const faq = [
    {
      question: "What is a good 10-key KPH score for data entry jobs?",
      answer:
        "Many entry-level clerical, bank teller, and accounts payable roles ask for 8,000 to 9,000 KPH, while competitive data entry roles often look for 10,000 to 12,000+ KPH. Most employers care just as much about accuracy—typically 95% to 98% or higher.",
    },
    {
      question: "How is KPH (Keystrokes Per Hour) calculated?",
      answer:
        "Gross KPH scales your total typed characters—including the Enter keystroke used to submit each line—up to a 60-minute rate. Net KPH adjusts Gross KPH by your accuracy percentage so speed without clean entries does not inflate your score.",
    },
    {
      question: "How do I position my fingers for 10-key touch typing?",
      answer:
        "Turn Num Lock on and rest your right hand on the middle home row: index finger on 4, middle finger on 5 (marked with a raised bump), ring finger on 6, thumb on 0, and pinky on Enter. Keep your eyes on the screen rather than the keypad.",
    },
    {
      question: "Can I take this 10-key test on a laptop without a numeric keypad?",
      answer:
        "Yes. The input accepts digits from both a dedicated desktop numeric keypad and the top number row on a laptop, though practicing on a full-size external numpad will give you realistic KPH speeds for employment screening.",
    },
  ];

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Free 10-Key Typing Test (KPH)",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any modern web browser",
      url: `${SITE_BASE_URL}${PAGE_PATH}`,
      description: test.description,
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    buildFaqSchema(faq),
    buildHowToSchema({
      name: "How to Practice 10-Key Data Entry and Measure KPH",
      description:
        "Choose numbers, currency decimals, or ZIP and account codes, run a 1-, 3-, or 5-minute keypad test, and track Net KPH and accuracy.",
      url: `${SITE_BASE_URL}${PAGE_PATH}`,
      inLanguage: "en-US",
      totalTime: "PT3M",
      steps: [
        {
          name: "Pick a numeric data format and duration",
          text: "Select Standard Numbers, Currency & Decimals, or ZIP & Account Codes, then choose a 1-, 3-, or 5-minute timer.",
        },
        {
          name: "Place fingers on the 4-5-6 home row",
          text: "Turn Num Lock on, anchor your right hand on 4, 5, and 6, and type each number followed by Enter or Space.",
        },
        {
          name: "Review Net KPH, accuracy, and errors",
          text: "Aim for 95%+ accuracy before pushing speed toward 8,000–12,000 Net KPH.",
        },
      ],
    }),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_BASE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Career Tests",
          item: `${SITE_BASE_URL}/career-tests`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: test.shortTitle,
          item: `${SITE_BASE_URL}${PAGE_PATH}`,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CareerTestPageShell
        title="Free 10-Key Typing Test (KPH)"
        description="Measure numeric keypad speed in Keystrokes Per Hour (KPH) and accuracy across numbers, currency decimals, and ZIP or invoice codes. Free, unlimited, and no sign-up."
        sources={test.sources}
        lastReviewed={test.lastReviewed}
        faq={faq}
      >
        <TenKeyTypingTest />

        <section className="mx-auto mt-20 grid max-w-5xl gap-x-12 gap-y-8 md:grid-cols-3">
          {[
            [
              "Anchor on 4 · 5 · 6",
              "Keep your middle finger on the raised bump on 5 and return to the home row between reaches instead of looking down.",
            ],
            [
              "Accuracy beats raw speed",
              "In banking, payroll, and clerical screening, a 98% accurate 9,000 KPH run usually outperforms a sloppy 12,000 KPH run.",
            ],
            [
              "Match the job format",
              "Switch to Currency & Decimals if your test involves invoices or teller totals, and practice 3- or 5-minute runs for stamina.",
            ],
          ].map(([title, body]) => (
            <div key={title}>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto mt-16 max-w-5xl">
          <h2 className="text-xl font-semibold">More data entry & focus practice</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pair numeric keypad drills with timed typing, call-taking entry, and number-memory exercises.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {RELATED_PRACTICE.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex h-full gap-4 rounded-xl border border-border/60 p-4 transition-colors hover:border-primary/60 hover:bg-muted/40"
                >
                  <span className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-36">
                    {item.coverImage ? (
                      <Image
                        src={item.coverImage}
                        alt=""
                        fill
                        sizes="144px"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Keyboard className="h-8 w-8" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {item.skill}
                    </span>
                    <span className="mt-1 block font-semibold">{item.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </CareerTestPageShell>
    </>
  );
}
