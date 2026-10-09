export const ROTATING_SCHULTE_MAX_TIME_MS = 180_000;
export const ROTATING_SCHULTE_SESSION_TTL_MS = 240_000;
export const ROTATING_SCHULTE_TOTAL_NUMBERS = 42;
export const ROTATING_SCHULTE_PENALTY_MS = 2000;

export function validateRotatingSchulteScore(
  score: number,
  mode: string,
  details: Record<string, unknown> | null,
) {
  if (mode !== 'ranked' || !Number.isInteger(score) ||
      score <= 0 || score > ROTATING_SCHULTE_MAX_TIME_MS) {
    return 'Score rejected (Invalid rotating Schulte completion time or mode)';
  }
  if (!details || typeof details.sessionId !== 'string' ||
      !/^[a-f0-9]{32}$/.test(details.sessionId) ||
      !Number.isInteger(details.rawTimeMs) || !Number.isInteger(details.mistakes) ||
      (details.rawTimeMs as number) <= 0 ||
      (details.mistakes as number) < 0 ||
      score !== (details.rawTimeMs as number) + (details.mistakes as number) * ROTATING_SCHULTE_PENALTY_MS ||
      typeof details.clickTimes !== 'string' || details.clickTimes.length > 1000) {
    return 'Score rejected (Missing or inconsistent rotating Schulte evidence)';
  }
  let clicks: unknown;
  try { clicks = JSON.parse(details.clickTimes); } catch { return 'Score rejected (Invalid click times)'; }
  if (!Array.isArray(clicks) || clicks.length !== ROTATING_SCHULTE_TOTAL_NUMBERS) {
    return 'Score rejected (Incomplete rotating Schulte sequence)';
  }
  let previous = 0;
  for (let index = 0; index < clicks.length; index += 1) {
    const click = clicks[index];
    if (!Number.isInteger(click) || click <= previous || click > (details.rawTimeMs as number)) {
      return 'Score rejected (Invalid rotating Schulte click timing)';
    }
    previous = click;
  }
  if ((details.rawTimeMs as number) - previous > 100) {
    return 'Score rejected (Completion does not match final click)';
  }
  return null;
}

export function isRotatingSchulteSessionTimingValid(startedAt: number, now: number, rawTimeMs: number) {
  const serverElapsed = now - startedAt;
  return rawTimeMs > 0 && serverElapsed > 0 &&
    serverElapsed <= ROTATING_SCHULTE_SESSION_TTL_MS &&
    rawTimeMs <= serverElapsed + 1000 && serverElapsed - rawTimeMs <= 15_000;
}
