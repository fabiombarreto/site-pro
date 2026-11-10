// PRPs/prds/stage-4-sections-effects.prd.md AC-14 Scheduler unchanged (phase 5 plan: AC-A1, AC-A3)
// The scheduler diff check is exercised as a black box against a throwaway git repository that holds the
// nine frozen files, so the worktree's own frozen files are never touched and the result does not depend
// on the history depth of the checkout running the suite. The exception rule is exercised on a copy of the
// script whose (empty) exception list is filled test-side.
import { spawnSync } from 'node:child_process';
import {
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
const script = resolve(root, 'scripts/check-frozen-runtime.mjs');

const FROZEN = [
  'scheduler',
  'clock',
  'triggers',
  'focus-rule',
  'resize',
  'keys',
  'controls-timing',
  'main',
  'api',
].map((name) => `src/runtime/${name}.ts`);

let repo = '';
let base = '';

const git = (...args: string[]): string => {
  const result = spawnSync(
    'git',
    [
      '-c',
      'user.email=test@example.invalid',
      '-c',
      'user.name=test',
      '-c',
      'commit.gpgsign=false',
      ...args,
    ],
    { cwd: repo, encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  }
  return result.stdout.trim();
};

const put = (rel: string, content: string): void => {
  const abs = join(repo, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
};

const check = (
  args: string[] = [],
  entry = script,
): { status: number | null; out: string; err: string } => {
  const result = spawnSync(process.execPath, [entry, ...args], {
    cwd: repo,
    encoding: 'utf8',
  });
  return {
    status: result.status,
    out: result.stdout,
    err: result.stderr,
  };
};

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'site-pro-frozen-'));
  git('init', '-q');
  for (const file of FROZEN) put(file, `export const f = '${file}';\n`);
  put('src/runtime/effects.ts', 'export const e = 1;\n');
  put('docs/decisions.md', '# Decisions\n');
  git('add', '-A');
  git('commit', '-q', '-m', 'stage 3 merge');
  base = git('rev-parse', 'HEAD');
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

describe('scheduler diff check on a throwaway repository (AC-14)', () => {
  it('passes and names the base when the nine frozen files match it', () => {
    const result = check(['--base', base]);
    expect(result.status).toBe(0);
    expect(result.out).toContain(`PASS: frozen runtime files match ${base}`);
    expect(result.err).toBe('');
  });

  it.each(FROZEN)(
    'fails naming %s when an uncommitted edit changes it',
    (file) => {
      put(file, `export const f = 'edited';\n`);
      const result = check(['--base', base]);
      expect(result.status).toBe(1);
      expect(result.err).toContain(`FAIL frozen runtime file changed: ${file}`);
      // Only the changed file is named.
      const named = FROZEN.filter((other) => result.err.includes(other));
      expect(named).toEqual([file]);
    },
  );

  it('fails when the change is committed after the base', () => {
    put('src/runtime/scheduler.ts', `export const f = 'committed';\n`);
    git('add', '-A');
    git('commit', '-q', '-m', 'change the scheduler');
    const result = check(['--base', base]);
    expect(result.status).toBe(1);
    expect(result.err).toContain('src/runtime/scheduler.ts');
  });

  it('names every changed frozen file, not just the first', () => {
    put('src/runtime/clock.ts', 'export const f = 1;\n');
    put('src/runtime/api.ts', 'export const f = 2;\n');
    const result = check(['--base', base]);
    expect(result.status).toBe(1);
    expect(result.err).toContain('src/runtime/clock.ts');
    expect(result.err).toContain('src/runtime/api.ts');
  });

  it('ignores edits to runtime files that are not frozen', () => {
    put('src/runtime/effects.ts', 'export const e = 2;\n');
    put('src/runtime/new-effect.ts', 'export const n = 1;\n');
    const result = check(['--base', base]);
    expect(result.status).toBe(0);
    expect(result.out).toContain('PASS');
  });

  it('fails loudly, naming the base and the history fix, when the base is unknown', () => {
    const result = check(['--base', 'deadbeefdeadbeef']);
    expect(result.status).toBe(1);
    expect(result.out).not.toContain('PASS');
    expect(result.err).toContain('deadbeefdeadbeef');
    expect(result.err).toContain('fetch-depth: 0');
  });

  it('defaults to the Stage 3 merge b4271cb, failing loudly where that commit is absent', () => {
    const result = check();
    expect(result.status).toBe(1);
    expect(result.out).not.toContain('PASS');
    expect(result.err).toContain('b4271cb');
  });
});

describe('recorded bug-fix exceptions (AC-14)', () => {
  const DECISION = 'Bug fix: scheduler tick after a background tab';

  // A copy of the script whose exception list names the scheduler. The declaration is asserted so
  // that a change of the list's shape fails here instead of silently skipping the exception tests.
  const withException = (): string => {
    const source = readFileSync(script, 'utf8');
    const declaration = /const BUG_FIX_EXCEPTIONS = \[[\s\S]*?\];/;
    expect(source, 'the exception list is declared').toMatch(declaration);
    const patched = source.replace(
      declaration,
      `const BUG_FIX_EXCEPTIONS = [{ file: 'src/runtime/scheduler.ts', decision: ${JSON.stringify(DECISION)} }];`,
    );
    const copy = join(repo, 'check-frozen-copy.mjs');
    writeFileSync(copy, patched);
    return copy;
  };

  it('does not exempt a changed file whose decision text is absent from docs/decisions.md', () => {
    const copy = withException();
    put('src/runtime/scheduler.ts', `export const f = 'fixed';\n`);
    const result = check(['--base', base], copy);
    expect(result.status).toBe(1);
    expect(result.err).toContain('src/runtime/scheduler.ts');
  });

  it('exempts the file once docs/decisions.md records the decision text', () => {
    const copy = withException();
    put('src/runtime/scheduler.ts', `export const f = 'fixed';\n`);
    put('docs/decisions.md', `# Decisions\n\n## ${DECISION}\n`);
    const result = check(['--base', base], copy);
    expect(result.status).toBe(0);
    expect(result.out).toContain('PASS');
  });

  it('exempts only the recorded file, still failing on another frozen file', () => {
    const copy = withException();
    put('src/runtime/scheduler.ts', `export const f = 'fixed';\n`);
    put('src/runtime/clock.ts', 'export const f = 3;\n');
    put('docs/decisions.md', `# Decisions\n\n## ${DECISION}\n`);
    const result = check(['--base', base], copy);
    expect(result.status).toBe(1);
    expect(result.err).toContain('src/runtime/clock.ts');
    expect(result.err).not.toContain('src/runtime/scheduler.ts');
  });
});

describe('the script is the shipped gate command', () => {
  it('is exposed as the check:frozen package script', () => {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
    expect(pkg.scripts['check:frozen']).toBe(
      'node scripts/check-frozen-runtime.mjs',
    );
  });

  it('compares exactly the nine frozen runtime files', () => {
    const source = readFileSync(script, 'utf8');
    for (const file of FROZEN) expect(source).toContain(`'${file}'`);
    expect(source.match(/'src\/runtime\/[a-z-]+\.ts'/g)).toHaveLength(9);
  });
});
