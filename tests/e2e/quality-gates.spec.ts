// PRPs/prds/stage-2-foundation.prd.md AC-8, AC-10 (phase 7 plan: AC-A2, AC-A4)
// The privacy and budget gates run against the real built dist/ (a build is a
// precondition of the e2e suite, as for every spec here).
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const root = process.cwd();

const gate = (script: string): { status: number | null; out: string } => {
  const result = spawnSync(
    process.execPath,
    [resolve(root, 'scripts', script), '--dist', resolve(root, 'dist')],
    { cwd: root, encoding: 'utf8' },
  );
  return { status: result.status, out: `${result.stdout}${result.stderr}` };
};

test('the privacy gate passes on the real build (AC-8)', () => {
  const result = gate('check-privacy.mjs');
  expect(result.out).toContain('PASS: privacy check over');
  expect(result.status).toBe(0);
});

test('the size-budget gate passes on the real build (AC-10)', () => {
  const result = gate('check-budgets.mjs');
  expect(result.out).toContain('PASS: budgets within limits');
  expect(result.status).toBe(0);
});
