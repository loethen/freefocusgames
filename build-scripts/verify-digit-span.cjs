const fs = require("fs");
const ts = require("typescript");
const assert = require("assert/strict");
const source = fs.readFileSync("lib/digit-span.ts", "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const moduleObject = { exports: {} };
new Function("exports", "module", js)(moduleObject.exports, moduleObject);
const {
  expectedAnswer,
  makeSequence,
  spanProgress,
  isCompletedDigitSpanRun,
  digitSpanLeaderboardMode,
  isDigitSpanLeaderboardMode,
  digitSpanSubmissionDetails,
  validateDigitSpanSubmission,
} = moduleObject.exports;

assert.equal(expectedAnswer("007", "forward"), "007");
assert.equal(expectedAnswer("007", "backward"), "700");
assert.equal(expectedAnswer("121", "backward"), "121");
assert.equal(
  makeSequence(3, () => 0),
  "000",
);
assert.equal(
  makeSequence(3, () => 0.99),
  "999",
);
const trial = (length, correct) => ({
  sequence: "0".repeat(length),
  answer: (correct ? "0" : "1").repeat(length),
  correct,
});
const completed = (score) => {
  const records = [];
  for (let length = 3; length <= score; length++)
    records.push(trial(length, false), trial(length, true));
  records.push(trial(score + 1, false), trial(score + 1, false));
  return records;
};
assert.deepEqual(spanProgress([]), { length: 3, done: false, best: 0 });
assert.deepEqual(spanProgress([trial(3, true)]), {
  length: 4,
  done: false,
  best: 3,
});
assert.deepEqual(spanProgress([trial(3, false)]), {
  length: 3,
  done: false,
  best: 0,
});
assert.equal(spanProgress([trial(3, false), trial(3, true)]).length, 4);
assert.equal(spanProgress([trial(3, false), trial(3, false)]).done, true);
for (const length of [12, 13, 30, 100]) {
  const progress = spanProgress([trial(length, true)]);
  assert.equal(progress.length, length + 1);
  assert.equal(progress.done, false);
}
assert.deepEqual(spanProgress(completed(13)), {
  length: 14,
  done: true,
  best: 13,
});

for (const direction of ["forward", "backward"]) {
  const mode = digitSpanLeaderboardMode(direction);
  const details = digitSpanSubmissionDetails(completed(13), direction);
  assert.equal(isDigitSpanLeaderboardMode(mode), true);
  assert.equal(validateDigitSpanSubmission(13, mode, details), null);
  for (const bad of [
    null,
    { ...details, direction: direction === "forward" ? "backward" : "forward" },
    { ...details, rulesVersion: 2 },
    { ...details, presentation: "audio" },
    { ...details, protocol: "visual-700-300-v2" },
    { ...details, digitDisplayMs: 800 },
    { ...details, digitGapMs: 200 },
    { ...details, startingLength: 4 },
    { ...details, finished: false },
    { ...details, failedLength: 13 },
    { ...details, finalLengthCorrectTrials: 1 },
    { ...details, totalTrials: 12 },
    { ...details, totalTrials: 25 },
    { ...details, finalLengthTrials: 1 },
    { ...details, totalTrials: NaN },
    { ...details, correctTrials: 0 },
    { ...details, correctTrials: 23 },
    { ...details, correctTrials: Infinity },
    { ...details, correctTrials: "11" },
  ])
    assert.notEqual(validateDigitSpanSubmission(13, mode, bad), null);
  for (const score of [
    0,
    2,
    12,
    14,
    13.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ])
    assert.notEqual(validateDigitSpanSubmission(score, mode, details), null);
  assert.notEqual(validateDigitSpanSubmission(13, "standard", details), null);
  assert.notEqual(
    validateDigitSpanSubmission(13, "visual-forward-v2", details),
    null,
  );
  const firstTry = Array.from({ length: 11 }, (_, i) => trial(i + 3, true));
  firstTry.push(trial(14, false), trial(14, false));
  assert.equal(
    validateDigitSpanSubmission(
      13,
      mode,
      digitSpanSubmissionDetails(firstTry, direction),
    ),
    null,
  );
  assert.equal(isCompletedDigitSpanRun(firstTry, direction), true);
  for (const invalidPath of [
    [trial(3, true), trial(3, true), trial(4, false), trial(4, false)],
    [trial(3, true), trial(5, false), trial(5, false)],
    [trial(3, false), trial(3, false), trial(3, false)],
    [{ ...trial(3, true), answer: "111" }, trial(4, false), trial(4, false)],
  ]) {
    assert.equal(isCompletedDigitSpanRun(invalidPath, direction), false);
    assert.equal(
      digitSpanSubmissionDetails(invalidPath, direction).finished,
      false,
    );
  }
  const unfinished = completed(13).slice(0, -1);
  assert.notEqual(
    validateDigitSpanSubmission(
      13,
      mode,
      digitSpanSubmissionDetails(unfinished, direction),
    ),
    null,
  );
  assert.equal(
    validateDigitSpanSubmission(
      100,
      mode,
      digitSpanSubmissionDetails(completed(100), direction),
    ),
    null,
  );
}
assert.notEqual(
  digitSpanLeaderboardMode("forward"),
  digitSpanLeaderboardMode("backward"),
);
const worksheetSource = fs.readFileSync("lib/digit-span-worksheet.ts", "utf8");
const worksheetJs = ts.transpileModule(worksheetSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const worksheetModule = { exports: {} };
new Function("exports", "module", "require", worksheetJs)(
  worksheetModule.exports,
  worksheetModule,
  (name) => {
    assert.equal(name, "./digit-span");
    return moduleObject.exports;
  },
);
const { createDigitSpanWorksheet, worksheetRandom } = worksheetModule.exports;
const sheets = createDigitSpanWorksheet(worksheetRandom(7));
assert.equal(sheets.length, 2);
assert.deepEqual(
  sheets.map((sheet) => sheet.mode),
  ["forward", "backward"],
);
for (const sheet of sheets) {
  assert.equal(sheet.rows.length, 16);
  for (const row of sheet.rows) {
    assert(row.length >= 3 && row.length <= 10);
    assert.equal(row.sequence.length, row.length);
    assert(/^\d+$/.test(row.sequence));
    assert.equal(row.answer, expectedAnswer(row.sequence, sheet.mode));
  }
  for (let length = 3; length <= 10; length++)
    assert.deepEqual(
      sheet.rows
        .filter((row) => row.length === length)
        .map((row) => row.attempt),
      ["A", "B"],
    );
}
assert.deepEqual(
  createDigitSpanWorksheet(() => 0).map((sheet) => sheet.rows[0].sequence),
  ["000", "000"],
);
assert.deepEqual(createDigitSpanWorksheet(worksheetRandom(7)), sheets);
const longerSheets = createDigitSpanWorksheet(worksheetRandom(7), 25);
for (const sheet of longerSheets) {
  assert.equal(sheet.rows.length, 46);
  assert.equal(sheet.rows.at(-1).length, 25);
  for (const row of sheet.rows) {
    assert.equal(row.sequence.length, row.length);
    assert.equal(row.answer, expectedAnswer(row.sequence, sheet.mode));
  }
}
assert.equal(createDigitSpanWorksheet(worksheetRandom(7), 3)[0].rows.length, 2);
assert.equal(createDigitSpanWorksheet(worksheetRandom(7), 100)[0].rows.at(-1).sequence.length, 100);
for (const length of [2, 101, 3.5, NaN, Infinity]) {
  assert.throws(() => createDigitSpanWorksheet(worksheetRandom(7), length), RangeError);
}
console.log(
  "Digit span v3 progression/path validation, submissions and original worksheet checks passed",
);
