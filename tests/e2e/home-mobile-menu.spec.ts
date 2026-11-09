// PRPs/prds/stage-2-foundation.prd.md AC-6 Mobile menu (phase 5 plan: AC-A4)
// Also covers the sticky nav states of the same plan (AC-A7).
import { expect, test } from '@playwright/test';
import { NAV_LINKS, PHONE, PROFILE, popoverOpen } from './support/home';
import { useInstantBuild } from './support/runtime';

const OPEN = 'Open the menu';

test.describe('phone viewport with JavaScript', () => {
  test.use({ viewport: PHONE });

  test('hides the section links and shows the menu button', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();
    await expect(page.getByRole('button', { name: OPEN })).toBeVisible();
  });

  test('opens a menu with four numbered links and the profile buttons', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: OPEN }).click();
    expect(await popoverOpen(page)).toBe(true);

    const menu = page.locator('#mobile-menu');
    await expect(menu.locator('.sp-menu-num')).toHaveText(
      NAV_LINKS.map((l) => l.index),
    );
    await expect(menu.locator('a.sp-menu-link .text-xl')).toHaveText(
      NAV_LINKS.map((l) => l.label),
    );
    await expect(menu.locator('a.sp-menu-link')).toHaveCount(4);
    for (const link of NAV_LINKS) {
      await expect(
        menu.locator(`a.sp-menu-link[href="#${link.id}"]`),
      ).toBeVisible();
    }
    const github = menu.getByRole('link', { name: 'GitHub' });
    const linkedin = menu.getByRole('link', { name: 'LinkedIn' });
    await expect(github).toHaveAttribute('href', PROFILE.github);
    await expect(linkedin).toHaveAttribute('href', PROFILE.linkedin);
    await expect(menu.getByRole('link')).toHaveCount(6);
  });

  test('reaches every menu item by keyboard, in order', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: OPEN });
    await button.focus();
    await page.keyboard.press('Enter');
    expect(await popoverOpen(page)).toBe(true);

    const hrefs: (string | null)[] = [];
    for (let step = 0; step < 6; step++) {
      await page.keyboard.press('Tab');
      hrefs.push(
        await page.evaluate(() => {
          const el = document.activeElement;
          return el?.closest('#mobile-menu')
            ? el.getAttribute('href')
            : 'outside-menu';
        }),
      );
    }
    expect(hrefs).toEqual([
      '#about',
      '#projects',
      '#stack',
      '#contact',
      PROFILE.github,
      PROFILE.linkedin,
    ]);
  });

  test('closes on Escape and returns focus to the button', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: OPEN });
    await button.focus();
    await page.keyboard.press('Enter');
    expect(await popoverOpen(page)).toBe(true);
    await page.keyboard.press('Escape');
    expect(await popoverOpen(page)).toBe(false);
    await expect(button).toBeFocused();
  });

  test('closes and navigates when a link is chosen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: OPEN }).click();
    await page.locator('#mobile-menu a[href="#about"]').click();
    await expect.poll(() => new URL(page.url()).hash).toBe('#about');
    expect(await popoverOpen(page)).toBe(false);
  });
});

test.describe('phone viewport without JavaScript', () => {
  test.use({ viewport: PHONE, javaScriptEnabled: false });

  test('opens the menu and closes it on Escape', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: OPEN });
    await button.click();
    expect(await popoverOpen(page)).toBe(true);
    await expect(page.locator('#mobile-menu').getByRole('link')).toHaveCount(6);
    await page.keyboard.press('Escape');
    expect(await popoverOpen(page)).toBe(false);
  });
});

test.describe('tablet and desktop widths', () => {
  for (const width of [768, 1280]) {
    test(`shows no menu button and inline links at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await expect(page.getByRole('button', { name: OPEN })).toBeHidden();
      const nav = page.getByRole('navigation', { name: 'Main' });
      await expect(nav).toBeVisible();
      await expect(nav.getByRole('link')).toHaveText(
        NAV_LINKS.map((l) => l.label),
      );
    });
  }
});

test.describe('sticky nav', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('is sticky, 64px tall, transparent at the top and translucent once scrolled', async ({
    page,
  }) => {
    // Stage 3 phase 2: on a default real-clock visit the nav slides in with the build,
    // so the final sticky page is measured in instant mode (the nav is in at once).
    await useInstantBuild(page);
    await page.goto('/');
    const nav = page.getByRole('banner');
    await expect(nav).toHaveCSS('position', 'sticky');
    await expect(nav).toHaveCSS('height', '64px');
    await expect(nav).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(nav).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    expect(await nav.evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('stays translucent at the top', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('banner')).not.toHaveCSS(
        'background-color',
        'rgba(0, 0, 0, 0)',
      );
    });
  });
});
