#!/usr/bin/env node
// AC-10: gzip size budgets measured on what the pages actually load.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { posix, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const JS_TOTAL_KB = 90;
const JS_RUNTIME_KB = 18;
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
    const module = /\btype\s*=\s*["']module["']/i.test(m[1]);
    if (src) page.scripts.push({ src, critical: critical && blocking, module });
    else if (m[2].trim()) {
      page.inlineJs.push({ body: m[2], critical, module });
    }
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

// Specifiers of static imports, re-exports and dynamic imports in a JS file.
function importSpecifiers(text) {
  const found = [];
  const patterns = [
    /\b(?:import|export)\s*(?:[\w$*{},\s]*?\bfrom\s*)?["']([^"']+)["']/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) found.push(m[1]);
  }
  return found;
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

  // Every JS file reachable from `entry` through relative or root-absolute
  // `.js` imports, entry included.
  const reach = (entry, seen) => {
    const stack = [entry];
    while (stack.length > 0) {
      const abs = stack.pop();
      if (seen.has(abs)) continue;
      seen.add(abs);
      const from = relative(distDir, abs).replace(/\\/g, '/');
      for (const spec of importSpecifiers(readFileSync(abs, 'utf8'))) {
        if (!/^(?:\.{1,2}\/|\/(?!\/))/.test(spec)) continue;
        const path = spec.split(/[?#]/)[0];
        if (!path.endsWith('.js')) continue;
        const rel = path.startsWith('/')
          ? path.slice(1)
          : posix.join(posix.dirname(from), path);
        const next = resolve(distDir, rel);
        if (!existsSync(next)) continue;
        referenced.add(rel);
        stack.push(next);
      }
    }
  };

  const infos = [];
  for (const rel of htmlFiles) {
    const page = parsePage(readFileSync(resolve(distDir, rel), 'utf8'));
    const info = { rel, page, reached: new Set(), entries: [], critical: 0 };
    infos.push(info);
    let critical = page.inlineJs
      .filter((s) => s.critical)
      .reduce((sum, s) => sum + gz(s.body), 0);
    for (const s of page.scripts) {
      const abs = resolveAsset(s.src, rel);
      if (!abs) continue;
      reach(abs, info.reached);
      if (s.module) info.entries.push(abs);
      if (s.critical) critical += gz(readFileSync(abs));
    }
    for (const href of page.styles) {
      const abs = resolveAsset(href, rel);
      if (abs) cssFiles.add(abs);
    }
    info.critical = critical;
    maxInlineJs = Math.max(
      maxInlineJs,
      page.inlineJs.reduce((sum, s) => sum + gz(s.body), 0),
    );
    maxInlineCss = Math.max(
      maxInlineCss,
      page.inlineCss.reduce((sum, body) => sum + gz(body), 0),
    );
  }

  for (const { reached } of infos) {
    for (const abs of reached) jsFiles.add(abs);
  }

  // The runtime is what only the home page loads: its module entries, their
  // imports and its own inline module bodies.
  let runtimeBytes = 0;
  const home = infos.find((i) => i.rel === 'index.html');
  if (home) {
    const others = infos.filter((i) => i !== home);
    const otherFiles = new Set(others.flatMap((i) => [...i.reached]));
    const otherBodies = new Set(
      others.flatMap((i) => i.page.inlineJs.map((s) => s.body)),
    );
    for (const abs of home.reached) {
      if (!otherFiles.has(abs)) runtimeBytes += gz(readFileSync(abs));
    }
    for (const abs of home.entries) {
      if (!otherFiles.has(abs)) home.critical += gz(readFileSync(abs));
    }
    for (const s of home.page.inlineJs) {
      if (s.module && !otherBodies.has(s.body)) {
        runtimeBytes += gz(s.body);
        if (!s.critical) home.critical += gz(s.body);
      }
    }
  }
  for (const info of infos) maxCritical = Math.max(maxCritical, info.critical);

  const sizeOf = (set) =>
    [...set].reduce((sum, abs) => sum + gz(readFileSync(abs)), 0);
  const jsTotal = kb(sizeOf(jsFiles) + maxInlineJs);
  const jsCritical = kb(maxCritical);
  const jsRuntime = kb(runtimeBytes);
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
  if (jsRuntime > JS_RUNTIME_KB) {
    problems.push(
      `JS runtime ${jsRuntime.toFixed(1)} KB exceeds ${JS_RUNTIME_KB} KB`,
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
    jsRuntime,
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
    `JS runtime ${r.jsRuntime.toFixed(1)} / ${JS_RUNTIME_KB} KB gzip`,
  );
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

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
