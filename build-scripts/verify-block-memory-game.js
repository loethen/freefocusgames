const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { test } = require('node:test');

// Execute the same pure reducer and validation used by the client and API.
const source = fs.readFileSync(path.join(__dirname, '../lib/block-memory-game.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const rules = {};
new Function('exports', compiled)(rules);
const { blockMemoryReducer: reduce, initialBlockMemoryState: initial, generateBlockMemoryPattern: generate,
    validateBlockMemorySubmission: validate, BLOCK_MEMORY_LEADERBOARD_MODE: mode } = rules;

function start(pattern = [0, 1, 2], gameMode = 'challenge') {
    return reduce(initial, { type: 'start', mode: gameMode, pattern });
}
function play(state) {
    state = reduce(state, { type: 'ready' });
    state = prepare(state);
    while (state.status === 'showing' || state.status === 'gap') {
        state = reduce(state, { type: 'display-tick' });
    }
    return state;
}
function prepare(state) {
    while (state.status === 'preparing') state = reduce(state, { type: 'prepare-tick', remaining: state.prepareSeconds });
    return state;
}
function complete(state) {
    for (const blockId of state.pattern) {
        state = reduce(state, { type: 'select', blockId });
        state = reduce(state, { type: 'feedback-end' });
    }
    return state;
}

test('challenge starts at 3; practice accepts 1 through 20', () => {
    assert.equal(start().length, 3);
    assert.equal(start([0, 1]).status, 'idle');
    for (let length = 1; length <= 20; length++) assert.equal(start(generate(length), 'practice').length, length);
    assert.equal(start(generate(21), 'practice').status, 'idle');
});
test('display includes a gap after each block and ignores premature input', () => {
    let state = start();
    assert.equal(reduce(state, { type: 'select', blockId: 0 }), state);
    state = reduce(state, { type: 'ready' });
    state = prepare(state);
    for (let index = 0; index < 3; index++) {
        assert.equal(state.status, 'showing');
        assert.equal(state.displayIndex, index);
        state = reduce(state, { type: 'display-tick' });
        assert.equal(state.status, 'gap');
        state = reduce(state, { type: 'display-tick' });
    }
    assert.equal(state.status, 'guessing');
});
test('first round has a countdown and cannot accept input or start playback early', () => {
    let state = reduce(start(), { type: 'ready' });
    assert.equal(state.status, 'preparing');
    assert.equal(state.prepareSeconds, 2);
    assert.equal(reduce(state, { type: 'select', blockId: 0 }), state);
    assert.equal(reduce(state, { type: 'display-tick' }), state);
    state = reduce(state, { type: 'prepare-tick', remaining: 2 });
    assert.equal(state.status, 'preparing');
    assert.equal(state.prepareSeconds, 1);
    assert.equal(reduce(state, { type: 'prepare-tick', remaining: 2 }), state);
    state = reduce(state, { type: 'prepare-tick', remaining: 1 });
    assert.equal(state.status, 'showing');
    assert.equal(state.displayIndex, 0);
});
test('every next round resets input and waits for a fresh countdown', () => {
    let state = complete(play(start()));
    state = reduce(state, { type: 'next-round', pattern: [2, 3, 4, 5] });
    assert.equal(state.status, 'preparing');
    assert.equal(state.prepareSeconds, 2);
    assert.equal(state.length, 4);
    assert.equal(state.completedLength, 3);
    assert.equal(state.inputIndex, 0);
    assert.equal(state.selectedBlock, null);
    assert.equal(reduce(state, { type: 'select', blockId: 2 }), state);
    state = prepare(state);
    assert.equal(state.status, 'showing');
    assert.equal(state.pattern[0], 2);
});
test('reset discards pending preparation ticks', () => {
    let state = reduce(start(), { type: 'ready' });
    state = reduce(state, { type: 'reset' });
    assert.equal(reduce(state, { type: 'prepare-tick', remaining: 2 }), initial);
});
test('duplicate clicks and repeated starts cannot skip steps', () => {
    const starting = start();
    assert.equal(reduce(starting, { type: 'start', mode: 'challenge', pattern: [2, 3, 4] }), starting);
    const feedback = reduce(play(starting), { type: 'select', blockId: 0 });
    assert.equal(reduce(feedback, { type: 'select', blockId: 0 }), feedback);
    assert.equal(feedback.inputIndex, 1);
    assert.equal(feedback.completedLength, 0);
});
test('rapid correct clicks are accepted without waiting for visual feedback', () => {
    let state = play(start());
    for (const blockId of [0, 1, 2]) state = reduce(state, { type: 'select', blockId });
    assert.equal(state.inputIndex, 3);
    assert.equal(state.completedLength, 3);
    assert.equal(state.status, 'correct');
    assert.equal(reduce(state, { type: 'select', blockId: 2 }), state);
    state = reduce(state, { type: 'feedback-end' });
    assert.equal(state.status, 'complete');
});
test('expired visual feedback cannot clear a newer click or change progress', () => {
    let state = play(start());
    state = reduce(state, { type: 'select', blockId: 0 });
    state = reduce(state, { type: 'select', blockId: 1 });
    assert.equal(reduce(state, { type: 'clear-selection', inputIndex: 1 }), state);
    state = reduce(state, { type: 'clear-selection', inputIndex: 2 });
    assert.equal(state.selectedBlock, null);
    assert.equal(state.inputIndex, 2);
    assert.equal(state.status, 'guessing');
    state = reduce(state, { type: 'select', blockId: 2 });
    assert.equal(state.completedLength, 3);
});
test('rapid input still fails on the wrong block and allows non-adjacent repeats', () => {
    let state = play(start([0, 1, 0]));
    for (const blockId of [0, 1, 0]) state = reduce(state, { type: 'select', blockId });
    assert.equal(state.completedLength, 3);
    state = play(start());
    state = reduce(state, { type: 'select', blockId: 0 });
    state = reduce(state, { type: 'select', blockId: 8 });
    assert.equal(state.status, 'failed');
    assert.equal(state.completedLength, 0);
    assert.equal(reduce(state, { type: 'select', blockId: 1 }), state);
});
test('failure ends immediately and preserves the last score and wrong/correct blocks', () => {
    let state = complete(play(start()));
    assert.equal(state.status, 'complete');
    assert.equal(state.completedLength, 3);
    state = reduce(state, { type: 'next-round', pattern: [2, 3, 4, 5] });
    state = play(state);
    state = reduce(state, { type: 'select', blockId: 2 });
    state = reduce(state, { type: 'feedback-end' });
    state = reduce(state, { type: 'select', blockId: 8 });
    assert.equal(state.status, 'failed');
    assert.equal(state.completedLength, 3);
    state = reduce(state, { type: 'feedback-end' });
    assert.equal(state.status, 'failed');
    assert.equal(state.selectedBlock, 8);
    assert.equal(state.pattern[state.inputIndex], 3);
    assert.equal(reduce(state, { type: 'clear-selection', inputIndex: state.inputIndex }), state);
    assert.equal(reduce(state, { type: 'select', blockId: 3 }), state);
});
test('first-round failure gives zero; replay and reset clear all progress', () => {
    let state = reduce(play(start()), { type: 'select', blockId: 8 });
    assert.equal(state.completedLength, 0);
    state = reduce(state, { type: 'feedback-end' });
    state = reduce(state, { type: 'start', mode: 'practice', pattern: [5] });
    assert.equal(state.mode, 'practice');
    assert.equal(state.inputIndex, 0);
    assert.equal(state.completedLength, 0);
    state = complete(play(state));
    assert.equal(state.completedLength, 1);
    state = reduce(state, { type: 'reset' });
    assert.equal(state, initial);
    assert.equal(reduce(state, { type: 'next-round', pattern: [1, 2, 3, 4] }), initial);
    assert.equal(reduce(state, { type: 'display-tick' }), initial);
});
test('new API rules reject legacy points mode, practice and wrong challenge settings', () => {
    const details = { startingLength: 3, rulesVersion: 1 };
    assert.equal(validate(10, mode, details), null);
    for (const invalidMode of ['standard', 'ranked', 'practice']) assert.ok(validate(10, invalidMode, details));
    for (const invalidScore of [0, 2, 3.5, NaN, Infinity, 50001]) assert.ok(validate(invalidScore, mode, details));
    for (const invalidDetails of [null, {}, { startingLength: 10, rulesVersion: 1 }, { startingLength: 3, rulesVersion: 0 }]) {
        assert.ok(validate(10, mode, invalidDetails));
    }
});
test('generated sequences stay within the grid and never repeat adjacent blocks', () => {
    for (const random of [() => 0, () => 0.999999, Math.random]) {
        const pattern = generate(100, random);
        assert.equal(pattern.length, 100);
        pattern.forEach((block, index) => {
            assert.ok(Number.isInteger(block) && block >= 0 && block < 9);
            if (index > 0) assert.notEqual(block, pattern[index - 1]);
        });
    }
});
