import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import CritiCallPractice from "@/components/career-tests/CritiCallPractice";
import { CareerTestPageShell } from "@/components/career-tests/CareerTestPageShell";
import { getCareerTestBySlug } from "@/data/career-tests";
import { SITE_BASE_URL } from "@/lib/site-constants";

const SLUG = "criticall-practice-test";
const PAGE_PATH = `/career-tests/${SLUG}`;
const test = getCareerTestBySlug(SLUG)!;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return { robots: { index: false, follow: false } };

  const title = "Free CritiCall Practice Test";
  const description =
    "Take a free CritiCall practice test with original written and audio data entry, character comparison, and memory drills for dispatcher applicants. No signup.";

  return {
    title,
    description,
    keywords: [
      "CritiCall practice test",
      "free CritiCall practice test",
      "911 dispatcher practice test",
      "dispatcher data entry practice",
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

export default async function CritiCallPracticePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  setRequestLocale(locale);

  const faq = [
    {
      question: "Is this an official CritiCall practice test?",
      answer:
        "No. This is an independent collection of original drills based on skills described in public CritiCall materials. It is not produced, approved, or scored by CritiCall, TestGenius, Biddle Consulting Group, or a hiring agency.",
    },
    {
      question: "Are these real CritiCall questions?",
      answer:
        "No. Every incident record, name, address, phone number, vehicle, plate, and comparison sequence is generated for this website. We do not collect or reproduce secured test questions.",
    },
    {
      question: "Why might my actual dispatcher test be different?",
      answer:
        "Hiring agencies can select different modules, time limits, passing standards, and additional assessments. Use the job announcement and instructions from your agency as the final authority.",
    },
    {
      question: "Does audio practice send my answers to Google?",
      answer:
        "No. The browser sends only the fictional generated call text to Google Translate to request speech audio. Your typed answers and scores are evaluated locally in your browser.",
    },
  ];

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Free CritiCall Skills Practice",
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
        title="Free CritiCall Skills Practice"
        description="Build the data-entry, listening, character-recognition, and memory skills used in public-safety dispatcher hiring. Every drill is original, free, and available without an account."
        sources={test.sources}
        lastReviewed={test.lastReviewed}
        faq={faq}
      >
        <CritiCallPractice />

        <section className="mx-auto mt-20 grid max-w-5xl gap-x-14 gap-y-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">What this practice trains</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Moving information into the right fields, listening for precise details, comparing similar sequences, and retaining short incident records under light time pressure.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">What your result means</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Scores help you compare your own practice attempts. They do not predict an official result because agencies choose different modules and passing standards.
            </p>
          </div>
        </section>
      </CareerTestPageShell>
    </>
  );
}
