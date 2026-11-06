#!/usr/bin/env node
// AC-8: privacy rules over the built output. Rules match link and markup
// shapes only, never bare tokens, so vendored bundle text cannot trip them.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SCANNED = /\.(html|js|mjs|css|json|xml)$/;
const EMAIL =
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;
const LINK_HTML = /\bhref\s*=\s*["']?\s*(?:mailto|tel):/i;
const LINK_DATA = /["'`]\s*(?:mailto|tel):[^"'`\s]/i;
const FORM = /<form\b/i;
const PHONE =
  /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s.-]\d{3,5}[\s.-]\d{4}\b/;
const ANCHOR_HREF = /<a\b[^>]*?\bhref\s*=\s*["'](https?:\/\/[^"']*)["']/gi;
const ALLOWED_LINK =
  /^https:\/\/(github\.com\/fabiombarreto(\/|$)|www\.linkedin\.com\/in\/fabio-martins-barreto$)/;
const LOCATION = 'Brazil (UTC-3)';

function walk(dir) {
  return readdirSync(dir, { recursive: true })
    .map((entry) => String(entry).replace(/\\/g, '/'))
    .filter((rel) => !statSync(resolve(dir, rel)).isDirectory());
}

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');
}

export function findPrivacyViolations(distDir) {
  const violations = [];
  const add = (file, rule, match) => violations.push({ file, rule, match });
  const files = walk(distDir);
  if (!files.some((rel) => rel.endsWith('.html'))) {
    add('.', 'no-html', 'no .html file found');
  }
  if (!files.includes('index.html')) {
    add('index.html', 'no-index', 'index.html is missing');
  }
  for (const rel of files.filter((f) => SCANNED.test(f))) {
    const text = readFileSync(resolve(distDir, rel), 'utf8');
    const isHtml = rel.endsWith('.html');
    const isData = /\.(json|xml)$/.test(rel);
    const hit = (re, source = text) => re.exec(source)?.[0];

    const email = hit(EMAIL);
    if (email) add(rel, 'email', email);

    const link = hit(isHtml ? LINK_HTML : LINK_DATA);
    if (link) add(rel, 'mailto-or-tel-link', link);

    if (isHtml) {
      const form = hit(FORM);
      if (form) add(rel, 'form', form);
      const phone = hit(PHONE, visibleText(text));
      if (phone) add(rel, 'phone', phone);
      for (const m of text.matchAll(ANCHOR_HREF)) {
        if (!ALLOWED_LINK.test(m[1])) add(rel, 'external-link', m[1]);
      }
    } else if (isData) {
      const phone = hit(PHONE);
      if (phone) add(rel, 'phone', phone);
    }
  }
  if (files.includes('index.html')) {
    const index = readFileSync(resolve(distDir, 'index.html'), 'utf8');
    if (!index.includes(LOCATION)) {
      add('index.html', 'location', `missing text "${LOCATION}"`);
    }
  }
  return violations;
}

function main() {
  const flag = process.argv.indexOf('--dist');
  const distDir = resolve(flag === -1 ? 'dist' : process.argv[flag + 1]);
  const violations = findPrivacyViolations(distDir);
  for (const v of violations) {
    console.error(`FAIL ${v.file} ${v.rule} ${v.match}`);
  }
  if (violations.length > 0) process.exit(1);
  const scanned = walk(distDir).filter((f) => SCANNED.test(f)).length;
  console.log(`PASS: privacy check over ${scanned} files`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
