// PRPs/prds/stage-2-foundation.prd.md AC-10 CSS budget (phase 4 plan: AC-A9)
// The total built CSS stays within 25 KB gzip.
import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_BYTES = 25 * 1024;

const cssFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return cssFiles(full);
    return full.endsWith('.css') ? [full] : [];
  });

test.describe('built dist/ CSS budget (AC-A9)', () => {
  test('all CSS together is at most 25 KB gzipped', () => {
    const files = cssFiles(resolve(process.cwd(), 'dist'));
    expect(files.length).toBeGreaterThan(0);
    const all = Buffer.concat(files.map((file) => readFileSync(file)));
    expect(gzipSync(all).length).toBeLessThanOrEqual(BUDGET_BYTES);
  });
});
