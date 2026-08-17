import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, BriefcaseBusiness, Check, Clock3, ShieldCheck } from "lucide-react";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { careerTests } from "@/data/career-tests";
import { Link } from "@/i18n/navigation";
import { SITE_BASE_URL } from "@/lib/site-constants";

const PAGE_PATH = "/career-tests";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return { robots: { index: false, follow: false } };

  const title = "Free Career Practice Tests for Job Seekers";
  const description =
    "Practice real job skills with free, original career test drills for dispatcher applicants. No signup, no paywall, unlimited attempts, and instant feedback.";

  return {
    title,
    description,
    keywords: [
      "free career practice tests",
      "job aptitude practice",
      "pre employment test practice",
      "911 dispatcher practice test",
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

export default async function CareerTestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  setRequestLocale(locale);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Free Career Practice Tests",
      description:
        "Free interactive skills practice for job applicants, with no signup or paywall.",
      url: `${SITE_BASE_URL}${PAGE_PATH}`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: careerTests.length,
        itemListElement: careerTests.map((test, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: test.title,
          url: `${SITE_BASE_URL}${PAGE_PATH}/${test.slug}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_BASE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Career Tests",
          item: `${SITE_BASE_URL}${PAGE_PATH}`,
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Breadcrumbs items={[{ label: "Career Tests" }]} />

      <header className="pb-12 pt-8 sm:pb-16 sm:pt-14">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Practice for the job—not for a paywall
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
          Free career practice tests built for working people
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
          Train the typing, memory, accuracy, and decision skills used in real hiring processes. Start immediately, practice as often as you need, and keep your progress on your own device.
        </p>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
          {["No account", "No payment", "Unlimited attempts", "Original practice"].map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <Check aria-hidden="true" className="h-4 w-4 text-green-600" />
              {item}
            </span>
          ))}
        </div>
      </header>

      <main>
        <section aria-labelledby="available-tests-title">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{careerTests.length} free tools available</p>
              <h2 id="available-tests-title" className="mt-1 text-3xl font-semibold tracking-tight">
                Start practicing
              </h2>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {careerTests.map((test, index) => (
              <article key={test.id} className="group flex flex-col rounded-2xl border border-border/60 bg-muted/25 p-6 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/45 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    {index === 0 ? (
                      <BriefcaseBusiness aria-hidden="true" className="h-7 w-7" />
                    ) : (
                      <Clock3 aria-hidden="true" className="h-7 w-7" />
                    )}
                  </div>
                  <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
                    Free
                  </span>
                </div>
                <h3 className="mt-6 text-2xl font-semibold group-hover:text-primary">{test.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{test.description}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {test.modules.map((module) => (
                    <li key={module} className="rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                      {module}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{test.estimatedTime}</span>
                  <Link href={`/career-tests/${test.slug}`} className="inline-flex items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">
                    Start free
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20 grid gap-x-12 gap-y-10 py-4 md:grid-cols-3">
          {[
            ["Useful, not official", "We train publicly disclosed job skills without copying secured test questions or pretending to issue an official score."],
            ["Private by default", "No account is required. Practice answers and recent scores stay in your browser rather than a user database."],
            ["Sources you can check", "Every exam-specific page links to the official material used to define its scope and shows when we last reviewed it."],
          ].map(([title, body]) => (
            <div key={title}>
              <ShieldCheck aria-hidden="true" className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
