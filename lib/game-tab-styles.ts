/** Shared appearance for game mode tabs and leaderboard filters. */
export const gameTabsClass = "bg-[rgb(13_13_13_/_3%)]";

export function gameTabClass(active: boolean) {
  return active
    ? "bg-background text-foreground hover:bg-background hover:text-foreground shadow-none"
    : "bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground shadow-none";
}
