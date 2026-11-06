// Checks Japanese translations for the pages listed in i18n/ja-pages.json.
// Run after `npm run generate-i18n` (it reads messages/*/compiled.json).
//
//   node build-scripts/check-i18n.mjs                 check; exit 1 on any error
//   node build-scripts/check-i18n.mjs --report        also print coverage per namespace
//   node build-scripts/check-i18n.mjs --drafts        also check pages in `drafts` (translated, not live)
//   node build-scripts/check-i18n.mjs --verbose       print every problem instead of the first 60
//   node build-scripts/check-i18n.mjs --stamp games.reactionTime common
//       record the current English text of every translated key under these
//       prefixes as the source of its Japanese translation (run after translating
//       or after updating a translation to a changed English text)
//
// For every message key the listed pages render it requires that the Japanese
// value exists, keeps the same {placeholders}, is not left in English, and was
// translated from the current English text (English edits mark it stale).
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const HASH_FILE = 'i18n/ja-source-hashes.json';

const registry = read('i18n/ja-pages.json');
const en = read('messages/en/compiled.json');
const ja = read('messages/ja/compiled.json');
const hashes = fs.existsSync(path.join(root, HASH_FILE)) ? read(HASH_FILE) : {};
const allowIdentical = new Set(registry.allowIdentical || []);

function flatten(value, prefix, out = {}) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, out);
  } else if (Array.isArray(value)) {
    value.forEach((child, index) => flatten(child, `${prefix}.${index}`, out));
  } else {
    out[prefix] = value;
  }
  return out;
}

function lookup(messages, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), messages);
}

const enFlat = flatten(en, '');
const jaFlat = flatten(ja, '');
const hashOf = value => createHash('sha1').update(String(value)).digest('hex').slice(0, 12);
const keysUnder = prefix => Object.keys(enFlat).filter(key => key === prefix || key.startsWith(`${prefix}.`));

// ICU argument names, e.g. {count} or {count, plural, ...}; inner plural text is ignored.
function placeholders(value) {
  const names = new Set();
  let depth = 0;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '{') {
      if (depth === 0) {
        const match = /^\{\s*([A-Za-z0-9_]+)/.exec(text.slice(i));
        if (match) names.add(match[1]);
      }
      depth += 1;
    } else if (text[i] === '}') {
      depth = Math.max(0, depth - 1);
    }
  }
  return [...names].sort().join(',');
}

// Rich-text tags such as <link>…</link> must survive translation too.
const tags = value => [...String(value).matchAll(/<\/?([A-Za-z0-9_]+)>/g)].map(m => m[0]).sort().join(',');

// A value is "English" when it carries a run of real words; acronyms, numbers and
// units (CPS, F1, ms, 10s) are fine to keep.
const looksEnglish = value => /[A-Za-z]{3,}(?:[\s,'’-]+[A-Za-z]{2,}){2,}/.test(String(value).replace(/\{[^}]*\}|<[^>]+>/g, ' '));

const args = process.argv.slice(2);

if (args[0] === '--stamp') {
  const prefixes = args.slice(1);
  if (!prefixes.length) throw new Error('Usage: --stamp <prefix> [prefix...]');
  let stamped = 0;
  for (const prefix of prefixes) {
    const keys = keysUnder(prefix);
    if (!keys.length) throw new Error(`No English messages under "${prefix}"`);
    for (const key of keys) {
      if (jaFlat[key] === undefined) continue;
      hashes[key] = hashOf(enFlat[key]);
      stamped += 1;
    }
  }
  const sorted = Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(path.join(root, HASH_FILE), `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`Stamped ${stamped} Japanese keys in ${HASH_FILE}`);
  process.exit(0);
}

const errors = [];
const pages = Object.entries({ ...(registry.pages || {}), ...(args.includes('--drafts') ? registry.drafts || {} : {}) });
for (const page of Object.keys(registry.pages || {})) {
  if (registry.drafts && page in registry.drafts) errors.push(`ja-pages: "${page}" is in both pages and drafts`);
}

for (const [page, prefixes] of pages) {
  if (page !== page.replace(/^\/+|\/+$/g, '')) errors.push(`ja-pages: "${page}" must have no leading or trailing slash`);
  if (!Array.isArray(prefixes) || !prefixes.length) errors.push(`ja-pages: "${page}" lists no message prefixes`);
}

// Site chrome only has to be translated once a Japanese page is live.
const required = new Set(pages.length ? [...(registry.shared || []), ...pages.flatMap(([, prefixes]) => prefixes || [])] : []);

let checked = 0;
for (const prefix of required) {
  if (lookup(en, prefix) === undefined) {
    errors.push(`${prefix}: no English messages under this prefix`);
    continue;
  }
  for (const key of keysUnder(prefix)) {
    checked += 1;
    const source = enFlat[key];
    const value = jaFlat[key];
    if (value === undefined || value === '') { errors.push(`${key}: missing`); continue; }
    if (placeholders(source) !== placeholders(value)) errors.push(`${key}: placeholders differ (en {${placeholders(source)}} / ja {${placeholders(value)}})`);
    if (tags(source) !== tags(value)) errors.push(`${key}: rich-text tags differ`);
    if (!allowIdentical.has(key) && typeof value === 'string' && (value === source ? /[a-z]{3,}/.test(value.replace(/\{[^}]*\}|<[^>]+>/g, ' ')) : looksEnglish(value))) {
      errors.push(`${key}: still English: ${JSON.stringify(value).slice(0, 80)}`);
    }
    if (!hashes[key]) errors.push(`${key}: not stamped (run --stamp after translating)`);
    else if (hashes[key] !== hashOf(source)) errors.push(`${key}: stale, English changed since translation: ${JSON.stringify(source).slice(0, 80)}`);
  }
}

if (args.includes('--report')) {
  for (const namespace of Object.keys(en).sort()) {
    const keys = keysUnder(namespace);
    const done = keys.filter(key => jaFlat[key] !== undefined).length;
    console.log(`${namespace.padEnd(24)} ${String(done).padStart(5)} / ${keys.length}`);
  }
}

if (errors.length) {
  const shown = args.includes('--verbose') ? errors : errors.slice(0, 60);
  console.error(`Japanese i18n check failed: ${errors.length} problem(s)\n${shown.map(e => `  - ${e}`).join('\n')}${errors.length > shown.length ? `\n  … ${errors.length - shown.length} more` : ''}`);
  // exitCode instead of exit(): a long report written to a pipe must flush first.
  process.exitCode = 1;
} else {
  console.log(`Japanese i18n check passed: ${pages.length} page(s), ${checked} key(s) checked`);
}
