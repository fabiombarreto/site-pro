#!/usr/bin/env node
// AC-9: no color or box-shadow literal in src/ outside tokens.css and assets/.
// The rules mirror tests/unit/design-tokens.test.ts so the two cannot disagree.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/;
const MIN_FILES = 6;

export function listSourceFiles(srcDir) {
  return readdirSync(srcDir, { recursive: true })
    .map((entry) => String(entry).replace(/\\/g, '/'))
    .filter((rel) => /\.(css|astro|ts|tsx)$/.test(rel))
    .filter((rel) => !statSync(resolve(srcDir, rel)).isDirectory())
    .filter((rel) => rel !== 'styles/tokens.css')
    .filter((rel) => !rel.startsWith('assets/'));
}

export function findTokenViolations(srcDir) {
  const violations = [];
  for (const rel of listSourceFiles(srcDir)) {
    const lines = readFileSync(resolve(srcDir, rel), 'utf8').split(/\r?\n/);
    lines.forEach((text, index) => {
      const line = index + 1;
      if (COLOR_LITERAL.test(text)) {
        violations.push({ file: rel, rule: 'color-literal', line });
      }
      if (text.includes('box-shadow') && !text.includes('var(--')) {
        violations.push({ file: rel, rule: 'box-shadow-literal', line });
      }
    });
  }
  return violations;
}

function main() {
  const flag = process.argv.indexOf('--src');
  const srcDir = resolve(flag === -1 ? 'src' : process.argv[flag + 1]);
  const scanned = listSourceFiles(srcDir).length;
  if (scanned < MIN_FILES) {
    console.error(
      `FAIL: only ${scanned} source files scanned in ${srcDir} (expected at least ${MIN_FILES})`,
    );
    process.exit(1);
  }
  const violations = findTokenViolations(srcDir);
  for (const v of violations) {
    console.error(`FAIL ${v.file}:${v.line} ${v.rule}`);
  }
  if (violations.length > 0) process.exit(1);
  console.log(
    `PASS: no color or box-shadow literal in ${scanned} source files`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
