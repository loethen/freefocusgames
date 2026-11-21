export interface FaqSchemaItem {
  question: string;
  answer: string;
}

export interface HowToStepInput {
  name?: string;
  text: string;
}

export interface HowToSchemaInput {
  name: string;
  description: string;
  steps: HowToStepInput[];
  totalTime?: string;
  url?: string;
  inLanguage?: string;
}

export function buildFaqSchema(items: FaqSchemaItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildHowToSchema({
  name,
  description,
  steps,
  totalTime,
  url,
  inLanguage,
}: HowToSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    ...(totalTime ? { totalTime } : {}),
    ...(url ? { url } : {}),
    ...(inLanguage ? { inLanguage } : {}),
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      ...(step.name ? { name: step.name } : {}),
      text: step.text,
    })),
  };
}
