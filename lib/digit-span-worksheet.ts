import { expectedAnswer, makeSequence, type SpanMode } from "./digit-span";

export type DigitSpanWorksheetRow = {
  length: number;
  attempt: "A" | "B";
  sequence: string;
  answer: string;
};

// A finite paper resource; this range does not limit the online game.
export function createDigitSpanWorksheet(random = Math.random, maxLength = 10) {
  if (!Number.isInteger(maxLength) || maxLength < 3 || maxLength > 100) {
    throw new RangeError("Worksheet maximum length must be an integer from 3 to 100");
  }
  const modes: SpanMode[] = ["forward", "backward"];
  return modes.map((mode) => ({
    mode,
    rows: Array.from({ length: maxLength - 2 }, (_, index) => index + 3).flatMap((length) =>
      (["A", "B"] as const).map((attempt) => {
        const sequence = makeSequence(length, random);
        return {
          length,
          attempt,
          sequence,
          answer: expectedAnswer(sequence, mode),
        };
      }),
    ),
  }));
}

export function worksheetRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
