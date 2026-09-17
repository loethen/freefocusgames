import { parse } from 'parse5';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

const run = promisify(execFile);
const args = Object.fromEntries(process.argv.slice(2).map(a => { const i = a.indexOf('='); return i < 0 ? [a.replace(/^--/, ''), true] : [a.slice(2, i), a.slice(i + 1)]; }));
const base = String(args.base || 'https://www.freefocusgames.com').replace(/\/$/, '');
const canonicalBase = String(args.canonicalBase || 'https://www.freefocusgames.com').replace(/\/$/, '');
const output = String(args.output || `reports/seo/audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
const mainPaths = ['', '/categories/reaction-time', '/categories/working-memory', '/games/challenge-10-seconds', '/games/sbti-test', '/games/schulte-table', '/blog/the-science-of-schulte-tables-boost-visual-attention-reading-speed', '/games/cps-test', '/games/spacebar-clicker', '/games/reaction-time', '/games/dual-n-back', '/adult-adhd-assessment'];
const career = ['/career-tests', '/career-tests/criticall-practice-test', '/career-tests/911-dispatcher-typing-test'];
function elements(node, predicate, out = []) {
  if (predicate(node)) out.push(node);
  for (const child of node.childNodes || []) elements(child, predicate, out);
  return out;
}
function attr(node, name) { return node.attrs?.find(a => a.name === name)?.value; }
function text(node) {
  if (['script', 'style'].includes(node.tagName)) return '';
  return node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
}
async function request(url, headers = []) {
  const started = performance.now();
  const { stdout } = await run('curl', ['--silent', '--show-error', '--max-time', '45', '--compressed', '--dump-header', '-', ...headers.flatMap(h => ['-H', h]), url], { maxBuffer: 30 * 1024 * 1024 });
  // Strip proxy CONNECT headers while keeping the origin response headers.
  const blocks = stdout.split(/\r?\n\r?\n/);
  let header = blocks.shift();
  while (/^HTTP\/\S+ 200 Connection established/i.test(header)) header = blocks.shift();
  const status = Number(header.match(/^HTTP\/\S+ (\d+)/)?.[1]);
  return { status, headers: header, body: blocks.join('\n\n'), elapsedMs: Math.round(performance.now() - started) };
}
const sitemap = await request(`${base}/sitemap.xml`);
const sitemapDoc = parse(sitemap.body);
const urlNodes = elements(sitemapDoc, n => n.tagName === 'url');
const sitemapEntries = urlNodes.map(n => ({
  url: text(elements(n, c => c.tagName === 'loc')[0] || {}),
  lastmod: text(elements(n, c => c.tagName === 'lastmod')[0] || {}),
  languages: Object.fromEntries(elements(n, c => c.tagName === 'xhtml:link').map(c => [attr(c, 'hreflang'), attr(c, 'href')]))
}));
const robots = await request(`${base}/robots.txt`);
let urls = [...mainPaths, ...mainPaths.map(p => `/zh${p}`), ...career].map(p => `${base}${p || '/'}`);
if (args.all) urls = [...new Set([...urls, ...sitemapEntries.map(e => `${base}${new URL(e.url).pathname}`)])];
const rows = [];
let next = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (next < urls.length) {
    const url = urls[next++];
    try {
      const response = await request(url);
      const doc = parse(response.body);
      const byTag = tag => elements(doc, n => n.tagName === tag);
      const metas = byTag('meta');
      const canonicals = byTag('link').filter(n => attr(n, 'rel') === 'canonical').map(n => attr(n, 'href'));
      const languages = Object.fromEntries(byTag('link').filter(n => attr(n, 'hreflang')).map(n => [attr(n, 'hreflang'), attr(n, 'href')]));
      const expected = `${canonicalBase}${new URL(url).pathname}`.replace(/\/$/, '');
      const robotValues = metas.filter(n => ['robots', 'googlebot'].includes(attr(n, 'name'))).map(n => attr(n, 'content'));
      const scenarios = elements(doc, n => attr(n, 'data-use-case') !== undefined).map(n => attr(n, 'data-use-case'));
      const row = { url, status: response.status, title: byTag('title').map(text), h1: byTag('h1').map(text), description: metas.filter(n => attr(n, 'name') === 'description').map(n => attr(n, 'content')), canonicals, languages, ogUrl: metas.filter(n => attr(n, 'property') === 'og:url').map(n => attr(n, 'content')), robots: robotValues, xRobotsTag: response.headers.match(/^x-robots-tag:\s*(.*)$/im)?.[1]?.trim() || null, elapsedMs: response.elapsedMs, htmlBytes: Buffer.byteLength(response.body), useCases: scenarios, issues: [] };
      if (response.status !== 200) row.issues.push(`HTTP ${response.status}`);
      if (canonicals.length !== 1 || canonicals[0].replace(/\/$/, '') !== expected) row.issues.push('canonical mismatch');
      if (robotValues.some(v => /noindex/i.test(v)) || /noindex/i.test(row.xRobotsTag || '')) row.issues.push('noindex');
      if (row.ogUrl.length !== 1 || row.ogUrl[0].replace(/\/$/, '') !== expected) row.issues.push('OG URL mismatch');
      if (row.title.length !== 1 || !row.title[0]) row.issues.push('missing/duplicate title');
      if (row.h1.length !== 1) row.issues.push(`H1 count ${row.h1.length}`);
      if (['/', '/zh'].includes(new URL(url).pathname) && (scenarios.length !== 10 || new Set(scenarios).size !== 10)) row.issues.push('duplicate/missing use cases');
      rows.push(row);
    } catch (error) { rows.push({ url, issues: [error.message.slice(0, 250)] }); }
  }
}));
const probes = [];
for (const [pathname, headers, expected] of [
  ['/categories/seo-week1-not-found', [], 404], ['/zh/categories/seo-week1-not-found', [], 404],
  ['/games/seo-week1-not-found', [], 404], ['/blog/seo-week1-not-found', [], 404],
  ['/games/cps-test', ['Accept-Language: zh', 'Cookie: NEXT_LOCALE=zh'], 200],
  ['/en/games/cps-test?utm_source=seo-week1', [], 307],
  ['/games/cps-test/?utm_source=seo-week1', [], 308],
  ['/zh/career-tests?utm_source=seo-week1', [], 301],
  ['/zh/partnerships?utm_source=seo-week1', [], 301],
  ['/de/games/cps-test?utm_source=seo-week1', [], 301]
]) {
  const r = await request(`${base}${pathname}`, headers);
  const location = r.headers.match(/^location:\s*(.*)$/im)?.[1]?.trim();
  const expectedLocation = expected === 308 ? pathname.replace('/?', '?') : pathname.replace(/^\/(en|zh|de)(?=\/)/, '');
  const target = location ? new URL(location, base) : null;
  probes.push({ pathname, expected, status: r.status, location, pass: r.status === expected && (expected < 300 || expected >= 400 || `${target?.pathname}${target?.search}` === expectedLocation) });
}
const sitemapIssues = [];
const sitemapUrls = new Set(sitemapEntries.map(e => e.url));
if (sitemap.status !== 200 || !sitemapEntries.length) sitemapIssues.push('sitemap unavailable/empty');
if (sitemapUrls.size !== sitemapEntries.length) sitemapIssues.push('duplicate sitemap URLs');
for (const entry of sitemapEntries) {
  if (new URL(entry.url).origin !== canonicalBase) sitemapIssues.push(`wrong sitemap origin: ${entry.url}`);
  for (const alternate of Object.values(entry.languages)) if (!sitemapUrls.has(alternate)) sitemapIssues.push(`alternate not in sitemap: ${alternate}`);
  for (const alternate of Object.values(entry.languages)) {
    const target = sitemapEntries.find(e => e.url === alternate);
    if (target && JSON.stringify(Object.entries(target.languages).sort()) !== JSON.stringify(Object.entries(entry.languages).sort())) sitemapIssues.push(`non-reciprocal alternates: ${entry.url}`);
  }
  const row = rows.find(r => new URL(r.url).pathname === new URL(entry.url).pathname);
  if (row && JSON.stringify(Object.entries(row.languages).sort()) !== JSON.stringify(Object.entries(entry.languages).sort())) sitemapIssues.push(`HTML/sitemap languages differ: ${entry.url}`);
}
const titleGroups = new Map();
for (const row of rows) { if (row.title?.[0]) titleGroups.set(row.title[0], [...(titleGroups.get(row.title[0]) || []), row.url]); }
const duplicateTitles = [...titleGroups].filter(([, urls]) => urls.length > 1).map(([title, urls]) => ({ title, urls }));
const report = { duplicateTitles, checkedAt: new Date().toISOString(), base, canonicalBase, scope: args.all ? 'all sitemap URLs + priority pages' : 'priority pages', robots: { status: robots.status, body: robots.body }, sitemap: { status: sitemap.status, entries: sitemapEntries, issues: sitemapIssues }, pages: rows.sort((a,b) => a.url.localeCompare(b.url)), probes };
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(report, null, 2));
const failures = rows.filter(r => r.issues.length).length + probes.filter(p => !p.pass).length + sitemapIssues.length + duplicateTitles.length + (robots.status === 200 ? 0 : 1);
console.log(JSON.stringify({ output, pages: rows.length, sitemapEntries: sitemapEntries.length, failures }));
if (args.strict && failures) process.exitCode = 1;
