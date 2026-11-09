// PRPs/prds/stage-3-runtime.prd.md AC-19 Size budget with the runtime (size-check part)
// (phase 1 plan: AC-A7)
// check-budgets.mjs is exercised as a black box on fixture dist folders. The runtime is the JS that
// only `/` loads; critical JS is inline head scripts plus the runtime entry.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const root = process.cwd();
let fixture = '';

const put = (rel: string, content: string): void => {
  const abs = join(fixture, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
};
const blob = (bytes: number): string => randomBytes(bytes).toString('base64');

const budgets = (): { status: number | null; out: string } => {
  const result = spawnSync(
    process.execPath,
    [resolve(root, 'scripts', 'check-budgets.mjs'), '--dist', fixture],
    { cwd: root, encoding: 'utf8' },
  );
  return { status: result.status, out: `${result.stdout}${result.stderr}` };
};

const home = (head = ''): string =>
  `<!doctype html><html><head>${head}</head><body>` +
  '<script type="module" src="/_astro/r.js"></script></body></html>';
const bare = '<html><head></head><body></body></html>';

beforeEach(() => {
  fixture = mkdtempSync(join(tmpdir(), 'site-pro-runtime-budget-'));
});

afterEach(() => {
  rmSync(fixture, { recursive: true, force: true });
});

describe('runtime budget', () => {
  it('prints the runtime number next to the other metrics and passes when small', () => {
    put('index.html', home());
    put('404.html', bare);
    put('_astro/r.js', 'console.log(1);');
    const result = budgets();
    expect(result.status).toBe(0);
    expect(result.out).toMatch(/JS runtime \d+\.\d \/ 18 KB gzip/);
    expect(result.out).toMatch(/JS total \d+\.\d \/ 90 KB gzip/);
    expect(result.out).toMatch(/JS critical \d+\.\d \/ 20 KB gzip/);
  });

  it('fails when the script only the home page loads exceeds 18 KB gzip', () => {
    put('index.html', home());
    put('404.html', bare);
    put('_astro/r.js', blob(25000));
    const result = budgets();
    expect(result.status).toBe(1);
    expect(result.out).toContain('JS runtime');
    expect(result.out).toContain('exceeds 18 KB');
  });

  it('counts a chunk imported by the home entry as runtime', () => {
    put('index.html', home());
    put('404.html', bare);
    put('_astro/r.js', 'import "./chunk.js";console.log(1);');
    put('_astro/chunk.js', `var big='${blob(25000)}';`);
    const result = budgets();
    expect(result.status).toBe(1);
    expect(result.out).toContain('exceeds 18 KB');
  });

  it('does not count a script that other pages load too as runtime', () => {
    const both =
      '<html><head></head><body><script type="module" src="/_astro/r.js"></script></body></html>';
    put('index.html', both);
    put('404.html', both);
    put('_astro/r.js', blob(25000));
    const result = budgets();
    expect(result.out).not.toMatch(/FAIL JS runtime/);
    expect(result.status).toBe(0);
  });

  it('adds the home entry to the critical number, on top of the inline head scripts', () => {
    // About 10.7 KB inline head script + 10.7 KB entry: each under 20 KB (and
    // the entry under the 18 KB runtime limit), together over 20 KB.
    put('index.html', home(`<script>var big='${blob(11000)}';</script>`));
    put('404.html', bare);
    put('_astro/r.js', blob(11000));
    const result = budgets();
    expect(result.status).toBe(1);
    expect(result.out).toMatch(/FAIL JS critical/);
    expect(result.out).toContain('exceeds 20 KB');
    expect(result.out).not.toMatch(/FAIL JS runtime/);
  });
});
