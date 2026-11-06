// PRPs/prds/stage-2-foundation.prd.md AC-5 Zero axe violations, project pages and 404 share (phase 6 plan: AC-A4)
// Each /projects/<slug> page and an unknown path, in both themes at 1280x800, 800x1024 and 375x812,
// and a project page at 375x812 with the mobile menu open.
import { expect, test } from '@playwright/test';
import { expectNoAxeViolations, PHONE, PROJECTS, TABLET } from './support/home';

const VIEWPORTS = [
  { name: '1280x800', size: { width: 1280, height: 800 } },
  { name: '800x1024', size: TABLET },
  { name: '375x812', size: PHONE },
];

const THEMES = ['midnight', 'daylight'] as const;

const PATHS = [...PROJECTS.map((p) => `/projects/${p.slug}`), '/nope'];

for (const theme of THEMES) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => {
        if (value === 'daylight') localStorage.setItem('sp-theme', value);
      }, theme);
    });

    for (const path of PATHS) {
      for (const viewport of VIEWPORTS) {
        test(`has no axe violations on ${path} at ${viewport.name}`, async ({
          page,
        }) => {
          await page.setViewportSize(viewport.size);
          await page.goto(path);
          await expect(page.locator('html')).toHaveAttribute(
            'data-theme',
            theme,
          );
          await expectNoAxeViolations(page);
        });
      }
    }

    test('has no axe violations on /projects/relay at 375x812 with the mobile menu open', async ({
      page,
    }) => {
      await page.setViewportSize(PHONE);
      await page.goto('/projects/relay');
      await page.getByRole('button', { name: 'Open the menu' }).click();
      await expect(page.locator('#mobile-menu')).toBeVisible();
      await expectNoAxeViolations(page);
    });
  });
}
