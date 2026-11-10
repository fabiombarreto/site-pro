#!/usr/bin/env node
// Stage 4 AC-14: the scheduler and controls files in src/runtime/ stay frozen
// at the Stage 3 merge, except bug fixes recorded in docs/decisions.md.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_BASE = 'b4271cb';

const FROZEN = [
  'src/runtime/scheduler.ts',
  'src/runtime/clock.ts',
  'src/runtime/triggers.ts',
  'src/runtime/focus-rule.ts',
  'src/runtime/resize.ts',
  'src/runtime/keys.ts',
  'src/runtime/controls-timing.ts',
  'src/runtime/main.ts',
  'src/runtime/api.ts',
];

// Recorded bug fixes: `{ file, decision }`, where `decision` is the heading
// text of the docs/decisions.md entry that records the fix. A file is exempt
// only while that text appears in docs/decisions.md.
const BUG_FIX_EXCEPTIONS = [];

function readDecisions(cwd) {
  const path = resolve(cwd, 'docs/decisions.md');
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

// Compares the working tree (uncommitted edits count) against `base` and
// returns the violations: changed frozen files, or a single loud violation
// when git cannot answer (unknown base, shallow clone).
export function findFrozenViolations({
  base = DEFAULT_BASE,
  cwd = process.cwd(),
} = {}) {
  const run = spawnSync('git', ['diff', '--name-only', base, '--', ...FROZEN], {
    cwd,
    encoding: 'utf8',
  });
  if (run.error || run.status !== 0) {
    const detail = (run.error?.message ?? run.stderr ?? '').trim();
    return [
      `cannot diff against base ${base}: ${detail}. ` +
        'The base must be reachable; in CI use actions/checkout with fetch-depth: 0.',
    ];
  }
  const decisions = readDecisions(cwd);
  const exempt = new Set(
    BUG_FIX_EXCEPTIONS.filter(({ decision }) =>
      decisions.includes(decision),
    ).map(({ file }) => file),
  );
  return run.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((file) => file !== '' && !exempt.has(file));
}

function main() {
  const flag = process.argv.indexOf('--base');
  const base = flag === -1 ? DEFAULT_BASE : process.argv[flag + 1];
  const violations = findFrozenViolations({ base });
  if (violations.length > 0) {
    for (const v of violations) {
      console.error(
        FROZEN.includes(v)
          ? `FAIL frozen runtime file changed: ${v}`
          : `FAIL frozen runtime check: ${v}`,
      );
    }
    process.exit(1);
  }
  console.log(`PASS: frozen runtime files match ${base}`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
