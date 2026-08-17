export type RandomSource = () => number;

export type DispatcherScenario = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  vehicle: string;
  licensePlate: string;
  direction: string;
  incident: string;
};

const FIRST_NAMES = [
  "ALEX",
  "BRIANNA",
  "CARLOS",
  "DANIEL",
  "ELENA",
  "FATIMA",
  "GABRIEL",
  "HANNAH",
  "ISAIAH",
  "JORDAN",
  "KIMBERLY",
  "MARCUS",
  "NATALIE",
  "OMAR",
  "PRIYA",
  "RACHEL",
  "SAMUEL",
  "TAYLOR",
];

const LAST_NAMES = [
  "ADAMS",
  "BROWN",
  "CHEN",
  "DAVIS",
  "EDWARDS",
  "FLORES",
  "GARCIA",
  "HARRIS",
  "JOHNSON",
  "KIM",
  "LEE",
  "MARTINEZ",
  "NGUYEN",
  "PATEL",
  "ROBINSON",
  "SANCHEZ",
  "THOMPSON",
  "WILSON",
];

const STREET_NAMES = [
  "CEDAR",
  "HARBOR",
  "JUNIPER",
  "LAKEVIEW",
  "MAPLE",
  "OAKRIDGE",
  "PINE",
  "RIVER",
  "SUNSET",
  "WILLOW",
];

const STREET_TYPES = ["AVE", "BLVD", "DR", "LN", "RD", "ST", "WAY"];
const CITIES = ["BROOKFIELD", "FAIRVIEW", "LAKEWOOD", "RIVERTON", "WESTFIELD"];
const COLORS = ["BLACK", "BLUE", "GRAY", "GREEN", "RED", "SILVER", "WHITE"];
const VEHICLES = [
  "FORD FOCUS",
  "HONDA CIVIC",
  "HYUNDAI ELANTRA",
  "NISSAN ALTIMA",
  "SUBARU OUTBACK",
  "TOYOTA CAMRY",
];
const DIRECTIONS = ["EASTBOUND", "NORTHBOUND", "SOUTHBOUND", "WESTBOUND"];
const INCIDENTS = [
  "a stalled vehicle blocking the right lane",
  "a smoke alarm sounding inside an apartment",
  "a person feeling faint at a bus stop",
  "a broken traffic signal at the intersection",
  "a damaged water main flooding the roadway",
  "two people arguing loudly in a parking lot",
];

function pick<T>(values: readonly T[], random: RandomSource): T {
  return values[Math.floor(random() * values.length)];
}

function randomDigits(length: number, random: RandomSource): string {
  return Array.from({ length }, () => Math.floor(random() * 10)).join("");
}

function randomLetters(length: number, random: RandomSource): string {
  const alphabet = "ABCDEFGHJKLMNPRSTUVWXYZ";
  return Array.from(
    { length },
    () => alphabet[Math.floor(random() * alphabet.length)]
  ).join("");
}

export function createSeededRandom(seed: number): RandomSource {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function createDispatcherScenario(
  random: RandomSource = Math.random
): DispatcherScenario {
  const streetNumber = 100 + Math.floor(random() * 9700);
  const phoneSuffix = String(100 + Math.floor(random() * 100));
  const zip = `9${randomDigits(4, random)}`;

  return {
    firstName: pick(FIRST_NAMES, random),
    lastName: pick(LAST_NAMES, random),
    phone: `202-555-0${phoneSuffix}`,
    address: `${streetNumber} ${pick(STREET_NAMES, random)} ${pick(STREET_TYPES, random)}`,
    city: pick(CITIES, random),
    zip,
    vehicle: `${pick(COLORS, random)} ${pick(VEHICLES, random)}`,
    licensePlate: `${randomLetters(3, random)}${randomDigits(4, random)}`,
    direction: pick(DIRECTIONS, random),
    incident: pick(INCIDENTS, random),
  };
}

export function scenarioToWrittenCall(scenario: DispatcherScenario): string {
  return `${scenario.firstName} ${scenario.lastName} is calling from ${scenario.address} in ${scenario.city}, zip code ${scenario.zip}. The callback number is ${scenario.phone}. The caller reports ${scenario.incident}. A ${scenario.vehicle}, plate ${scenario.licensePlate}, was last seen traveling ${scenario.direction}.`;
}

export function scenarioToSpokenCall(scenario: DispatcherScenario): string {
  const spelledPlate = scenario.licensePlate.split("").join(" ");
  return `Caller ${scenario.firstName} ${scenario.lastName}. Callback number ${scenario.phone}. Address ${scenario.address}, ${scenario.city}, zip code ${scenario.zip}. The caller reports ${scenario.incident}. Vehicle ${scenario.vehicle}. License plate ${spelledPlate}. Direction of travel ${scenario.direction}.`;
}

export function normalizeDispatcherValue(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function createComparisonPair(random: RandomSource = Math.random): {
  left: string;
  right: string;
  isMatch: boolean;
} {
  const usePlate = random() > 0.45;
  const left = usePlate
    ? `${randomLetters(3, random)}${randomDigits(4, random)}`
    : randomDigits(9, random);
  const isMatch = random() > 0.5;

  if (isMatch) {
    return { left, right: left, isMatch };
  }

  const index = Math.floor(random() * left.length);
  const original = left[index];
  const replacementPool = /\d/.test(original)
    ? "0123456789".replace(original, "")
    : "ABCDEFGHJKLMNPRSTUVWXYZ".replace(original, "");
  const replacement = replacementPool[Math.floor(random() * replacementPool.length)];
  const right = `${left.slice(0, index)}${replacement}${left.slice(index + 1)}`;
  return { left, right, isMatch };
}

export function levenshteinDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

export function calculateTypingMetrics(
  reference: string,
  typed: string,
  elapsedSeconds: number
) {
  const normalizedReference = reference.replace(/\s+/g, " ").trim();
  const normalizedTyped = typed.replace(/\s+/g, " ").trim();
  const elapsedMinutes = Math.max(elapsedSeconds / 60, 1 / 60);
  const distance = levenshteinDistance(normalizedReference, normalizedTyped);
  const comparisonLength = Math.max(normalizedReference.length, normalizedTyped.length, 1);
  const accuracy = Math.max(0, Math.round((1 - distance / comparisonLength) * 100));
  const grossWpm = Math.round(normalizedTyped.length / 5 / elapsedMinutes);
  const netWpm = Math.max(0, Math.round(grossWpm - distance / elapsedMinutes / 5));

  return { accuracy, grossWpm, netWpm, errors: distance };
}
