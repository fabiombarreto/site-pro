// PRPs/prds/stage-2-foundation.prd.md AC-5 Zero axe violations, home page share (phase 5 plan: AC-A4, AC-A6)
// `/` in both themes at 1280x800, 800x1024 and 375x812, and at 375x812 with the mobile menu open.
import { expect, test } from '@playwright/test';
import { expectNoAxeViolations, PHONE, TABLET } from './support/home';
import { useInstantBuild } from './support/runtime';

const VIEWPORTS = [
  { name: '1280x800', size: { width: 1280, height: 800 } },
  { name: '800x1024', size: TABLET },
  { name: '375x812', size: PHONE },
];

const THEMES = ['midnight', 'daylight'] as const;

for (const theme of THEMES) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      // Stage 3: audit the final page, not a section caught mid-build at
      // opacity 0. A saved infinity speed renders it at once.
      await useInstantBuild(page);
      await page.addInitScript((value) => {
        if (value === 'daylight') localStorage.setItem('sp-theme', value);
      }, theme);
    });

    for (const viewport of VIEWPORTS) {
      test(`has no axe violations on / at ${viewport.name}`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport.size);
        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expectNoAxeViolations(page);
      });
    }

    test('has no axe violations on / at 375x812 with the mobile menu open', async ({
      page,
    }) => {
      await page.setViewportSize(PHONE);
      await page.goto('/');
      await page.getByRole('button', { name: 'Open the menu' }).click();
      await expect(page.locator('#mobile-menu')).toBeVisible();
      await expectNoAxeViolations(page);
    });
  });
}
