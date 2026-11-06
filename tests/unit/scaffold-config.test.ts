// PRPs/prds/stage-2-foundation.prd.md AC-1 / AC-11 (phase 1 plan: AC-A2, AC-A3, AC-A4)
// Repository-level contracts of the scaffold: pinned toolchain, hosting config,
// bootstrap scripts and the CI workflow shape.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (rel: string): string => readFileSync(resolve(root, rel), 'utf8');
const lines = (rel: string): string[] => read(rel).split(/\r?\n/);

describe('toolchain pins (AC-A4)', () => {
  it('pins pnpm through the packageManager field', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.packageManager).toBe('pnpm@12.16.1');
  });

  it('pins Node 24 for CI and Workers Builds', () => {
    expect(read('.node-version').trim()).toBe('24');
  });

  it('commits a lockfile so a frozen install is possible', () => {
    expect(existsSync(resolve(root, 'pnpm-lock.yaml'))).toBe(true);
  });

  it('exposes the scripts the success signal and CI rely on', () => {
    const pkg = JSON.parse(read('package.json'));
    for (const name of [
      'dev',
      'build',
      'preview',
      'check',
      'lint',
      'format',
      'format:check',
      'test',
      'test:e2e',
    ]) {
      expect(pkg.scripts[name], `script ${name}`).toBeTruthy();
    }
  });

  it('runs a frozen-lockfile install from the bash worktree bootstrap', () => {
    expect(lines('scripts/worktree-bootstrap.sh')).toContain(
      'cd "${WORKTREE_PATH}" && pnpm install --frozen-lockfile',
    );
  });

  it('runs a frozen-lockfile install from the PowerShell worktree bootstrap', () => {
    expect(lines('scripts/worktree-bootstrap.ps1')).toContainEqual(
      expect.stringMatching(/^ *pnpm install --frozen-lockfile$/),
    );
  });
});

describe('Workers Static Assets config (AC-A3)', () => {
  const config = () => JSON.parse(read('wrangler.jsonc'));

  it('names the Worker site-pro', () => {
    expect(config().name).toBe('site-pro');
  });

  it('serves ./dist and falls back to the 404 page', () => {
    expect(config().assets).toEqual({
      directory: './dist',
      not_found_handling: '404-page',
    });
  });

  it('declares no entry script, so it stays a pure static deployment', () => {
    expect('main' in config()).toBe(false);
  });
});

describe('CI workflow (AC-A2)', () => {
  const text = read('.github/workflows/ci.yml');
  const all = lines('.github/workflows/ci.yml');

  const jobBlock = (id: string): string => {
    const start = all.findIndex((l) => l === `  ${id}:`);
    expect(start, `job ${id} exists`).toBeGreaterThanOrEqual(0);
    const rest = all.slice(start + 1);
    const next = rest.findIndex((l) => /^ {2}\S/.test(l));
    return (next === -1 ? rest : rest.slice(0, next)).join('\n');
  };

  it('defines exactly the nine separately reported jobs', () => {
    const jobsStart = all.findIndex((l) => l === 'jobs:');
    const ids = all
      .slice(jobsStart + 1)
      .map((l) => /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(l)?.[1])
      .filter((id): id is string => Boolean(id));
    expect(ids).toEqual([
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
  });

  it('triggers on pull requests and on pushes to main', () => {
    expect(text).toMatch(/^on:\s*$/m);
    expect(text).toMatch(/^ {2}pull_request:/m);
    expect(text).toMatch(/^ {2}push:\s*\n\s+branches:\s*\[main\]/m);
  });

  it.each([
    ['lint', ['pnpm lint', 'pnpm format:check']],
    ['check', ['pnpm astro check']],
    ['unit', ['pnpm test']],
    ['build', ['pnpm build']],
    ['e2e', ['pnpm build', 'pnpm test:e2e']],
    ['tokens', ['pnpm check:tokens']],
    ['privacy', ['pnpm build', 'pnpm check:privacy']],
    ['budgets', ['pnpm build', 'pnpm check:budgets']],
    [
      'lighthouse',
      [
        'pnpm build',
        'pnpm exec playwright install --with-deps chromium',
        'pnpm lighthouse',
      ],
    ],
  ])(
    'job %s installs from the frozen lockfile and runs its checks',
    (id, cmds) => {
      const block = jobBlock(id);
      expect(block).toContain('pnpm install --frozen-lockfile');
      for (const cmd of cmds) {
        expect(block).toMatch(new RegExp(`run: ${cmd}\\s*$`, 'm'));
      }
    },
  );

  it('contains no Cloudflare deploy step or secret', () => {
    expect(text).not.toMatch(/wrangler|CLOUDFLARE_/i);
  });
});
