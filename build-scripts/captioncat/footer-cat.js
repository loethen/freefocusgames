// The footer cat runs CaptionCat's own controller and renderer, so it moves exactly as on YouTube
// and on captioncat.app. Bundled by build-scripts/sync-captioncat.mjs into public/captioncat/.
import { createMascot } from 'captioncat/features/mascot/controller.js';
import { createAssetRenderer } from 'captioncat/features/mascot/renderer.js';
import { actions, availableActions } from 'captioncat/features/mascot/actions/index.js';
import { characters } from 'captioncat/features/mascot/characters/index.js';

// The renderer asks the extension for asset URLs; here they are served from /captioncat/.
// Chrome defines `chrome` on ordinary pages too, just without runtime.getURL, so fill in only that.
if (!globalThis.chrome?.runtime?.getURL) {
  globalThis.chrome = { ...globalThis.chrome, runtime: { ...globalThis.chrome?.runtime, getURL: path => `/captioncat/${path}` } };
}

// Visitors only glance at the footer for a few seconds, so this cat is busier than the extension's
// "lively" level: short pauses, rare and brief rests, mostly play, and tricks that come back quickly.
const FOOTER_PACE = {
  walk: 1.2, pause: [150, 500], awake: [90000, 150000], rest: [3000, 6000], sleep: 0.1,
  cooldown: 12000, mix: { patrol: 1, chore: 2, play: 4 },
};

// Starts a cat that wanders along the stage's line; returns a function that stops it.
// Follows the extension's settings preview (ui/mascot-preview.js) in random mode, plus the footer pace.
window.startCaptionCat = (stage, lineSelector) => {
  const character = characters[0];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  function info() {
    const lines = [...stage.querySelectorAll(lineSelector)];
    if (!lines.length) return null;
    const box = stage.getBoundingClientRect(), first = lines[0].getBoundingClientRect(), last = lines.at(-1).getBoundingClientRect();
    if (!first.width || !first.height) return null;
    const fs = parseFloat(getComputedStyle(lines[0]).fontSize) || 14;
    const size = fs * character.sizeEm, inset = fs * 0.9;
    return {
      fs, size, x0: first.left - box.left + inset, span: Math.max(0, first.width - 2 * inset - size),
      perchY: first.top - box.top - size + fs * 0.06, groundY: last.bottom - box.top - size + fs * 0.06,
    };
  }
  const renderer = (character.createRenderer || createAssetRenderer)({ character, assetURL: path => chrome.runtime.getURL(path), reduced: () => media.matches });
  renderer.mount(stage);
  const controller = createMascot({
    ...renderer, active: () => true, calm: () => media.matches, info, postures: () => character.postures,
    pace: () => FOOTER_PACE,
    actions: geometry => availableActions(character, actions.map(item => item.id), geometry),
  });
  controller.setMood('normal');
  let frame = requestAnimationFrame(function tick(now) {
    controller.tick(now);
    frame = requestAnimationFrame(tick);
  });
  return () => {
    cancelAnimationFrame(frame);
    controller.reset();
    renderer.dispose();
  };
};
