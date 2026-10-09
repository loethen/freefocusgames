const fs = require("fs");
const assert = require("assert/strict");
const ts = require("typescript");
const code = ts.transpileModule(
  fs.readFileSync("lib/trail-making.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const mod = { exports: {} };
new Function("exports", "module", code)(mod.exports, mod);
const {
  trailLabels,
  createTrailLayout,
  initialTrailRun,
  selectTrailPoint,
  pointToTrailSegmentDistance,
  TRAIL_BOARD_SIZE,
  TRAIL_POINT_RADIUS,
  TRAIL_LAYOUT_MARGIN,
  TRAIL_MIN_POINT_DISTANCE,
  TRAIL_LAYOUT_VERSION,
  TRAIL_LEADERBOARD_MODE,
  TRAIL_RULES_VERSION,
  trailSegmentBetweenEdges,
  validateTrailSubmission,
} = mod.exports;

// Endpoints use screen coordinates, including when a mobile board is taller than wide.
for (const [start, end, radius] of [
  [{ x: 0, y: 0 }, { x: 100, y: 0 }, 16],
  [{ x: 80, y: 40 }, { x: 80, y: 300 }, 20],
  [{ x: 20, y: 300 }, { x: 280, y: 30 }, 16],
  [{ x: 280, y: 30 }, { x: 20, y: 300 }, 20],
]) {
  const segment = trailSegmentBetweenEdges(start, end, radius);
  assert(segment);
  assert(Math.abs(Math.hypot(segment.start.x - start.x, segment.start.y - start.y) - radius) < 1e-9);
  assert(Math.abs(Math.hypot(segment.end.x - end.x, segment.end.y - end.y) - radius) < 1e-9);
  assert(pointToTrailSegmentDistance(segment.start, start, end) < 1e-9);
  assert(pointToTrailSegmentDistance(segment.end, start, end) < 1e-9);
}
assert.equal(trailSegmentBetweenEdges({ x: 0, y: 0 }, { x: 0, y: 0 }, 16), null);
assert.equal(trailSegmentBetweenEdges({ x: 0, y: 0 }, { x: 30, y: 0 }, 16), null);

const details = {
  finished: true, rulesVersion: TRAIL_RULES_VERSION, layoutVersion: TRAIL_LAYOUT_VERSION,
  aDurationMs: 30_123, bDurationMs: 48_456, aErrors: 1, bErrors: 2,
  aConnected: 25, bConnected: 25, aSeed: 0, bSeed: 0xffffffff,
  aWidth: 280, bWidth: 280, aHeight: 360, bHeight: 360,
  aInputMethod: "pointer", bInputMethod: "mixed",
};
const combinedTime = details.aDurationMs + details.bDurationMs;
assert.equal(validateTrailSubmission(combinedTime, TRAIL_LEADERBOARD_MODE, details), null);
assert(validateTrailSubmission(combinedTime, "part-a", details));
assert(validateTrailSubmission(combinedTime, TRAIL_LEADERBOARD_MODE, null));
assert(validateTrailSubmission(combinedTime + 1, TRAIL_LEADERBOARD_MODE, details));
assert(validateTrailSubmission(NaN, TRAIL_LEADERBOARD_MODE, details));
for (const change of [
  { finished: false }, { aConnected: 5 }, { bConnected: 24 },
  { rulesVersion: -1 }, { layoutVersion: "old" },
  { aDurationMs: -100 }, { bDurationMs: Infinity }, { aDurationMs: 30_123.5 },
  { aDurationMs: 999 }, { bDurationMs: 3_600_001 },
  { aErrors: -1 }, { bErrors: 0.5 }, { aSeed: -1 }, { bSeed: 0x100000000 },
  { bWidth: 300 }, { bHeight: 400 }, { aWidth: 0 }, { aHeight: NaN },
  { aInputMethod: null }, { bInputMethod: "unknown" },
]) assert(validateTrailSubmission(combinedTime, TRAIL_LEADERBOARD_MODE, { ...details, ...change }));

function loadTs(path, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "exports", "module", code)(name => dependencies[name] ?? require(name), loaded.exports, loaded);
  return loaded.exports;
}
const config = loadTs("lib/leaderboard-config.ts");
const snapshots = loadTs("lib/leaderboard-snapshots.ts", { "@/lib/leaderboard-config": config });
assert.equal(snapshots.isHigherScoreBetter("trail-making-test"), false);
assert(snapshots.isBetterScore("trail-making-test", 70_000, 80_000));
assert.equal(snapshots.isBetterScore("trail-making-test", 90_000, 80_000), false);
const empty = snapshots.createEmptySnapshot("trail-making-test", TRAIL_LEADERBOARD_MODE);
const first = snapshots.updateSnapshotWithScore(empty, {
  playerId: "player-1", playerName: "First", score: 80_000, createdAt: "2026-10-09T00:00:00Z", details,
}, { isFirstPlayer: true, previousBestScore: null });
const second = snapshots.updateSnapshotWithScore(first, {
  playerId: "player-2", playerName: "Second", score: 70_000, createdAt: "2026-10-09T00:01:00Z", details,
}, { isFirstPlayer: true, previousBestScore: null });
assert.deepEqual(second.entries.map(entry => entry.score), [70_000, 80_000]);
assert.equal(second.totalPlayers, 2);
const improved = snapshots.updateSnapshotWithScore(second, {
  playerId: "player-1", playerName: "First", score: 60_000, createdAt: "2026-10-09T00:02:00Z", details,
}, { isFirstPlayer: false, previousBestScore: 80_000 });
assert.deepEqual(improved.entries.map(entry => entry.score), [60_000, 70_000]);
assert.equal(improved.totalPlayers, 2);
assert.equal(improved.scoreSum, 130_000);
assert.equal(snapshots.updateSnapshotWithScore(improved, {
  playerId: "player-1", playerName: "First", score: 90_000, createdAt: "2026-10-09T00:03:00Z",
}, { isFirstPlayer: false, previousBestScore: 60_000 }), improved);
console.log("Circle-edge geometry, A & B submission validation and ascending leaderboard snapshots passed.");
assert.deepEqual(
  trailLabels("a"),
  Array.from({ length: 25 }, (_, i) => String(i + 1)),
);
assert.deepEqual(trailLabels("b"), [
  "1",
  "A",
  "2",
  "B",
  "3",
  "C",
  "4",
  "D",
  "5",
  "E",
  "6",
  "F",
  "7",
  "G",
  "8",
  "H",
  "9",
  "I",
  "10",
  "J",
  "11",
  "K",
  "12",
  "L",
  "13",
]);
assert.deepEqual(trailLabels("b", 5), ["1", "A", "2", "B", "3"]);
assert.throws(() => createTrailLayout(1, 12), RangeError);
assert.equal(TRAIL_LAYOUT_VERSION, "scatter-route-v2");
const seeds = [
  ...new Set([
    0,
    20261009,
    4294967295,
    ...Array.from({ length: 128 }, (_, i) => i),
    ...Array.from(
      { length: 256 },
      (_, i) => Math.imul(i + 1, 0x9e3779b1) >>> 0,
    ),
  ]),
];
let minimumDistance = Infinity;
let obstructedSegments = 0;
let minimumLongEdgeRatio = 1;
let maximumNearestEdgeRatio = 0;
let generationMs = 0;
let maximumGenerationMs = 0;
let nonUniformCellLayouts = 0;
const nearOldAxis = (value) =>
  Math.min(...[50, 150, 250, 350, 450].map((axis) => Math.abs(value - axis))) <=
  10;
for (const seed of seeds) {
  for (const count of [5, 25]) {
    const start = performance.now();
    const points = createTrailLayout(seed, count);
    const duration = performance.now() - start;
    generationMs += duration;
    maximumGenerationMs = Math.max(maximumGenerationMs, duration);
    assert(
      duration < 500,
      `Bounded generator too slow for seed ${seed}: ${duration}ms`,
    );
    assert.equal(points.length, count);
    assert.deepEqual(points, createTrailLayout(seed, count));
    assert.equal(
      new Set(points.map((point) => `${point.x},${point.y}`)).size,
      count,
    );
    for (let index = 0; index < count; index++) {
      for (const axis of ["x", "y"])
        assert(
          points[index][axis] >= TRAIL_LAYOUT_MARGIN &&
            points[index][axis] <= TRAIL_BOARD_SIZE - TRAIL_LAYOUT_MARGIN,
        );
      assert(points[index].y + 34 < TRAIL_BOARD_SIZE);
      for (let other = 0; other < index; other++) {
        const distance = Math.hypot(
          points[index].x - points[other].x,
          points[index].y - points[other].y,
        );
        minimumDistance = Math.min(minimumDistance, distance);
        assert(distance >= TRAIL_MIN_POINT_DISTANCE);
        assert(distance > TRAIL_POINT_RADIUS * 2);
      }
    }
    for (let i = 1; i < count; i++)
      for (let j = 0; j < count; j++)
        if (
          j !== i &&
          j !== i - 1 &&
          pointToTrailSegmentDistance(points[j], points[i - 1], points[i]) <
            TRAIL_POINT_RADIUS
        )
          obstructedSegments++;
    if (count === 25) {
      // Reject the previous 5x5 +/-5 jitter signature, while allowing chance alignment of a few points.
      assert(
        points.filter((point) => nearOldAxis(point.x) && nearOldAxis(point.y))
          .length < 18,
      );
      assert(new Set(points.map((point) => Math.round(point.x))).size >= 15);
      assert(new Set(points.map((point) => Math.round(point.y))).size >= 15);
      const cells = new Set(
        points.map(
          (point) =>
            `${Math.floor(point.x / 100)},${Math.floor(point.y / 100)}`,
        ),
      );
      if (cells.size !== 25) nonUniformCellLayouts++;
      let longEdges = 0,
        nearestEdges = 0;
      for (let i = 0; i < count - 1; i++) {
        const edgeDistance = Math.hypot(
          points[i].x - points[i + 1].x,
          points[i].y - points[i + 1].y,
        );
        if (edgeDistance >= TRAIL_BOARD_SIZE * 0.35) longEdges++;
        const nearest = Math.min(
          ...points
            .filter((_, index) => index !== i)
            .map((point) =>
              Math.hypot(points[i].x - point.x, points[i].y - point.y),
            ),
        );
        if (Math.abs(edgeDistance - nearest) < 1e-6) nearestEdges++;
      }
      const longRatio = longEdges / (count - 1),
        nearestRatio = nearestEdges / (count - 1);
      minimumLongEdgeRatio = Math.min(minimumLongEdgeRatio, longRatio);
      maximumNearestEdgeRatio = Math.max(maximumNearestEdgeRatio, nearestRatio);
      assert(
        longRatio >= 0.4,
        `Too few cross-region connections for seed ${seed}`,
      );
      assert(nearestRatio < 0.75, `Near-neighbor route for seed ${seed}`);
    }
  }
}
assert(
  nonUniformCellLayouts / seeds.length > 0.9,
  "Scatter should not systematically assign one point per 5x5 cell",
);
assert(
  generationMs / (seeds.length * 2) < 40,
  "Mean generation time should remain practical",
);
assert.notDeepEqual(createTrailLayout(1), createTrailLayout(2));
let run = initialTrailRun();
const wrong = selectTrailPoint(run, 7);
assert.equal(wrong.nextIndex, 0);
assert.equal(wrong.errors, 1);
assert.equal(wrong.finished, false);
run = selectTrailPoint(wrong, 0);
assert.equal(run.nextIndex, 1);
assert.equal(run.errors, 1);
run = selectTrailPoint(run, 0);
assert.equal(run.nextIndex, 1);
assert.equal(run.errors, 2);
for (let i = 1; i < 25; i++) {
  run = selectTrailPoint(run, i);
  assert.equal(run.finished, i === 24);
}
assert.equal(run.nextIndex, 25);
assert.equal(run.errors, 2);
assert.equal(selectTrailPoint(run, 24), run);
assert.equal(selectTrailPoint(run, 0), run);
assert.equal(selectTrailPoint(initialTrailRun(), NaN).errors, 0);
assert.equal(selectTrailPoint(initialTrailRun(), 25).nextIndex, 0);
let practice = initialTrailRun(5);
for (let i = 0; i < 5; i++) practice = selectTrailPoint(practice, i);
assert.equal(practice.finished, true);
console.log(
  `Trail Making scatter: ${seeds.length * 2} layouts passed; min spacing ${minimumDistance.toFixed(2)}, min cross-region edges ${(minimumLongEdgeRatio * 100).toFixed(1)}%, max nearest-neighbor edges ${(maximumNearestEdgeRatio * 100).toFixed(1)}%, nonuniform 5x5 occupancy ${nonUniformCellLayouts}/${seeds.length}; mean ${(generationMs / (seeds.length * 2)).toFixed(2)}ms, max ${maximumGenerationMs.toFixed(2)}ms; remaining circle crossings ${obstructedSegments}. Labels, deterministic seeds and run progression passed.`,
);
