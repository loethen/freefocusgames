import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { CareerTestPageShell } from "@/components/career-tests/CareerTestPageShell";
import DispatcherTypingTest from "@/components/career-tests/DispatcherTypingTest";
import { getCareerTestBySlug } from "@/data/career-tests";
import { SITE_BASE_URL } from "@/lib/site-constants";

const SLUG = "911-dispatcher-typing-test";
const PAGE_PATH = `/career-tests/${SLUG}`;
const test = getCareerTestBySlug(SLUG)!;

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
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
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
      </CareerTestPageShell>
    </>
  );
}
