export type TrailPart = "a" | "b";
export type TrailMode = TrailPart | "both";
export type TrailPoint = { x: number; y: number };
export const TRAIL_BOARD_SIZE = 500;
export const TRAIL_POINT_RADIUS = 22;
export const TRAIL_LAYOUT_VERSION = "scatter-route-v2";
export const TRAIL_LEADERBOARD_MODE = "both-scatter-v1";
export const TRAIL_RULES_VERSION = 1;

// Work in rendered pixels so circular endpoints remain correct on rectangular boards.
export function trailSegmentBetweenEdges(start: TrailPoint, end: TrailPoint, radius: number) {
  const dx = end.x - start.x, dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= radius * 2) return null;
  const offsetX = dx / distance * radius, offsetY = dy / distance * radius;
  return {
    start: { x: start.x + offsetX, y: start.y + offsetY },
    end: { x: end.x - offsetX, y: end.y - offsetY },
  };
}

export type TrailSubmissionDetails = {
  finished?: unknown;
  rulesVersion?: unknown;
  layoutVersion?: unknown;
  aDurationMs?: unknown;
  bDurationMs?: unknown;
  aErrors?: unknown;
  bErrors?: unknown;
  aConnected?: unknown;
  bConnected?: unknown;
  aSeed?: unknown;
  bSeed?: unknown;
  aWidth?: unknown;
  bWidth?: unknown;
  aHeight?: unknown;
  bHeight?: unknown;
  aInputMethod?: unknown;
  bInputMethod?: unknown;
};

export function validateTrailSubmission(score: number, mode: string, details: TrailSubmissionDetails | null) {
  if (mode !== TRAIL_LEADERBOARD_MODE)
    return "Score rejected (Unsupported Trail Making mode)";
  if (!details || details.finished !== true || details.aConnected !== 25 || details.bConnected !== 25)
    return "Score rejected (Complete Parts A and B first)";
  if (details.rulesVersion !== TRAIL_RULES_VERSION || details.layoutVersion !== TRAIL_LAYOUT_VERSION)
    return "Score rejected (Invalid Trail Making rules)";
  const integerInRange = (value: unknown, min: number, max: number): value is number =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
  if (!integerInRange(details.aDurationMs, 1000, 3_600_000) ||
      !integerInRange(details.bDurationMs, 1000, 3_600_000) ||
      !Number.isSafeInteger(score) || score !== details.aDurationMs + details.bDurationMs)
    return "Score rejected (Invalid combined completion time)";
  for (const value of [details.aErrors, details.bErrors])
    if (!integerInRange(value, 0, 100_000)) return "Score rejected (Invalid error count)";
  for (const value of [details.aSeed, details.bSeed])
    if (!integerInRange(value, 0, 0xffffffff)) return "Score rejected (Invalid layout seed)";
  for (const value of [details.aWidth, details.bWidth, details.aHeight, details.bHeight])
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 10_000)
      return "Score rejected (Invalid board dimensions)";
  if (Math.abs((details.aWidth as number) - (details.bWidth as number)) > 0.5 ||
      Math.abs((details.aHeight as number) - (details.bHeight as number)) > 0.5)
    return "Score rejected (Board size changed between parts)";
  for (const value of [details.aInputMethod, details.bInputMethod])
    if (value !== "pointer" && value !== "keyboard" && value !== "mixed")
      return "Score rejected (Invalid input method)";
  return null;
}

export function trailLabels(part: TrailPart, count = 25): string[] {
  return Array.from({ length: count }, (_, index) =>
    part === "a"
      ? String(index + 1)
      : index % 2 === 0
        ? String(index / 2 + 1)
        : String.fromCharCode(65 + (index - 1) / 2),
  );
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function pointToTrailSegmentDistance(
  point: TrailPoint,
  start: TrailPoint,
  end: TrailPoint,
) {
  const dx = end.x - start.x,
    dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const fraction =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((point.x - start.x) * dx + (point.y - start.y) * dy) /
              lengthSquared,
          ),
        );
  return Math.hypot(
    point.x - (start.x + fraction * dx),
    point.y - (start.y + fraction * dy),
  );
}

export const TRAIL_LAYOUT_MARGIN = 44;
export const TRAIL_MIN_POINT_DISTANCE = 84;

function squaredDistance(first: TrailPoint, second: TrailPoint) {
  return (first.x - second.x) ** 2 + (first.y - second.y) ** 2;
}

