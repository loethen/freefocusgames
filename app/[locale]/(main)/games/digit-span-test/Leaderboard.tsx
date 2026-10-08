"use client";

import { gameTabClass, gameTabsClass } from '@/lib/game-tab-styles'
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LeaderboardDisplay } from "@/components/leaderboard-display";
import { cn } from "@/lib/utils";
import { digitSpanLeaderboardMode, type SpanMode } from "@/lib/digit-span";

export default function DigitSpanLeaderboard() {
  const t = useTranslations("games.digitSpanTest.game");
  // The board filter is independent of the running game's recall mode.
  const [direction, setDirection] = useState<SpanMode>("forward");
  const mode = digitSpanLeaderboardMode(direction);
  return (
    <div className="space-y-4">
      <div
        className={cn("mx-auto flex w-fit justify-center gap-1 rounded-lg p-1", gameTabsClass)}
        role="group"
        aria-label={t("leaderboardModeLabel")}
      >
        {(["forward", "backward"] as const).map((option) => (
          <Button
            key={option}
            variant="ghost"
            aria-pressed={direction === option}
            onClick={() => setDirection(option)}
            className={cn(
              "shadow-none",
              gameTabClass(direction === option),
            )}
          >
            {t(option)}
          </Button>
        ))}
      </div>
      <LeaderboardDisplay
        key={mode}
        gameId="digit-span-test"
        formatterType="digits"
        mode={mode}
      />
    </div>
  );
}
