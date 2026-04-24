import { GamePreview as SimonGamePreview } from "@/app/[locale]/(main)/games/block-memory-challenge/components/GamePreview";
import { GamePreview as SchulteTableGamePreview } from "@/app/[locale]/(main)/games/schulte-table/components/GamePreview";
import { CountingBoxesGamePreview } from "@/app/[locale]/(main)/games/counting-boxes/components/GamePreview";
import { GamePreview as MemoryMatchingPreview } from "@/app/[locale]/(main)/games/memory-matching-game/components/GamePreview";
import { GamePreview as ResonanceBreathingPreview } from "@/app/[locale]/(main)/games/resonance-breathing/GamePreview";
import { GamePreview as SpacebarClickerPreview } from "@/app/[locale]/(main)/games/spacebar-clicker/components/GamePreview";
import { GamePreview as FishTraceGamePreview } from "@/app/[locale]/(main)/games/fish-trace/components/GamePreview";
import { ImagePreview } from "@/components/image-preview";


export type Game = {
  id: string;
  title: string;
  slug: string;
  image?: string;
  preview?: React.ReactNode;
  categories: string[];
};

export const games: Game[] = [
  {
    id: "resonance-breathing",
    title: "Resonance Breathing",
    slug: "resonance-breathing",
    preview: <ResonanceBreathingPreview />,
    categories: ["sustained-attention", "relaxation"],
  },
  {
    id: "box-breathing",
    title: "Box Breathing",
    slug: "box-breathing",
    preview: <ResonanceBreathingPreview />,
    categories: ["relaxation", "sustained-attention"],
  },
  {
    id: "478-breathing",
    title: "4-7-8 Breathing",
    slug: "478-breathing",
    preview: <ResonanceBreathingPreview />,
    categories: ["relaxation"],
  },
  {
    id: "pomodoro-timer",
    title: "Pomodoro Timer",
    slug: "pomodoro-timer",
    preview: <ImagePreview src="/games/pomodoro.png" />,
    categories: ["sustained-attention"],
  },
  {
    id: "counting-boxes",
    title: "Counting Boxes",
    slug: "counting-boxes",
    preview: <CountingBoxesGamePreview />,
    categories: ["working-memory", "spatial-memory", "brain-games-for-kids"],
  },
  {
    id: "free-short-term-memory-test",
    title: "Free Short Term Memory Test",
    slug: "free-short-term-memory-test",
    preview: <ImagePreview src="/games/free-short-term-memory-test.png" />,
    categories: ["working-memory", "auditory-processing"],
  },
  {
    id: "challenge10Seconds",
    title: "Challenge 10 Seconds",
    slug: "challenge-10-seconds",
    preview: <ImagePreview src="/games/challenge-10-seconds.png" />,
    categories: ["focus-games", "reaction-time", "spring-festival"],
  },
  {
    id: "baby-animal-matching",
    title: "Baby Animal Matching",
    slug: "baby-animal-matching",
    preview: (
      <ImagePreview src="https://images.unsplash.com/photo-1583524505974-6facd53f4597?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Mjc2NjN8MHwxfHNlYXJjaHw2fHxiYWJ5JTIwYW5pbWFsfGVufDB8fHx8MTc0NDE3ODcwNXww&ixlib=rb-4.0.3&q=80&w=600" />
    ),
    categories: ["working-memory", "visual-tracking", "brain-games-for-kids"],
  },
  {
    id: "memory-matching-game",
    title: "Memory Matching Game",
    slug: "memory-matching-game",
    preview: <MemoryMatchingPreview />,
    categories: ["working-memory", "visual-tracking", "sustained-attention", "adhd-games"],
  },
  {
    id: "dual-n-back",
    title: "Dual N-Back",
    slug: "dual-n-back",
    preview: <ImagePreview src="/games/dual-n-back.png" />,
    categories: ["working-memory", "divided-attention", "adhd-games"],
  },
  {
    id: "fish-trace",
    title: "Glowing Fish Trace",
    slug: "fish-trace",
    preview: <FishTraceGamePreview />,
    categories: ["visual-tracking", "sustained-attention", "brain-games-for-kids", "adhd-games"],
  },
  {
    id: "frog-memory-leap",
    title: "Frog Memory Leap",
    slug: "frog-memory-leap",
    preview: <ImagePreview src="/games/frog-memory-leap.png" />,
    categories: ["working-memory", "visual-tracking", "brain-games-for-kids"],
  },
  {
    id: "larger-number",
    title: "Larger Number",
    slug: "larger-number",
    preview: <ImagePreview src="/games/larger-number.png" />,
    categories: ["reaction-time", "selective-attention", "brain-games-for-kids"],
  },
  {
    id: "mahjong-dual-n-back",
    title: "Mahjong Dual N-Back",
    slug: "mahjong-dual-n-back",
    preview: <ImagePreview src="/games/mahjong-dual-n-back.png" />,
    categories: [
      "working-memory",
      "divided-attention",
      "cognitive-flexibility",
      "adhd-games",
    ],
  },
  {
    id: "block-memory-challenge",
    title: "Block Memory Challenge",
    slug: "block-memory-challenge",
    preview: <SimonGamePreview />,
    categories: ["working-memory", "visual-tracking", "brain-games-for-kids", "adhd-games"],
  },
  {
    id: "schulte-table",
    title: "Schulte Table",
    slug: "schulte-table",
    preview: <SchulteTableGamePreview />,
    categories: ["selective-attention", "visual-tracking", "reaction-time", "adhd-games", "brain-games-for-kids"],
  },
  {
    id: "reaction-time",
    title: "Reaction Time Test",
    slug: "reaction-time",
    preview: <ImagePreview src="/games/reaction-time.png" />,
    categories: [
      "reaction-time",
      "selective-attention",
      "sustained-attention",
      "adhd-games",
    ],
  },
  {
    id: "stroop-effect-test",
    title: "Stroop Effect Test",
    slug: "stroop-effect-test",
    preview: <ImagePreview src="/games/stroop-effect.png" />,
    categories: [
      "selective-attention",
      "cognitive-flexibility",
      "reaction-time",
      "adhd-games",
    ],
  },
  {
    id: "focus-reaction-test",
    title: "Focus Reaction Test",
    slug: "focus-reaction-test",
    preview: <ImagePreview src="/games/focus-reaction-test.png" />,
    categories: [
      "selective-attention",
      "reaction-time",
      "cognitive-flexibility",
      "adhd-games",
    ],
  },
  {
    id: "focus-sudoku",
    title: "Focus Sudoku",
    slug: "focus-sudoku",
    preview: <ImagePreview src="/games/focus-sudoku.png" />,
    categories: [
      "working-memory",
      "logic",
      "sustained-attention",
      "brain-games-for-kids",
    ],
  },

  {
    id: "cps-test",
    title: "CPS Test",
    slug: "cps-test",
    preview: <ImagePreview src="/games/cps-test.png" />,
    categories: [
      "reaction-time",
      "brain-games-for-kids",
    ],
  },
  {
    id: "spacebar-clicker",
    title: "Spacebar Clicker Test",
    slug: "spacebar-clicker",
    preview: <SpacebarClickerPreview />,
    categories: [
      "reaction-time",
      "sustained-attention",
    ],
  },
  {
    id: "sbti-test",
    title: "SBTI Personality Test",
    slug: "sbti-test",
    preview: (
      <ImagePreview
        src="/games/sbti-test/image/OJBK.png"
        alt="SBTI preview"
        fit="contain"
        aspectClassName="aspect-[4/5]"
        className="bg-white p-4 md:p-6"
        sizes="(max-width: 768px) 60vw, 28vw"
      />
    ),
    categories: [
      "personality-tests",
    ],
  },

  // Add more games as you create them
];