function scatterPoints(random: () => number, count: number): TrailPoint[] {
  const span = TRAIL_BOARD_SIZE - TRAIL_LAYOUT_MARGIN * 2;
  const sample = () => ({
    x: TRAIL_LAYOUT_MARGIN + random() * span,
    y: TRAIL_LAYOUT_MARGIN + random() * span,
  });
  const clamp = (value: number) =>
    Math.max(
      TRAIL_LAYOUT_MARGIN,
      Math.min(TRAIL_BOARD_SIZE - TRAIL_LAYOUT_MARGIN, value),
    );
  const separated = (points: TrailPoint[]) =>
    points.every((point, index) =>
      points
        .slice(0, index)
        .every(
          (other) =>
            squaredDistance(point, other) >= TRAIL_MIN_POINT_DISTANCE ** 2,
        ),
    );
  // Bounded best-candidate sampling plus continuous repulsion; never snap to rows or a lattice.
  for (let restart = 0; restart < 12; restart++) {
    const points: TrailPoint[] = [];
    for (let index = 0; index < count; index++) {
      let best = sample(),
        clearance = -1;
      for (let candidate = 0; candidate < 96; candidate++) {
        const point = sample();
        const distance = points.reduce(
          (nearest, other) => Math.min(nearest, squaredDistance(point, other)),
          Infinity,
        );
        if (distance > clearance) {
          best = point;
          clearance = distance;
        }
      }
      points.push(best);
    }
    if (separated(points)) return points;
    for (let iteration = 0; iteration < 800; iteration++) {
      for (let first = 0; first < count; first++)
        for (let second = 0; second < first; second++) {
          const dx = points[first].x - points[second].x,
            dy = points[first].y - points[second].y;
          const distance = Math.hypot(dx, dy);
          const target = TRAIL_MIN_POINT_DISTANCE + 2;
          if (distance >= target) continue;
          const angle =
            distance === 0 ? random() * Math.PI * 2 : Math.atan2(dy, dx);
          const movement = (target - distance) * 0.52;
          const offsetX = Math.cos(angle) * movement,
            offsetY = Math.sin(angle) * movement;
          points[first] = {
            x: clamp(points[first].x + offsetX),
            y: clamp(points[first].y + offsetY),
          };
          points[second] = {
            x: clamp(points[second].x - offsetX),
            y: clamp(points[second].y - offsetY),
          };
        }
      if (separated(points)) return points;
    }
  }
  throw new Error(
    "Unable to generate all Trail Making points within the geometry constraints",
  );
}

function routeObstructions(points: TrailPoint[]) {
  let count = 0;
  for (let index = 1; index < points.length; index++)
    for (let other = 0; other < points.length; other++) {
      if (other === index || other === index - 1) continue;
      if (
        pointToTrailSegmentDistance(
          points[other],
          points[index - 1],
          points[index],
        ) <
        TRAIL_POINT_RADIUS + 3
      )
        count++;
    }
  return count;
}

function crossRegionEdges(points: TrailPoint[]) {
  return points
    .slice(1)
    .filter(
      (point, index) =>
        squaredDistance(point, points[index]) >= (TRAIL_BOARD_SIZE * 0.35) ** 2,
    ).length;
}

// Seeded planar scatter; label swaps only reduce occlusion, never minimize total route distance.
export function createTrailLayout(seed: number, count = 25): TrailPoint[] {
  if (count !== 25 && count !== 5)
    throw new RangeError("Trail layouts use 25 formal or 5 practice points");
  const random = seededRandom(seed);
  const positions = scatterPoints(random, count);
  const minimumCrossRegionEdges =
    count === 25 ? Math.ceil((count - 1) * 0.4) : 0;
  let points = positions;
  let bestCrossRegionCount = -1;
  // Bound the initial shuffle too; retain the strongest candidate if the target is not reached.
  for (let shuffle = 0; shuffle < 16; shuffle++) {
    const candidate = positions.slice();
    for (let index = count - 1; index > 0; index--) {
      const other = Math.floor(random() * (index + 1));
      [candidate[index], candidate[other]] = [
        candidate[other],
        candidate[index],
      ];
    }
    const crossing = crossRegionEdges(candidate);
    if (crossing > bestCrossRegionCount) {
      points = candidate;
      bestCrossRegionCount = crossing;
    }
    if (crossing >= minimumCrossRegionEdges) break;
  }
  let obstructions = routeObstructions(points);
  for (let attempt = 0; attempt < 100; attempt++) {
    const first = Math.floor(random() * count),
      second = Math.floor(random() * count);
    if (first === second) continue;
    const candidate = points.slice();
    [candidate[first], candidate[second]] = [
      candidate[second],
      candidate[first],
    ];
    if (crossRegionEdges(candidate) < minimumCrossRegionEdges) continue;
    const next = routeObstructions(candidate);
    if (next < obstructions) {
      points = candidate;
      obstructions = next;
    }
  }
  return points;
}

export type TrailRun = {
  count: number;
  nextIndex: number;
  errors: number;
  finished: boolean;
};
export function initialTrailRun(count = 25): TrailRun {
  return { count, nextIndex: 0, errors: 0, finished: false };
}
export function selectTrailPoint(run: TrailRun, index: number): TrailRun {
  if (
    run.finished ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= run.count
  )
    return run;
  if (index !== run.nextIndex) return { ...run, errors: run.errors + 1 };
  const nextIndex = run.nextIndex + 1;
  return { ...run, nextIndex, finished: nextIndex === run.count };
}
