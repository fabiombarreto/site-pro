// PRPs/prds/stage-2-foundation.prd.md AC-8, AC-9, AC-10, AC-11
// (phase 7 plan: AC-A2, AC-A3, AC-A4, AC-A5, AC-A6)
// The three gate scripts are exercised as black boxes: each is spawned with
// --src/--dist pointing at a temp fixture directory and judged on its exit
// code and printed output. Lighthouse itself is never run here.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const root = process.cwd();

type Run = { status: number | null; out: string };

const run = (script: string, flag: string, dir: string): Run => {
  const result = spawnSync(
    process.execPath,
    [resolve(root, 'scripts', script), flag, dir],
    { cwd: root, encoding: 'utf8' },
  );
  return { status: result.status, out: `${result.stdout}${result.stderr}` };
};

let fixture = '';

const put = (rel: string, content: string): void => {
  const abs = join(fixture, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
};

beforeEach(() => {
  fixture = mkdtempSync(join(tmpdir(), 'site-pro-gate-'));
});

afterEach(() => {
  rmSync(fixture, { recursive: true, force: true });
});

describe('token gate on fixtures (AC-9)', () => {
  const seedClean = (): void => {
    for (let i = 1; i <= 6; i += 1) {
      put(`pages/ok${i}.css`, `.a${i} { color: var(--fg); }\n`);
    }
    put('styles/tokens.css', ':root { --x: #2563eb; }\n');
    put('assets/inline.ts', 'export const c = "#ff0000";\n');
  };
  const tokens = (): Run => run('check-tokens.mjs', '--src', fixture);

  it('passes when literals only live in tokens.css and assets/', () => {
    seedClean();
    const result = tokens();
    expect(result.status).toBe(0);
    expect(result.out).toContain('PASS');
  });

  it.each([
    ['a hex literal', '.b { color: #fff; }\n', 'color-literal'],
    [
      'an rgba literal',
      '.b { background: rgba(0, 0, 0, 0.5); }\n',
      'color-literal',
    ],
    ['an hsl literal', '.b { color: hsl(10 20% 30%); }\n', 'color-literal'],
    [
      'a box-shadow without a token',
      '.b { box-shadow: 0 0 4px black; }\n',
      'box-shadow-literal',
    ],
  ])('fails on %s in a source file', (_label, css, rule) => {
    seedClean();
    put('pages/bad.css', css);
    const result = tokens();
    expect(result.status).toBe(1);
    expect(result.out).toContain(`FAIL pages/bad.css:1 ${rule}`);
  });

  it('accepts a box-shadow that uses a token', () => {
    seedClean();
    put('pages/shadow.css', '.b { box-shadow: var(--shadow-1); }\n');
    expect(tokens().status).toBe(0);
  });

  it('fails a scan that finds too few files instead of passing vacuously', () => {
    put('pages/only.css', '.a { color: var(--fg); }\n');
    const result = tokens();
    expect(result.status).toBe(1);
    expect(result.out).toContain('only 1 source files scanned');
  });

  it('passes on the real src/ tree', () => {
    const result = run('check-tokens.mjs', '--src', resolve(root, 'src'));
    expect(result.out).toContain('PASS');
    expect(result.status).toBe(0);
  });
});

describe('privacy gate on fixtures (AC-8)', () => {
  const GOOD =
    '<!doctype html><html lang="en"><body><main><p>Brazil (UTC-3)</p>' +
    '<a href="https://github.com/fabiombarreto">GitHub</a> ' +
    '<a href="https://www.linkedin.com/in/fabio-martins-barreto">LinkedIn</a>' +
    '</main></body></html>';
  const page = (body: string): string =>
    `<html><body><p>Brazil (UTC-3)</p>${body}</body></html>`;
  const privacy = (): Run => run('check-privacy.mjs', '--dist', fixture);

  it('passes a clean page and a JS bundle containing the key tel:!0', () => {
    put('index.html', GOOD);
    put('_astro/a.js', 'var o={tel:!0,type:"tel"};\n');
    const result = privacy();
    expect(result.status).toBe(0);
    expect(result.out).toContain('PASS: privacy check over 2 files');
  });

  it.each([
    [
      'a mailto link',
      page('<a href="mailto:user@example.com">x</a>'),
      'mailto-or-tel-link',
    ],
    [
      'a tel link',
      page('<a href="tel:+14155550132">x</a>'),
      'mailto-or-tel-link',
    ],
    ['a bare email', page('<p>write to user@example.com</p>'), 'email'],
    ['a phone number in text', page('<p>call +1 415 555 0132</p>'), 'phone'],
    ['a form', page('<form action="/x"></form>'), 'form'],
    [
      'a foreign external link',
      page('<a href="https://example.org/x">x</a>'),
      'external-link',
    ],
  ])('fails on %s in HTML', (_label, html, rule) => {
    put('index.html', html);
    const result = privacy();
    expect(result.status).toBe(1);
    expect(result.out).toContain(`index.html ${rule}`);
  });

  it('fails on a tel link written into a JS file', () => {
    put('index.html', GOOD);
    put('_astro/b.js', 'window.open("tel:+14155550132");\n');
    const result = privacy();
    expect(result.status).toBe(1);
    expect(result.out).toContain('_astro/b.js mailto-or-tel-link');
  });

  it('fails when index.html lacks the location text', () => {
    put('index.html', '<html><body><p>Somewhere else</p></body></html>');
    const result = privacy();
    expect(result.status).toBe(1);
    expect(result.out).toContain('index.html location');
  });

  it('fails when there is no HTML at all (a missing build cannot pass)', () => {
    put('_astro/a.js', 'var a=1;\n');
    const result = privacy();
    expect(result.status).toBe(1);
    expect(result.out).toContain('no-html');
  });
});

describe('size-budget gate on fixtures (AC-10)', () => {
  const blob = (bytes: number): string => randomBytes(bytes).toString('base64');
  const small = (): void => {
    put(
      'index.html',
      '<!doctype html><html lang="en"><head><script>var a=1;</script>' +
        '<link rel="stylesheet" href="/_astro/a.css"></head><body>' +
        '<script type="module" src="/_astro/a.js"></script></body></html>',
    );
    put('_astro/a.css', 'body{color:red}');
    put('_astro/a.js', 'console.log(1);');
  };
  const budgets = (): Run => run('check-budgets.mjs', '--dist', fixture);

  it('passes within budget and prints every metric', () => {
    small();
    const result = budgets();
    expect(result.status).toBe(0);
    expect(result.out).toMatch(/JS total \d+\.\d \/ 90 KB gzip/);
    expect(result.out).toMatch(/JS critical \d+\.\d \/ 20 KB gzip/);
    expect(result.out).toMatch(/CSS total \d+\.\d \/ 25 KB gzip/);
    expect(result.out).toContain('dist-wide JS');
    expect(result.out).toContain('orphans: none');
  });

  it('fails when the inline head script exceeds the critical JS budget', () => {
    put(
      'index.html',
      `<html><head><script>var big='${blob(30000)}';</script></head><body></body></html>`,
    );
    const result = budgets();
    expect(result.status).toBe(1);
    expect(result.out).toContain('JS critical');
    expect(result.out).toContain('exceeds 20 KB');
  });

  it('fails when the loaded JS exceeds the total budget', () => {
    small();
    put('_astro/a.js', blob(110000));
    const result = budgets();
    expect(result.status).toBe(1);
    expect(result.out).toContain('exceeds 90 KB');
  });

  it('fails when the loaded CSS exceeds the budget', () => {
    small();
    put('_astro/a.css', blob(30000));
    const result = budgets();
    expect(result.status).toBe(1);
    expect(result.out).toContain('CSS total');
    expect(result.out).toContain('exceeds 25 KB');
  });

  it('reports an oversize orphan file without failing the gate', () => {
    small();
    put('_astro/orphan.js', blob(110000));
    const result = budgets();
    expect(result.status).toBe(0);
    expect(result.out).toContain('orphans: _astro/orphan.js');
  });

  it('fails when a page references an asset that does not exist', () => {
    put(
      'index.html',
      '<html><head><link rel="stylesheet" href="/_astro/missing.css"></head><body></body></html>',
    );
    const result = budgets();
    expect(result.status).toBe(1);
    expect(result.out).toContain('missing-asset /_astro/missing.css');
  });

  it('fails when there is no HTML to measure', () => {
    put('_astro/a.js', 'var a=1;');
    const result = budgets();
    expect(result.status).toBe(1);
    expect(result.out).toContain('no .html file found');
  });
});

describe('Lighthouse CI configuration (AC-10)', () => {
  const ci = JSON.parse(
    readFileSync(resolve(root, 'lighthouserc.json'), 'utf8'),
  ).ci;

  it('audits the built dist for / and /projects/relay/ with three runs', () => {
    expect(ci.collect.staticDistDir).toBe('./dist');
    expect(ci.collect.numberOfRuns).toBe(3);
    expect(ci.collect.url).toEqual([
      'http://localhost/',
      'http://localhost/projects/relay/',
    ]);
  });

  it.each(['performance', 'accessibility', 'best-practices', 'seo'])(
    'requires a median %s score of at least 0.95 as an error',
    (category) => {
      expect(ci.assert.assertions[`categories:${category}`]).toEqual([
        'error',
        { minScore: 0.95, aggregationMethod: 'median' },
      ]);
    },
  );

  it('requires a median CLS of at most 0.01 as an error', () => {
    expect(ci.assert.assertions['cumulative-layout-shift']).toEqual([
      'error',
      { maxNumericValue: 0.01, aggregationMethod: 'median' },
    ]);
  });

  // PRPs/prds/stage-4-sections-effects.prd.md AC-12 (phase 5 plan: AC-A2)
  it('requires a median LCP of at most 2500 ms as an error', () => {
    expect(ci.assert.assertions['largest-contentful-paint']).toEqual([
      'error',
      { maxNumericValue: 2500, aggregationMethod: 'median' },
    ]);
  });

  it('keeps results on the filesystem, never uploaded', () => {
    expect(ci.upload.target).toBe('filesystem');
  });
});

describe('CI shape for the quality gates (AC-11)', () => {
  const text = readFileSync(
    resolve(root, '.github/workflows/ci.yml'),
    'utf8',
  ).replace(/\r\n/g, '\n');

  it('holds no job dependencies, secrets or Cloudflare CLI', () => {
    expect(text).not.toMatch(/^\s+needs:/m);
    expect(text).not.toMatch(/secrets\./i);
    expect(text).not.toMatch(/wrangler|CLOUDFLARE_/i);
  });

  it('gives the lighthouse job a Chrome path and a failure artifact', () => {
    const block = text.slice(text.indexOf('\n  lighthouse:'));
    expect(block).toContain('CHROME_PATH:');
    expect(block).toMatch(/name: lighthouse-report/);
  });

  it('exposes the gate commands CI calls as package scripts', () => {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
    expect(pkg.scripts['check:tokens']).toBe('node scripts/check-tokens.mjs');
    expect(pkg.scripts['check:privacy']).toBe('node scripts/check-privacy.mjs');
    expect(pkg.scripts['check:budgets']).toBe('node scripts/check-budgets.mjs');
    expect(pkg.scripts.lighthouse).toBe('lhci autorun');
  });

  // PRPs/prds/stage-4-sections-effects.prd.md AC-14 (phase 5 plan: AC-A3)
  it('runs the scheduler diff check in the check job with full history and keeps nine jobs', () => {
    const jobs = text.slice(text.indexOf('\njobs:'));
    const names = [...jobs.matchAll(/^ {2}([a-z0-9_-]+):\s*$/gm)].map(
      (m) => m[1],
    );
    expect(names).toEqual([
      'lint',
      'check',
      'unit',
      'build',
      'e2e',
      'tokens',
      'privacy',
      'budgets',
      'lighthouse',
    ]);
    const start = text.indexOf('\n  check:');
    const block = text.slice(start + 1, text.indexOf('\n  unit:'));
    expect(block).toContain('fetch-depth: 0');
    expect(block).toContain('- run: pnpm check:frozen');
  });

  it('fails the e2e command when no spec runs', () => {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
    expect(pkg.scripts['test:e2e']).toBe('playwright test');
  });

  it('ships the three gate scripts', () => {
    for (const name of ['tokens', 'privacy', 'budgets']) {
      expect(existsSync(resolve(root, `scripts/check-${name}.mjs`))).toBe(true);
    }
  });
});
