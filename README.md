# FreeFocusGames — Brain Training Games & Focus Tools

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL_3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0.html)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fwww.freefocusgames.com)](https://www.freefocusgames.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

FreeFocusGames is an open-source collection of browser games and tools for practicing attention, memory, visual search, and reaction speed. Play online, explore the source code, or run the project locally. The site supports English and Chinese.

**[Play online](https://www.freefocusgames.com) · [Browse all games](https://www.freefocusgames.com/games) · [中文版](https://www.freefocusgames.com/zh)**

## 🧠 About This Project

This repository contains the source code for [FreeFocusGames](https://www.freefocusgames.com). It brings together interactive versions of tasks such as Dual N-Back, the Stroop task, and Schulte tables, alongside focus timers and casual games.

The source is available for studying how the games generate stimuli, handle input, calculate scores, and display results.

## 🎮 Included Games & Algorithms

A selection of the games and tools available on the site. Each name links directly to the playable page.

| Game or tool | How it works |
| --- | --- |
| [Dual N-Back](https://www.freefocusgames.com/games/dual-n-back) | Track visual positions and sounds, then identify matches with the stimuli presented N steps earlier. |
| [Schulte Table](https://www.freefocusgames.com/games/schulte-table) | Find and select the numbers in a shuffled grid in ascending order while tracking completion time and mistakes. |
| [Rotating Schulte Table](https://www.freefocusgames.com/games/rotating-schulte-table) | Find numbers 1–42 across three independently rotating rings. Each incorrect click adds two seconds to the final time. |
| [Stroop Effect Test](https://www.freefocusgames.com/games/stroop-effect-test) | Respond to a word's ink color while ignoring its meaning, then compare response times for matching and conflicting word–color pairs. |
| [Reaction Time Test](https://www.freefocusgames.com/games/reaction-time) | Wait for the screen to change color, then click or tap. Results show the response time recorded by your browser. |
| [Digit Span Test](https://www.freefocusgames.com/games/digit-span-test) | Recall visually presented digit sequences in forward or backward order as sequence length increases. |
| [Block Memory Challenge](https://www.freefocusgames.com/games/block-memory-challenge) | Recall sequences of highlighted blocks in forward or backward order, with adjustable practice and separate challenge leaderboards. |
| [Pomodoro Timer](https://www.freefocusgames.com/games/pomodoro-timer) | Alternate focused work sessions with breaks using a Pomodoro-style timer. |

Explore the [full game collection](https://www.freefocusgames.com/games) for more memory games, attention tasks, puzzles, and focus tools.

## 🎉 For Fun

- **[SBTI Test](https://www.freefocusgames.com/games/sbti-test)**: A playful, meme-style personality quiz with a shareable result poster.
- **[10-Second Challenge](https://www.freefocusgames.com/games/challenge-10-seconds)**: Stop the timer as close to 10 seconds as possible, with visible and hidden timer modes.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with the App Router and React 19
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI components**: [Radix UI](https://www.radix-ui.com/) and [shadcn/ui](https://ui.shadcn.com/)
- **Animation**: Motion and Canvas Confetti
- **Internationalization**: next-intl, with English and Chinese translations
- **Hosting and storage**: Cloudflare Workers, D1, and R2 via the OpenNext Cloudflare adapter

## 🚀 Getting Started

Use **Node.js 20 or later** and npm.

```bash
# Clone the repository and enter the project directory
git clone https://github.com/loethen/freefocusgames.git
cd freefocusgames

# Install dependencies from the lockfile
npm ci

# Start the development server
npm run dev
```

Open [http://localhost:3003](http://localhost:3003).

The development command starts Next.js with Turbopack. Most gameplay runs in the browser; leaderboard features also need the D1 schema and Cloudflare bindings configured in `wrangler.jsonc`. Database migrations are stored in `drizzle/`. Configure your own Cloudflare resources before deploying a fork.

To check TypeScript types:

```bash
npm run typecheck
```

## 📄 License

This project is licensed under the **AGPL-3.0 License** - see the [LICENSE](LICENSE) file for details.
*   ✅ Free to use for personal/educational purposes.
*   ✅ Free to fork and modify (changes must be open-sourced).
*   ❌ Cannot be used in closed-source proprietary software.

---
*Built with ❤️ for the cognitive science community.*
