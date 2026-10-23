// Brings the CaptionCat footer cat over from the extension repository:
//   public/captioncat/cat.js, cat.css   the extension's controller and renderer, bundled
//   public/captioncat/assets/characters the character artwork, as the extension ships it
// The extension lives next to this repository by default; set CAPTIONCAT to point elsewhere.
// The output is committed, so building and deploying do not need the extension repository.
import { build } from 'esbuild';
import { cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = resolve(process.env.CAPTIONCAT || resolve(root, '../CaptionCat'));
const out = resolve(root, 'public/captioncat');

await rm(out, { recursive: true, force: true });
await cp(resolve(source, 'extension/assets/characters'), resolve(out, 'assets/characters'), { recursive: true });

await build({
  entryPoints: { cat: resolve(root, 'build-scripts/captioncat/footer-cat.js') },
  outdir: out, bundle: true, minify: true, format: 'iife', target: 'es2022',
  alias: { captioncat: resolve(source, 'src') },
  legalComments: 'none', logLevel: 'warning',
});

console.log(`Synced the CaptionCat footer cat from ${source}`);
