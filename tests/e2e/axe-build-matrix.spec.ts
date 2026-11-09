// PRPs/prds/stage-3-runtime.prd.md AC-18 zero axe violations (WCAG 2.0, 2.1 and 2.2 A and AA) with the clock paused
// during the boot, mid-hero, mid-projects and after the build, in Midnight and Daylight, at 1280x800 and 375x812:
// the 16 cells of the matrix. At each moment the text and the accessibility tree of <main> also equal the no-JS page.
// (phase 5 plan: Notes, the axe-build-matrix spec named in docs/context/testing.md)
// Each cell is its own page: a moment is reached on a fresh paused clock, then the build is frozen (a hidden tab
// pauses it, PRD AC-16) so axe sees the real DOM of that moment while Playwright's timers run for the tool.
import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './support/home';
import { runUntil } from './support/runtime';
import { startPaused } from './support/layer';
import {
  advanceTo,
  freezeBuild,
  mainText,
  mainTree,
  noScriptPage,
  scrollSectionIntoBuild,
  timelinesOnPage,
} from './support/effects';
import { frames } from './support/controls';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 375, height: 812 },
];

type Reach = (page: Page, duration: number) => Promise<void>;

const MOMENTS: { name: string; reach: Reach }[] = [
  {
    name: 'the boot',
    // The hero is typing its command in the boot terminal.
    reach: async (page) => {
      await runUntil(
        page,
        (s) => s.states[0] === 'command',
        3000,
        'hero command',
      );
      await expect(page.locator('.sp-boot')).toHaveCount(1);
    },
  },
  {
    name: 'mid-hero',
    // The role decodes and the photo is a skeleton.
    reach: async (page, duration) => {
      await advanceTo(page, 'top', duration, 1700);
      await expect(page.locator('.sp-skel-block').first()).toBeAttached();
    },
  },
  {
    name: 'mid-projects',
    // Two cards overlap.
    reach: async (page) => {
      const tls = await timelinesOnPage(page);
      await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
      await scrollSectionIntoBuild(page, 'projects');
      const cards = (tls.projects?.steps ?? []).filter((s) =>
        s.call.startsWith('projects.card('),
      );
      const [first, second] = cards;
      const overlap = ((second?.start ?? 0) + (first?.end ?? 0)) / 2;
      await advanceTo(page, 'projects', tls.projects?.duration ?? 0, overlap);
    },
  },
  {
    name: 'after the build',
    // Run all: every section final, the dock showing the complete build.
    reach: async (page) => {
      await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
      await page.keyboard.press('Shift+Escape');
      await frames(page, 3);
      await expect(page.locator('.sp-dock')).toHaveAttribute(
        'data-state',
        'done',
      );
    },
  },
];

for (const viewport of VIEWPORTS) {
  for (const theme of ['midnight', 'daylight'] as const) {
    test.describe(`${viewport.name} ${viewport.width}x${viewport.height}, ${theme} theme`, () => {
      test.use({
        viewport: { width: viewport.width, height: viewport.height },
      });

      test.beforeEach(async ({ page }) => {
        await page.addInitScript((value) => {
          if (value === 'daylight') localStorage.setItem('sp-theme', value);
        }, theme);
      });

      for (const moment of MOMENTS) {
        test(`has no axe violations at ${moment.name}, and <main> equals the no-JS page`, async ({
          page,
          browser,
        }) => {
          test.setTimeout(240_000);
          const duration = await startPaused(page);
          await moment.reach(page, duration);
          await expect(page.locator('html')).toHaveAttribute(
            'data-theme',
            theme,
          );

          // The theme does not change what <main> says: compare once per moment and viewport.
          if (theme === 'midnight') {
            const bare = await noScriptPage(browser, viewport);
            expect(await mainText(page), 'main text').toBe(bare.text);
            expect(await mainTree(page.locator('main')), 'main tree').toBe(
              bare.tree,
            );
          }

          await freezeBuild(page);
          await expectNoAxeViolations(page);
        });
      }
    });
  }
}
