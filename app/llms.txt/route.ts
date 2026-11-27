import { SITE_BASE_URL } from "@/lib/site-constants";
import { BENCHMARKS, NBACK_BENCHMARK } from "@/lib/benchmarks";
import { careerTests } from "@/data/career-tests";
import { categories } from "@/data/categories";
import { games } from "@/data/games";
import { blogData } from "@/data/generated";
import benchmarksEn from "@/messages/en/benchmarks.json";

export const dynamic = "force-static";
export const revalidate = false;

const abs = (path: string) => `${SITE_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

function firstSentence(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : normalized).trim();
}

export async function GET() {
  const bm = benchmarksEn.benchmarks;
  const benchmarkLines = BENCHMARKS.map((entry) => {
    const name = bm.items[entry.id].name;
    const unit = bm.units[entry.unit];
    const players = entry.players.toLocaleString("en-US");
    const top1Part = entry.top1 ? `, top 1% ${entry.top1} ${unit}` : "";
    return `- ${name}: median ${entry.median} ${unit}, top 10% ${entry.top10} ${unit}${top1Part} (n = ${players} players). [Play](${abs(entry.game)}) · [Analysis](${abs(entry.article)})`;
  });

  const nbackShares = NBACK_BENCHMARK.levels
    .map((row) => `>=${row.level}-back: >=${row.share}%`)
    .join(", ");
  benchmarkLines.push(
    `- Dual N-Back: ${NBACK_BENCHMARK.players.toLocaleString("en-US")} clearing players (${nbackShares}; median clearing accuracy ${NBACK_BENCHMARK.medianAccuracy}%). [Play](${abs(NBACK_BENCHMARK.game)}) · [Analysis](${abs(NBACK_BENCHMARK.article)})`
  );

  const careerLines = careerTests.map(
    (test) =>
      `- [${test.title}](${abs(`/career-tests/${test.slug}`)}): ${test.description} Audience: ${test.audience}.`
  );

  const categoryLines = categories.map(
    (cat) => `- [${cat.name}](${abs(`/categories/${cat.slug}`)}): ${firstSentence(cat.description)}`
  );

  const gameLines = games.map(
    (game) => `- [${game.title}](${abs(`/games/${game.slug}`)})`
  );

  const articleLines = (blogData.en || [])
    .filter((post) => !post.noindex)
    .map((post) => {
      const summary = (post.metaDescription || post.excerpt || "").replace(/\s+/g, " ").trim();
      return `- [${post.title}](${abs(`/blog/${post.slug}`)})${summary ? `: ${summary}` : ""}`;
    });

  const lines = [
    "# FreeFocusGames",
    "",
    "> Free, no-signup, no-paywall, open-source platform for cognitive tests, focus training games, career practice tests, and real player benchmarks (CC BY 4.0).",
    "",
    "## Core Pages",
    `- [Home](${SITE_BASE_URL}): Free online focus, memory, reaction, and breathing tools.`,
    `- [Player Benchmarks](${abs("/benchmarks")}): Real player medians, top 10%/1% thresholds, and distributions across 55,000+ results (${bm.updated}, CC BY 4.0).`,
    `- [Data & Methodology](${abs("/methodology")}): How results are collected, deduplicated per browser, filtered for outliers, and cited.`,
    `- [Assessment Tests](${abs("/tests")}): Hub for cognitive assessments, ADHD screening questionnaires, and career practice tests.`,
    `- [Career Practice Tests](${abs("/career-tests")}): Free unlimited job-skill drills for 911 dispatcher, CritiCall, and 10-key applicants.`,
    `- [All Games](${abs("/games")}): Full directory of focus, working memory, visual tracking, reaction, and relaxation exercises.`,
    `- [Blog & Science Guides](${abs("/blog")}): Evidence-based tutorials and player benchmark studies.`,
    `- [About](${abs("/about")}): Platform background and mission.`,
    "- [Source Code (GitHub)](https://github.com/loethen/freefocusgames): Open-source repository.",
    "",
    "## Published Player Benchmarks",
    `Snapshot: ${bm.updated}. One best result per player; see ${abs("/methodology")} for outlier exclusions.`,
    ...benchmarkLines,
    "",
    "## Cognitive & ADHD Assessments",
    `- [Trail Making Test](${abs("/games/trail-making-test")}): Parts A and B visual tracking and task-switching speed.`,
    `- [Digit Span Test](${abs("/games/digit-span-test")}): Forward and backward working memory span.`,
    `- [Short-Term Memory Test](${abs("/games/free-short-term-memory-test")}): Everyday item recall exercise.`,
    `- [Reaction Time Test](${abs("/games/reaction-time")}): 5-round visual reaction time test in milliseconds.`,
    `- [Psychomotor Vigilance Test (PVT)](${abs("/games/psychomotor-vigilance-test")}): 3- or 10-minute sustained attention test measuring lapses and false starts.`,
    `- [Flanker Test](${abs("/games/flanker-test")}): 40-trial selective attention and interference test.`,
    `- [Children's ADHD Screening (Vanderbilt)](${abs("/adhd-assessment")}): Parent questionnaire for ages 6-12 (screening tool only, not a medical diagnosis).`,
    `- [Adult ADHD Screening (ASRS v1.1)](${abs("/adult-adhd-assessment")}): 18-question Adult ADHD Self-Report Scale (screening tool only, not a medical diagnosis).`,
    "",
    "## Free Career Practice Tests",
    ...careerLines,
    "",
    "## Training Categories",
    ...categoryLines,
    "",
    "## Games & Focus Tools",
    ...gameLines,
    "",
    "## Guides & Benchmark Articles",
    ...articleLines,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
