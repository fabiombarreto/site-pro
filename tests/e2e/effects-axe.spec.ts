// PRPs/prds/stage-3-runtime.prd.md AC-18 zero axe violations at fixed moments mid-hero and mid-projects, in both themes
// (phase 3 plan: AC-A4)
// The build is frozen at the moment (a hidden tab pauses it, PRD AC-16) so axe sees the real mid-build DOM
// while Playwright's timers run for the tool.
import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/home';
import { DESKTOP_VIEWPORT, runUntil } from './support/runtime';
import { startPaused } from './support/layer';
import {
  advanceTo,
  freezeBuild,
  scrollSectionIntoBuild,
  timelinesOnPage,
} from './support/effects';

test.use({ viewport: DESKTOP_VIEWPORT });

for (const theme of ['midnight', 'daylight'] as const) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => {
        if (value === 'daylight') localStorage.setItem('sp-theme', value);
      }, theme);
    });

    test('has no axe violations mid-hero, while the role decodes and the photo is a skeleton', async ({
      page,
    }) => {
      test.setTimeout(120_000);
      const duration = await startPaused(page);
      await advanceTo(page, 'top', duration, 1700);
      await expect(page.locator('.sp-skel-block').first()).toBeAttached();
      await freezeBuild(page);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expectNoAxeViolations(page);
    });

    test('has no axe violations mid-projects, while two cards overlap', async ({
      page,
    }) => {
      test.setTimeout(240_000);
      const duration = await startPaused(page);
      const tls = await timelinesOnPage(page);
      expect(duration).toBeGreaterThan(0);
      await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
      await scrollSectionIntoBuild(page, 'projects');
      const cards = (tls.projects?.steps ?? []).filter((s) =>
        s.call.startsWith('projects.card('),
      );
      const [first, second] = cards;
      const overlap = ((second?.start ?? 0) + (first?.end ?? 0)) / 2;
      await advanceTo(page, 'projects', tls.projects?.duration ?? 0, overlap);
      await freezeBuild(page);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expectNoAxeViolations(page);
    });
  });
}
