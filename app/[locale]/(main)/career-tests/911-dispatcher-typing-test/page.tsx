import type { Metadata } from "next";
import Image from "next/image";
import { Calculator } from "lucide-react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { CareerTestPageShell } from "@/components/career-tests/CareerTestPageShell";
import DispatcherTypingTest from "@/components/career-tests/DispatcherTypingTest";
import { getCareerTestBySlug } from "@/data/career-tests";
import { getGameBySlug } from "@/data/games";
import { Link } from "@/i18n/navigation";
import { buildFaqSchema, buildHowToSchema } from "@/lib/schema";
import { SITE_BASE_URL } from "@/lib/site-constants";

const SLUG = "911-dispatcher-typing-test";
const PAGE_PATH = `/career-tests/${SLUG}`;
const test = getCareerTestBySlug(SLUG)!;

const RELATED_FOCUS_DRILLS = [
  {
    href: "/career-tests/10-key-typing-test",
    title: "10-Key Typing Test (KPH)",
    skill: "Numeric keypad",
    description: "Measure numeric keypad KPH and accuracy across numbers, amounts, and ZIP codes.",
  },
  {
    href: "/games/psychomotor-vigilance-test",
    title: "Psychomotor Vigilance Test",
    skill: "Sustained attention",
    description: "Build steady vigilance for 3- and 5-minute endurance typing sessions.",
  },
  {
    href: "/games/stroop-effect-test",
    title: "Stroop Effect Test",
    skill: "Cognitive flexibility",
    description: "Strengthen error inhibition when typing dense addresses and numbers fast.",
  },
  {
    href: "/games/schulte-table",
    title: "Schulte Table",
    skill: "Visual scanning",
    description: "Train faster eye tracking so you read ahead cleanly while typing.",
  },
].map((item) => ({
  ...item,
  coverImage: item.href.startsWith("/games/")
    ? getGameBySlug(item.href.slice("/games/".length))?.coverImage
    : undefined,
}));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return { robots: { index: false, follow: false } };

  const title = "Free 911 Dispatcher Typing Test";
  const description =
    "Take a free 911 dispatcher typing test with original incident notes. Choose 1, 3, or 5 minutes and get net WPM, accuracy, and errors instantly.";

  return {
    title,
    description,
    keywords: [
      "911 dispatcher typing test",
      "dispatcher typing test free",
      "911 operator typing practice",
      "5 minute typing test dispatcher",
      "focus game",
      "sustained attention training",
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

export default async function DispatcherTypingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  setRequestLocale(locale);

  const faq = [
    {
      question: "What typing speed do 911 dispatchers need?",
      answer:
        "There is no single nationwide requirement. Agencies set their own minimum speed, accuracy, test length, and approved test provider. Check the exact job announcement before treating any practice score as a target.",
    },
    {
      question: "How is net WPM calculated here?",
      answer:
        "The test first estimates gross words per minute using the standard five-character word, then subtracts a penalty based on character-level differences between the prompt and your entry. Accuracy is shown separately.",
    },
    {
      question: "Should I practice for one minute or five minutes?",
      answer:
        "Use one minute for quick daily repetitions and five minutes for endurance. If your agency names a specific test length, spend most of your time practicing that duration.",
    },
    {
      question: "Does this test save what I type?",
      answer:
        "No typed incident text is sent to our server. The test calculates the result in your browser and stores only a best WPM value on your device when local storage is available.",
    },
  ];

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Free 911 Dispatcher Typing Test",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any modern web browser",
      url: `${SITE_BASE_URL}${PAGE_PATH}`,
      description: test.description,
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    buildFaqSchema(faq),
    buildHowToSchema({
      name: "How to Practice for a 911 Dispatcher Typing Test",
      description:
        "Practice timed incident-note typing for 1, 3, or 5 minutes, review net WPM and accuracy, and pair weak areas with targeted focus games.",
      url: `${SITE_BASE_URL}${PAGE_PATH}`,
      inLanguage: "en-US",
      totalTime: "PT5M",
      steps: [
        {
          name: "Pick a test duration",
          text: "Select 1 minute for warm-ups, 3 minutes for standard pacing, or 5 minutes for endurance practice.",
        },
        {
          name: "Type incident notes without rushing",
          text: "Click the terminal and begin typing; the clock starts on your first keystroke and measures both speed and exact character accuracy.",
        },
        {
          name: "Review speed, accuracy, and errors",
          text: "Check your net WPM, gross WPM, accuracy, and character errors, then repeat the test or practice the related visual-scanning and vigilance drills below.",
        },
      ],
    }),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_BASE_URL },
        { "@type": "ListItem", position: 2, name: "Career Tests", item: `${SITE_BASE_URL}/career-tests` },
        { "@type": "ListItem", position: 3, name: test.shortTitle, item: `${SITE_BASE_URL}${PAGE_PATH}` },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <CareerTestPageShell
        title="Free 911 Dispatcher Typing Test"
        description="Practice typing original, job-style incident notes for one, three, or five minutes. Get net WPM, gross WPM, accuracy, and character errors immediately."
        sources={test.sources}
        lastReviewed={test.lastReviewed}
        faq={faq}
      >
        <DispatcherTypingTest />

        <section className="mx-auto mt-20 grid max-w-5xl gap-x-12 gap-y-8 md:grid-cols-3">
          {[
            ["Start with accuracy", "Slow down until names, numbers, punctuation, and capitalization are consistently correct."],
            ["Build duration", "Move from one-minute repetitions to five-minute sessions without letting accuracy collapse."],
            ["Confirm the standard", "Your agency—not this website—decides the required WPM, accuracy, and approved testing method."],
          ].map(([title, body]) => (
            <div key={title}>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto mt-16 max-w-5xl">
          <h2 className="text-xl font-semibold">Train the focus skills behind dispatcher typing</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Short, free cognitive games that sharpen accuracy, eye tracking, and 5-minute mental stamina.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {RELATED_FOCUS_DRILLS.map((item) => (
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
                        <Calculator className="h-8 w-8" aria-hidden="true" />
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
