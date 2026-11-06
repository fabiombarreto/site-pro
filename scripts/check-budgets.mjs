#!/usr/bin/env node
// AC-10: gzip size budgets measured on what the pages actually load.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { posix, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const JS_TOTAL_KB = 90;
const JS_CRITICAL_KB = 20;
const CSS_TOTAL_KB = 25;

const gz = (text) => gzipSync(text).length;
const kb = (bytes) => bytes / 1024;

function walk(dir) {
  return readdirSync(dir, { recursive: true })
    .map((entry) => String(entry).replace(/\\/g, '/'))
    .filter((rel) => !statSync(resolve(dir, rel)).isDirectory());
}

const attr = (tag, name) =>
  new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i')
    .exec(tag)
    ?.slice(1)
    .find((v) => v !== undefined);

function parsePage(html) {
  const headEnd = html.search(/<\/head>/i);
  const page = { scripts: [], styles: [], inlineJs: [], inlineCss: [] };
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const src = attr(m[1], 'src');
    const blocking =
      !/\btype\s*=\s*["']module["']/i.test(m[1]) &&
      !/\b(async|defer)\b/i.test(m[1]);
    const critical = headEnd !== -1 && m.index < headEnd;
    if (src) page.scripts.push({ src, critical: critical && blocking });
    else if (m[2].trim()) page.inlineJs.push({ body: m[2], critical });
  }
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    if (/\brel\s*=\s*["']?stylesheet/i.test(m[0])) {
      const href = attr(m[0], 'href');
      if (href) page.styles.push(href);
    }
  }
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    if (m[1].trim()) page.inlineCss.push(m[1]);
  }
  return page;
}

export function measureBudgets(distDir) {
  const files = walk(distDir);
  const htmlFiles = files.filter((f) => f.endsWith('.html'));
  const problems = [];
  if (htmlFiles.length === 0) problems.push('no .html file found');

  const referenced = new Set();
  const jsFiles = new Set();
  const cssFiles = new Set();
  let maxInlineJs = 0;
  let maxInlineCss = 0;
  let maxCritical = 0;

  const resolveAsset = (ref, from) => {
    const path = ref.split(/[?#]/)[0];
    if (/^https?:\/\//.test(path) || path.startsWith('//')) return null;
    const rel = path.startsWith('/')
      ? path.slice(1)
      : posix.join(posix.dirname(from), path);
    const abs = resolve(distDir, rel);
    if (!existsSync(abs)) {
      problems.push(`missing-asset ${ref} (referenced by ${from})`);
      return null;
    }
    referenced.add(rel.replace(/\\/g, '/'));
    return abs;
  };

  for (const rel of htmlFiles) {
    const page = parsePage(readFileSync(resolve(distDir, rel), 'utf8'));
    let critical = page.inlineJs
      .filter((s) => s.critical)
      .reduce((sum, s) => sum + gz(s.body), 0);
    for (const s of page.scripts) {
      const abs = resolveAsset(s.src, rel);
      if (!abs) continue;
      jsFiles.add(abs);
      if (s.critical) critical += gz(readFileSync(abs));
    }
    for (const href of page.styles) {
      const abs = resolveAsset(href, rel);
      if (abs) cssFiles.add(abs);
    }
    maxCritical = Math.max(maxCritical, critical);
    maxInlineJs = Math.max(
      maxInlineJs,
      page.inlineJs.reduce((sum, s) => sum + gz(s.body), 0),
    );
    maxInlineCss = Math.max(
      maxInlineCss,
      page.inlineCss.reduce((sum, body) => sum + gz(body), 0),
    );
  }

  const sizeOf = (set) =>
    [...set].reduce((sum, abs) => sum + gz(readFileSync(abs)), 0);
  const jsTotal = kb(sizeOf(jsFiles) + maxInlineJs);
  const jsCritical = kb(maxCritical);
  const cssTotal = kb(sizeOf(cssFiles) + maxInlineCss);

  const assets = files.filter((f) => /\.(js|css)$/.test(f));
  const distWide = (ext) =>
    kb(
      assets
        .filter((f) => f.endsWith(ext))
        .reduce((sum, f) => sum + gz(readFileSync(resolve(distDir, f))), 0),
    );
  const orphans = assets.filter((f) => !referenced.has(f));

  if (jsTotal > JS_TOTAL_KB) {
    problems.push(
      `JS total ${jsTotal.toFixed(1)} KB exceeds ${JS_TOTAL_KB} KB`,
    );
  }
  if (jsCritical > JS_CRITICAL_KB) {
    problems.push(
      `JS critical ${jsCritical.toFixed(1)} KB exceeds ${JS_CRITICAL_KB} KB`,
    );
  }
  if (cssTotal > CSS_TOTAL_KB) {
    problems.push(
      `CSS total ${cssTotal.toFixed(1)} KB exceeds ${CSS_TOTAL_KB} KB`,
    );
  }

  return {
    jsTotal,
    jsCritical,
    cssTotal,
    distWideJs: distWide('.js'),
    distWideCss: distWide('.css'),
    orphans,
    problems,
  };
}

function main() {
  const flag = process.argv.indexOf('--dist');
  const distDir = resolve(flag === -1 ? 'dist' : process.argv[flag + 1]);
  const r = measureBudgets(distDir);
  console.log(`JS total ${r.jsTotal.toFixed(1)} / ${JS_TOTAL_KB} KB gzip`);
  console.log(
    `JS critical ${r.jsCritical.toFixed(1)} / ${JS_CRITICAL_KB} KB gzip`,
  );
  console.log(`CSS total ${r.cssTotal.toFixed(1)} / ${CSS_TOTAL_KB} KB gzip`);
  console.log(
    `dist-wide JS ${r.distWideJs.toFixed(1)} KB, CSS ${r.distWideCss.toFixed(1)} KB gzip (informational)`,
  );
  console.log(`orphans: ${r.orphans.length ? r.orphans.join(', ') : 'none'}`);
  if (r.problems.length > 0) {
    for (const p of r.problems) console.error(`FAIL ${p}`);
    process.exit(1);
  }
  console.log('PASS: budgets within limits');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
