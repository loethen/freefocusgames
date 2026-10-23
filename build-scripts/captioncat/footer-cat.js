// The footer cat runs CaptionCat's own controller and renderer, so it moves exactly as on YouTube
// and on captioncat.app. Bundled by build-scripts/sync-captioncat.mjs into public/captioncat/.
import { createMascotPreview } from 'captioncat/ui/mascot-preview.js';
import { characters } from 'captioncat/features/mascot/characters/index.js';

// The renderer asks the extension for asset URLs; here they are served from /captioncat/.
// Chrome defines `chrome` on ordinary pages too, just without runtime.getURL, so fill in only that.
if (!globalThis.chrome?.runtime?.getURL) {
  globalThis.chrome = { ...globalThis.chrome, runtime: { ...globalThis.chrome?.runtime, getURL: path => `/captioncat/${path}` } };
}

// Starts a cat that wanders along the stage's line; returns a function that stops it.
window.startCaptionCat = (stage, lines) => {
  const preview = createMascotPreview(stage, { lines, random: true });
  preview.update(characters[0]);
  return () => preview.dispose();
};