export function getGames(): Game[] {
  return games;
}

export function getGame(id: string): Game | undefined {
  return games.find(game => game.id === id);
}

export function getGameBySlug(slug: string): Game | undefined {
  return games.find(game => game.slug === slug);
}

export function getGamesByCategory(categoryId: string): Game[] {
  return games.filter(game => game.categories.includes(categoryId));
}

export function getGameCategories(gameId: string): string[] {
  const game = getGame(gameId);
  return game ? game.categories : [];
}

// 获取热门游戏（手动精选的经典游戏）
export function getFeaturedGames(): Game[] {
  const featuredGameIds = [
    'dual-n-back',
    'sbti-test',
    'schulte-table',
    'block-memory-challenge',
    'memory-matching-game',
    'larger-number',
    'reaction-time',
    'mahjong-dual-n-back',
    'frog-memory-leap',
    'fish-trace',
    'counting-boxes',
    'free-short-term-memory-test',
    'baby-animal-matching',
    'stroop-effect-test'
  ];

  return featuredGameIds
    .map(id => games.find(game => game.id === id))
    .filter((game): game is Game => game !== undefined);
}

// 获取最新游戏（手动指定的3个游戏）
export function getLatestGames(limit: number = 3): Game[] {
  const latestGameIds = [
    'sbti-test',        // SBTI Test - Trending
    'memory-matching-game', // Memory Matching Game - Newest
    'cps-test',          // CPS Test - Newest
    'fish-trace',        // Fish Trace
    'pomodoro-timer',    // Pomodoro Timer
  ];

  return latestGameIds
    .map(id => games.find(game => game.id === id))
    .filter((game): game is Game => game !== undefined)
    .slice(0, limit);
}

// 获取轮播用的热门游戏分页（去除与最新游戏的重复）
export function getFeaturedGamesForCarousel(gamesPerPage: number = 6): Game[][] {
  const featuredGames = getFeaturedGames();
  const latestGames = getLatestGames();
  const latestGameIds = latestGames.map(game => game.id);

  // 过滤掉最新游戏中已经存在的游戏，避免重复
  const filteredFeaturedGames = featuredGames.filter(game =>
    !latestGameIds.includes(game.id)
  );

  const pages: Game[][] = [];

  for (let i = 0; i < filteredFeaturedGames.length; i += gamesPerPage) {
    pages.push(filteredFeaturedGames.slice(i, i + gamesPerPage));
  }

  return pages;
} 
