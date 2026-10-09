import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Load the pure TS rules without introducing a test runtime dependency.
const source = readFileSync(new URL('../lib/rotating-schulte-rules.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const rules = {};
new Function('exports', js)(rules);
const { validateRotatingSchulteScore: validate, isRotatingSchulteSessionTimingValid: timing } = rules;
const details = {
  sessionId: 'a'.repeat(32), rawTimeMs: 42_000, mistakes: 2,
  clickTimes: JSON.stringify(Array.from({ length: 42 }, (_, i) => (i + 1) * 1000)),
};
assert.equal(validate(46_000, 'ranked', details), null);
const fastDetails = {
  ...details, rawTimeMs: 3181, mistakes: 0,
  clickTimes: JSON.stringify(Array.from({ length: 42 }, (_, i) => Math.round((i + 1) * 3181 / 42))),
};
assert.equal(validate(3181, 'ranked', fastDetails), null); // speed alone is not grounds for rejection
assert.ok(validate(0, 'ranked', { ...fastDetails, rawTimeMs: 0 }));
assert.ok(validate(3181, 'ranked', { ...fastDetails, rawTimeMs: 0 }));
assert.ok(validate(3181, 'ranked', details));
assert.ok(validate(46_000, 'ranked', null));
assert.ok(validate(46_000, 'standard', details));
assert.ok(validate(42_000, 'ranked', details)); // penalty mismatch
assert.ok(validate(46_000.5, 'ranked', details));
assert.ok(validate(46_000, 'ranked', { ...details, sessionId: 'forged' }));
assert.ok(validate(46_000, 'ranked', { ...details, mistakes: -1 }));
assert.ok(validate(46_000, 'ranked', { ...details, clickTimes: '[]' }));
assert.ok(validate(46_000, 'ranked', { ...details, clickTimes: '{' }));
assert.ok(validate(46_000, 'ranked', { ...details, clickTimes: JSON.stringify(Array(42).fill(1000)) }));
const burst = Array.from({ length: 42 }, (_, i) => 40_000 + i * 10);
burst[41] = 42_000;
assert.equal(validate(46_000, 'ranked', { ...details, clickTimes: JSON.stringify(burst) }), null);
assert.ok(validate(46_000, 'ranked', { ...details, clickTimes: JSON.stringify(Array.from({ length: 42 }, (_, i) => (i + 1) * 100)) }));
assert.equal(timing(100_000, 143_000, 42_000), true);
assert.equal(timing(100_000, 103_500, 3181), true);
assert.equal(timing(100_000, 103_500, 0), false);
assert.equal(timing(100_000, 103_000, 42_000), false); // fabricated duration
assert.equal(timing(100_000, 160_000, 42_000), false); // inconsistent clock
assert.equal(timing(100_000, 350_000, 240_000), false); // expired
assert.equal(timing(100_000, 99_000, 42_000), false);
assert.equal(timing(NaN, 143_000, 42_000), false);
console.log('Rotating Schulte score and server timing checks passed.');
