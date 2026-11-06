// PRPs/prds/stage-2-foundation.prd.md AC-3 Keyboard and focus on the project pages and the 404 (phase 6 plan: AC-A6)
// PRPs/prds/stage-2-foundation.prd.md AC-2 nav, menu, back and Go home links reach the home page (phase 6 plan: AC-A7)
import { expect, test } from '@playwright/test';
import { ACCENT_RGB, popoverOpen, textOf } from './support/home';

const SUBPAGES = ['/projects/relay', '/projects/site-pro', '/nope'];

test.use({ viewport: { width: 1280, height: 800 } });

test.describe('skip link on the new pages (AC-3)', () => {
  for (const path of SUBPAGES) {
    test(`${path}: the first Tab focuses the skip link and Enter focuses main`, async ({
      page,
    }) => {
      await page.goto(path);
      await page.keyboard.press('Tab');
      const skip = page.getByRole('link', { name: 'Skip to content' });
      await expect(skip).toBeFocused();
      await expect(skip).toHaveCSS('outline-color', ACCENT_RGB);
      await expect(skip).toHaveCSS('outline-width', '2px');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('main')).toBeFocused();
    });
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the relay fork note is readable in the page text', async ({ page }) => {
    await page.goto('/projects/relay');
    const main = await page.locator('main').innerText();
    expect(textOf(main)).toContain(
      'The repository is a fork of Wirasm/prp. relay is the plugin I built inside it.',
    );
  });

  test('the back link lands on / with the projects heading in view', async ({
    page,
  }) => {
    await page.goto('/projects/relay');
    await page.locator('main a[href="/#projects"]').click();
    await page.waitForURL(
      (url) => url.pathname === '/' && url.hash === '#projects',
    );
    await expect(page.locator('#projects-title')).toBeInViewport();
  });

  for (const id of ['about', 'contact']) {
    test(`the nav link /#${id} from a project page lands with that h2 in view`, async ({
      page,
    }) => {
      await page.goto('/projects/site-pro');
      await page.locator(`.sp-nav-links a[href="/#${id}"]`).click();
      await page.waitForURL(
        (url) => url.pathname === '/' && url.hash === `#${id}`,
      );
      await expect(page.locator(`#${id}-title`)).toBeInViewport();
    });
  }

  test('Go home on the 404 reaches the home page', async ({ page }) => {
    await page.goto('/nope');
    await page.locator('main a[href="/"]').click();
    await page.waitForURL((url) => url.pathname === '/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Fabio',
    );
  });
});

test.describe('mobile menu on a project page', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('opens with four home-prefixed links and navigates to the home section', async ({
    page,
  }) => {
    await page.goto('/projects/relay');
    await page.getByRole('button', { name: 'Open the menu' }).click();
    expect(await popoverOpen(page)).toBe(true);
    const links = page.locator('#mobile-menu nav a');
    await expect(links).toHaveCount(4);
    const hrefs = await links.evaluateAll((els) =>
      els.map((e) => e.getAttribute('href')),
    );
    expect(hrefs).toEqual(['/#about', '/#projects', '/#stack', '/#contact']);
    await page.locator('#mobile-menu a[href="/#about"]').click();
    await page.waitForURL(
      (url) => url.pathname === '/' && url.hash === '#about',
    );
  });
});
