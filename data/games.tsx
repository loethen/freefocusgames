import { CountingBoxesGamePreview } from "@/app/[locale]/(main)/games/counting-boxes/components/GamePreview";
import { GamePreview as ResonanceBreathingPreview } from "@/app/[locale]/(main)/games/resonance-breathing/GamePreview";
import { ImagePreview } from "@/components/image-preview";


export type Game = {
  id: string;
  title: string;
  slug: string;
  coverImage?: string;
  coverFit?: "cover" | "contain";
  preview?: React.ReactNode;
  categories: string[];
};

export const games: Game[] = [
  {
    id: "resonance-breathing",
    title: "Resonance Breathing",
    slug: "resonance-breathing",
    coverImage: "/games/resonance-breathing-person-cover.png",
    preview: <ResonanceBreathingPreview />,
    categories: ["sustained-attention", "relaxation"],
  },
  {
    id: "box-breathing",
    title: "Box Breathing",
    slug: "box-breathing",
    coverImage: "/games/box-breathing-cover.png",
    preview: <ResonanceBreathingPreview />,
    categories: ["relaxation", "sustained-attention"],
  },
  {
    id: "478-breathing",
    title: "4-7-8 Breathing",
    slug: "478-breathing",
    coverImage: "/games/478-breathing-cover.png",
    preview: <ResonanceBreathingPreview />,
    categories: ["relaxation"],
  },
  {
    id: "pomodoro-timer",
    title: "Pomodoro Timer",
    slug: "pomodoro-timer",
    coverImage: "/games/pomodoro-timer-cover.png",
    preview: (
      <ImagePreview
        src="/games/pomodoro-timer-cover.png"
        alt="Pomodoro Timer preview"
        fit="cover"
      />
    ),
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
    coverImage: "/games/free-short-term-memory-test.png",
    preview: <ImagePreview src="/games/free-short-term-memory-test.png" />,
    categories: ["working-memory", "auditory-processing"],
  },
  {
    id: "challenge10Seconds",
    title: "Challenge 10 Seconds",
    slug: "challenge-10-seconds",
    coverImage: "/games/challenge-10-seconds.png",
    preview: <ImagePreview src="/games/challenge-10-seconds.png" />,
    categories: ["focus-games", "reaction-time", "spring-festival", "for-fun"],
  },
  {
    id: "bamboo-cicada",
    title: "Bamboo Cicada",
    slug: "bamboo-cicada",
    coverImage: "/games/bamboo-cicada-cover.png",
    preview: (
      <ImagePreview
        src="/games/bamboo-cicada-cover.png"
        alt="Bamboo Cicada game preview"
        fit="cover"
      />
    ),
    categories: ["for-fun"],
  },
  {
    id: "baby-animal-matching",
    title: "Baby Animal Matching",
    slug: "baby-animal-matching",
    coverImage: "/games/baby-animal-matching-cover.png",
    preview: (
      <ImagePreview
        src="/games/baby-animal-matching-cover.png"
        alt="Baby Animal Matching preview"
        fit="cover"
      />
    ),
    categories: ["working-memory", "visual-tracking", "brain-games-for-kids"],
  },
  {
    id: "memory-matching-game",
    title: "Memory Matching Game",
    slug: "memory-matching-game",
    coverImage: "/games/memory-matching-game-cover.png",
    preview: (
      <ImagePreview
        src="/games/memory-matching-game-cover.png"
        alt="Memory Matching Game preview"
        fit="cover"
      />
    ),
    categories: ["working-memory", "visual-tracking", "sustained-attention", "adhd-games"],
  },
  {
    id: "dual-n-back",
    title: "Dual N-Back",
    slug: "dual-n-back",
    coverImage: "/games/dual-n-back-cover.png",
    preview: (
      <ImagePreview
        src="/games/dual-n-back-cover.png"
        alt="Dual N-Back game preview"
        fit="cover"
      />
    ),
    categories: ["working-memory", "divided-attention", "adhd-games"],
  },
  {
    id: "double-decision",
    title: "Double Decision Game",
    slug: "double-decision",
    coverImage: "/games/double-decision-cover.png",
    preview: (
      <ImagePreview
        src="/games/double-decision-cover.png"
        alt="Double Decision Game preview"
        fit="cover"
      />
    ),
    categories: ["divided-attention", "visual-tracking", "reaction-time", "selective-attention"],
  },
  {
    id: "fish-trace",
    title: "Glowing Fish Trace",
    slug: "fish-trace",
    coverImage: "/games/fish-trace-cover.png",
    preview: (
      <ImagePreview
        src="/games/fish-trace-cover.png"
        alt="Glowing Fish Trace preview"
        fit="cover"
      />
    ),
    categories: ["visual-tracking", "sustained-attention", "brain-games-for-kids", "adhd-games"],
  },
  {
    id: "frog-memory-leap",
    title: "Frog Memory Leap",
    slug: "frog-memory-leap",
    coverImage: "/games/frog-memory-leap-cover.png",
    preview: (
      <ImagePreview
        src="/games/frog-memory-leap-cover.png"
        alt="Frog Memory Leap preview"
        fit="cover"
      />
    ),
    categories: ["working-memory", "visual-tracking", "brain-games-for-kids"],
  },
  {
    id: "larger-number",
    title: "Larger Number",
    slug: "larger-number",
    coverImage: "/games/larger-number-cover.png",
    preview: (
      <ImagePreview
        src="/games/larger-number-cover.png"
        alt="Larger Number Challenge preview"
        fit="cover"
      />
    ),
    categories: ["reaction-time", "selective-attention", "brain-games-for-kids"],
  },
  {
    id: "mahjong-dual-n-back",
    title: "Mahjong Dual N-Back",
    slug: "mahjong-dual-n-back",
    coverImage: "/games/mahjong-dual-n-back.png",
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
    coverImage: "/games/block-memory-challenge-cover.png",
    preview: (
      <ImagePreview
        src="/games/block-memory-challenge-cover.png"
        alt="Block Memory Challenge preview"
        fit="cover"
      />
    ),
    categories: ["working-memory", "visual-tracking", "brain-games-for-kids", "adhd-games"],
  },
  {
    id: "schulte-table",
    title: "Schulte Table",
    slug: "schulte-table",
    coverImage: "/games/schulte-table-cover.png",
    preview: (
      <ImagePreview
        src="/games/schulte-table-cover.png"
        alt="Schulte Table game preview"
        fit="cover"
      />
    ),
    categories: ["selective-attention", "visual-tracking", "reaction-time", "adhd-games", "brain-games-for-kids"],
  },
  {
    id: "rotating-schulte-table",
    title: "Rotating Schulte Table",
    slug: "rotating-schulte-table",
    coverImage: "/games/rotating-schulte-table.png",
    coverFit: "contain",
    preview: (
      <ImagePreview
        src="/games/rotating-schulte-table.png"
        alt="Rotating Schulte Table game preview"
        fit="contain"
        className="bg-white"
      />
    ),
    categories: ["selective-attention", "visual-tracking", "reaction-time", "sustained-attention"],
  },
  {
    id: "reaction-time",
    title: "Reaction Time Test",
    slug: "reaction-time",
    coverImage: "/games/reaction-time.png",
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
    coverImage: "/games/stroop-effect-cover.png",
    preview: (
      <ImagePreview
        src="/games/stroop-effect-cover.png"
        alt="Stroop Effect Test preview"
        fit="cover"
      />
    ),
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
    coverImage: "/games/focus-reaction-test.png",
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
    coverImage: "/games/focus-sudoku-cover.png",
    preview: (
      <ImagePreview
        src="/games/focus-sudoku-cover.png"
        alt="Focus Sudoku game preview"
        fit="cover"
      />
    ),
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
    coverImage: "/games/cps-test-cover.png",
    preview: (
      <ImagePreview
        src="/games/cps-test-cover.png"
        alt="CPS Test preview"
        fit="cover"
      />
    ),
    categories: [
      "reaction-time",
      "brain-games-for-kids",
    ],
  },
  {
    id: "spacebar-clicker",
    title: "Spacebar Clicker Test",
    slug: "spacebar-clicker",
    coverImage: "/games/spacebar-clicker-cover.png",
    preview: (
      <ImagePreview
        src="/games/spacebar-clicker-cover.png"
        alt="Spacebar Clicker Test preview"
        fit="cover"
      />
    ),
    categories: [
      "reaction-time",
      "sustained-attention",
    ],
  },
  {
    id: "sbti-test",
    title: "SBTI Personality Test",
    slug: "sbti-test",
    coverImage: "/games/sbti-test-cover.png",
    preview: (
      <ImagePreview
        src="/games/sbti-test-cover.png"
        alt="SBTI preview"
        fit="cover"
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
    'rotating-schulte-table', // Rotating Schulte Table - Newest
    'double-decision', // Double Decision Game - Newest
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
