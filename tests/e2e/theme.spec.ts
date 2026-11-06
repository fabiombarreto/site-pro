// PRPs/prds/stage-2-foundation.prd.md AC-4 Themes without a flash (phase 2 plan: AC-A1, AC-A2)
// AC-3 focus ring (AC-A4), AC-12 reduced motion (AC-A5), AC-10 fonts and CSS budget (AC-A7),
// AC-13 Backdrop (AC-A8)
import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const RECORD_THEME_AT_DCL = `
  document.addEventListener('DOMContentLoaded', () => {
    window.__themeAtDcl = document.documentElement.dataset.theme;
  });
`;

const themeAtDcl = (page: import('@playwright/test').Page) =>
  page.evaluate(
    () => (window as unknown as { __themeAtDcl?: string }).__themeAtDcl,
  );

test.describe('theme without a flash', () => {
  test('serves Midnight in the HTML with the theme script before any stylesheet', async ({
    request,
  }) => {
    const html = await (await request.get('/')).text();
    expect(html).toMatch(/<html[^>]*data-theme="midnight"/);
    const script = html.indexOf('localStorage.getItem');
    const sheets = [
      html.indexOf('rel="stylesheet"'),
      html.indexOf('<style'),
    ].filter((i) => i >= 0);
    expect(script).toBeGreaterThanOrEqual(0);
    for (const sheet of sheets) expect(script).toBeLessThan(sheet);
  });

  test('starts in Midnight with a Daylight-offering toggle', async ({
    page,
  }) => {
    await page.addInitScript(RECORD_THEME_AT_DCL);
    await page.goto('/');
    expect(await themeAtDcl(page)).toBe('midnight');
    await expect(
      page.getByRole('button', { name: 'Switch to the Daylight theme' }),
    ).toBeVisible();
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(20, 21, 25)',
    );
  });

  test('switches theme, renames the toggle and keeps Daylight after reload', async ({
    page,
  }) => {
    await page.addInitScript(RECORD_THEME_AT_DCL);
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Switch to the Daylight theme' })
      .click();

    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      'daylight',
    );
    await expect(
      page.getByRole('button', { name: 'Switch to the Midnight theme' }),
    ).toBeVisible();
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(246, 247, 249)',
    );

    await page.reload();
    expect(await themeAtDcl(page)).toBe('daylight');
    await expect(
      page.getByRole('button', { name: 'Switch to the Midnight theme' }),
    ).toBeVisible();

    await page
      .getByRole('button', { name: 'Switch to the Midnight theme' })
      .click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      'midnight',
    );
  });

  test('applies a stored Daylight preference before first paint', async ({
    page,
  }) => {
    await page.addInitScript(RECORD_THEME_AT_DCL);
    await page.addInitScript(() =>
      window.localStorage.setItem('sp-theme', 'daylight'),
    );
    await page.goto('/');
    expect(await themeAtDcl(page)).toBe('daylight');
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  });

  test('ignores an unknown stored value', async ({ page }) => {
    await page.addInitScript(() =>
      window.localStorage.setItem('sp-theme', 'neon'),
    );
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      'midnight',
    );
  });

  test('exposes no theme control with JavaScript disabled', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      'midnight',
    );
    await expect(page.locator('[data-theme-toggle]')).toBeHidden();
    await expect(page.getByRole('button', { name: /theme/i })).toHaveCount(0);
    await context.close();
  });
});

test.describe('focus and motion', () => {
  test('rings the focused toggle with a 2px solid accent outline offset 2px', async ({
    page,
  }) => {
    await page.goto('/');
    // Tab stops before the toggle: skip link, brand, About, Projects, Stack, Contact.
    for (let stop = 0; stop < 6; stop++) await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { name: 'Contact', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    const toggle = page.getByRole('button', {
      name: 'Switch to the Daylight theme',
    });
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveCSS('outline-style', 'solid');
    await expect(toggle).toHaveCSS('outline-width', '2px');
    await expect(toggle).toHaveCSS('outline-offset', '2px');
    await expect(toggle).toHaveCSS('outline-color', 'rgb(37, 99, 235)');
  });

  test('runs the 150 ms hover transition only without reduced motion', async ({
    page,
  }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /Switch to the/ });
    const duration = () =>
      toggle.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(await duration()).toMatch(/^0\.15s/);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await duration()).toBe('0s');
  });
});

test.describe('fonts', () => {
  test('serves both self-hosted font files', async ({ request }) => {
    for (const file of [
      'geist-latin-wght-normal.woff2',
      'jetbrains-mono-latin-wght-normal.woff2',
    ]) {
      const response = await request.get(`/fonts/${file}`);
      expect(response.status(), file).toBe(200);
      expect((await response.body()).length, file).toBeGreaterThan(10000);
    }
  });

  test('loads Geist for the page text', async ({ page }) => {
    await page.goto('/');
    const loaded = await page.evaluate(async () => {
      const faces = await document.fonts.load('16px Geist');
      return faces.length;
    });
    expect(loaded).toBeGreaterThan(0);
  });

  test('preloads both fonts in the served head', async ({ request }) => {
    const html = await (await request.get('/')).text();
    for (const file of [
      'geist-latin-wght-normal.woff2',
      'jetbrains-mono-latin-wght-normal.woff2',
    ]) {
      expect(html).toMatch(
        new RegExp(`<link[^>]*rel="preload"[^>]*${file.replace('.', '\\.')}`),
      );
    }
  });
});

test.describe('Backdrop', () => {
  test('is decorative, absolutely positioned and adds no horizontal scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const backdrop = page.locator('.sp-backdrop');
    await expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    await expect(backdrop).toHaveCSS('position', 'absolute');
    await expect(backdrop).toHaveCSS('pointer-events', 'none');
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  for (const [width, glowSize] of [
    [1440, '900px'],
    [800, '702px'],
    [375, '540px'],
  ] as const) {
    test(`scales the first glow to ${glowSize} at ${width}px wide`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const glow = page.locator('.sp-glow').first();
      await expect(glow).toHaveCSS('width', glowSize);
      await expect(glow).toHaveCSS('height', glowSize);
    });
  }
});

test.describe('built dist/ styles', () => {
  const dist = resolve(process.cwd(), 'dist');
  const files = (ext: string[]): string[] =>
    readdirSync(dist, { recursive: true })
      .map((entry) => join(dist, String(entry)))
      .filter((file) => ext.some((e) => file.endsWith(e)));

  test('keeps the emitted CSS within 25 KB gzip', () => {
    const css = files(['.css']);
    expect(css.length).toBeGreaterThan(0);
    const total = css
      .map((file) => gzipSync(readFileSync(file)).length)
      .reduce((sum, n) => sum + n, 0);
    expect(total).toBeLessThanOrEqual(25 * 1024);
  });

  test('references no remote font host', () => {
    for (const file of files(['.html', '.css'])) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(
        /fonts\.(googleapis|gstatic)/,
      );
    }
  });

  test('inlines the generated grain and the JS-reveal rule in the CSS', () => {
    const css = files(['.css'])
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    expect(css).toContain('feTurbulence');
    expect(css).toContain('data-js');
  });
});
