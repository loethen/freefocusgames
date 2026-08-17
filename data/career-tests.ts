export type CareerTestSource = {
  label: string;
  url: string;
};

export type CareerTest = {
  id: string;
  title: string;
  shortTitle: string;
  slug: string;
  description: string;
  audience: string;
  estimatedTime: string;
  modules: string[];
  sources: CareerTestSource[];
  lastReviewed: string;
};

export const careerTests: CareerTest[] = [
  {
    id: "criticall-practice-test",
    title: "Free CritiCall Skills Practice",
    shortTitle: "CritiCall Skills Practice",
    slug: "criticall-practice-test",
    description:
      "Unlimited original dispatcher drills for data entry, audio entry, character comparison, and short-term memory.",
    audience: "911 dispatcher and public-safety calltaker applicants",
    estimatedTime: "5–20 minutes",
    modules: [
      "Written data entry",
      "Audio data entry",
      "Character comparison",
      "Memory recall",
    ],
    sources: [
      {
        label: "Official CritiCall test descriptions",
        url: "https://criticall911.com/dispatcher-testing/agencieshr/test-descriptions",
      },
      {
        label: "Official candidate preparation guide",
        url: "https://criticall911.com/hubfs/Criticall-Website-Files/CritiCall_Candidate_Test_Preparation_Guide_2023.pdf",
      },
    ],
    lastReviewed: "August 17, 2026",
  },
  {
    id: "911-dispatcher-typing-test",
    title: "Free 911 Dispatcher Typing Test",
    shortTitle: "911 Dispatcher Typing Test",
    slug: "911-dispatcher-typing-test",
    description:
      "Practice typing dispatcher-style incident notes for 1, 3, or 5 minutes and get WPM, accuracy, and error feedback.",
    audience: "dispatcher, calltaker, and communications applicants",
    estimatedTime: "1–5 minutes",
    modules: ["Timed typing", "Accuracy scoring", "Local best scores"],
    sources: [
      {
        label: "Official CritiCall candidate preparation guide",
        url: "https://criticall911.com/hubfs/Criticall-Website-Files/CritiCall_Candidate_Test_Preparation_Guide_2023.pdf",
      },
    ],
    lastReviewed: "August 17, 2026",
  },
];

export function getCareerTestBySlug(slug: string) {
  return careerTests.find((test) => test.slug === slug);
}
