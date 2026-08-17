import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "@/i18n/navigation";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

type Source = {
  label: string;
  url: string;
};

type Faq = {
  question: string;
  answer: ReactNode;
};

type CareerTestPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  sources: Source[];
  lastReviewed: string;
  faq: Faq[];
};

export function CareerTestPageShell({
  title,
  description,
  children,
  sources,
  lastReviewed,
  faq,
}: CareerTestPageShellProps) {
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Career Tests", href: "/career-tests" },
          { label: title },
        ]}
      />

      <header className="mx-auto max-w-5xl pb-8 pt-6 text-center sm:pb-10 sm:pt-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Free · No signup · Unlimited practice
        </p>
        <h1 className="text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
      </header>

      <main>{children}</main>

      <section className="mx-auto mt-20 max-w-5xl rounded-2xl bg-gradient-to-br from-muted/60 via-muted/35 to-background p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">Sources and scope</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          We use public, official descriptions to decide which skills to train. All
          scenarios, names, addresses, phone numbers, and questions on this site are
          independently generated for practice. Last reviewed: {lastReviewed}.
        </p>
        <ul className="mt-4 space-y-2">
          {sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {source.label}
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-7 max-w-3xl text-sm leading-6 text-muted-foreground">
          <strong className="font-medium text-foreground">Independent practice:</strong>{" "}
          This page is not affiliated with Biddle Consulting Group, TestGenius,
          CritiCall, or any hiring agency. It contains original skills practice—not
          real test questions or an official score. Agencies may use different test
          modules and standards.
        </p>
      </section>

      <section className="mx-auto mt-14 max-w-5xl">
        <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="mt-5 max-w-3xl">
          {faq.map((item, index) => (
            <AccordionItem
              key={item.question}
              value={`faq-${index}`}
              className="border-border/60"
            >
              <AccordionTrigger className="py-5 text-base hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mx-auto mt-12 max-w-5xl rounded-xl bg-muted/50 p-6 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">More free career practice</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore every job-preparation tool without creating an account.
          </p>
        </div>
        <Link
          href="/career-tests"
          className="mt-4 inline-flex font-medium text-primary underline-offset-4 hover:underline sm:mt-0"
        >
          View all career tests →
        </Link>
      </section>
    </>
  );
}
