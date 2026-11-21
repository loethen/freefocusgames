import { levenshteinDistance, type RandomSource } from "@/lib/career-test-scenarios";

export type TenKeyMode = "numbers" | "currency" | "codes";

export type TenKeyCompletedEntry = {
  target: string;
  typed: string;
};

export type TenKeyMetrics = {
  netKph: number;
  grossKph: number;
  accuracy: number;
  errors: number;
  grossKeystrokes: number;
  entriesCompleted: number;
  entriesExact: number;
};

function randomInt(min: number, max: number, random: RandomSource): number {
  return min + Math.floor(random() * (max - min + 1));
}

function randomDigits(length: number, random: RandomSource, allowLeadingZero = true): string {
  return Array.from({ length }, (_, index) => {
    const minDigit = !allowLeadingZero && index === 0 ? 1 : 0;
    return String(randomInt(minDigit, 9, random));
  }).join("");
}

export function generateTenKeyEntry(
  mode: TenKeyMode,
  random: RandomSource = Math.random
): string {
  if (mode === "currency") {
    const tier = random();
    const dollars =
      tier < 0.35
        ? randomInt(5, 99, random)
        : tier < 0.78
          ? randomInt(100, 999, random)
          : randomInt(1000, 9899, random);
    const cents = String(randomInt(0, 99, random)).padStart(2, "0");
    return `${dollars}.${cents}`;
  }

  if (mode === "codes") {
    const kind = random();
    if (kind < 0.45) {
      // 5-digit ZIP / postal code
      return randomDigits(5, random, true);
    }
    if (kind < 0.78) {
      // 7-digit invoice / order code
      return randomDigits(7, random, false);
    }
    // 9-digit account / routing style number
    return randomDigits(9, random, true);
  }

  // Standard 10-key numbers: 4 to 8 digits
  const length = randomInt(4, 8, random);
  return randomDigits(length, random, false);
}

export function generateTenKeyQueue(
  mode: TenKeyMode,
  count: number,
  random: RandomSource = Math.random
): string[] {
  return Array.from({ length: count }, () => generateTenKeyEntry(mode, random));
}

export function sanitizeTenKeyInput(raw: string, allowDecimal: boolean): string {
  const cleaned = allowDecimal
    ? raw.replace(/[^0-9.]/g, "")
    : raw.replace(/[^0-9]/g, "");

  if (!allowDecimal) return cleaned;

  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return (
    cleaned.slice(0, firstDot + 1) +
    cleaned.slice(firstDot + 1).replace(/\./g, "")
  );
}

/**
 * Calculates industry-standard 10-key KPH (Keystrokes Per Hour) and accuracy.
 * Each submitted entry counts its characters plus 1 confirmation keystroke (Enter).
 */
export function calculateTenKeyMetrics(
  completed: readonly TenKeyCompletedEntry[],
  activeTarget: string,
  activeTyped: string,
  elapsedSeconds: number
): TenKeyMetrics {
  let grossKeystrokes = 0;
  let totalCompared = 0;
  let errors = 0;
  let entriesExact = 0;

  for (const entry of completed) {
    const target = entry.target.trim();
    const typed = entry.typed.trim();
    const entryErrors = levenshteinDistance(target, typed);
    errors += entryErrors;
    if (entryErrors === 0) entriesExact += 1;
    // +1 accounts for the Enter keystroke used to submit each line in 10-key testing.
    grossKeystrokes += typed.length + 1;
    totalCompared += Math.max(target.length, typed.length) + 1;
  }

  const trimmedActive = activeTyped.trim();
  if (trimmedActive.length > 0) {
    const targetSlice = activeTarget.slice(0, trimmedActive.length);
    const activeErrors = levenshteinDistance(targetSlice, trimmedActive);
    errors += activeErrors;
    grossKeystrokes += trimmedActive.length;
    totalCompared += Math.max(targetSlice.length, trimmedActive.length);
  }

  const elapsedHours = Math.max(elapsedSeconds, 1) / 3600;
  const grossKph = Math.round(grossKeystrokes / elapsedHours);
  const accuracy =
    totalCompared > 0
      ? Math.max(
          0,
          Math.round(((totalCompared - errors) / totalCompared) * 1000) / 10
        )
      : 100;
  const netKph = Math.max(0, Math.round(grossKph * (accuracy / 100)));

  return {
    netKph,
    grossKph,
    accuracy,
    errors,
    grossKeystrokes,
    entriesCompleted: completed.length,
    entriesExact,
  };
}
