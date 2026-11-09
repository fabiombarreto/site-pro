// PRPs/prds/stage-3-runtime.prd.md AC-14 reduced motion, AC-15 no JavaScript or failure, AC-13 saved infinity (no layer),
// AC-17 reserved footer slot (phase 2 plan: AC-A6, AC-A7, AC-A8 markup part)
import { expect, test, type Page } from '@playwright/test';
import { DESKTOP_VIEWPORT, startClocked } from './support/runtime';

test.use({ viewport: DESKTOP_VIEWPORT });

const LAYER = '[data-build-layer], .sp-boot, .sp-dock, .sp-window, .sp-outline';
const layerCount = (page: Page): Promise<number> => page.locator(LAYER).count();
const showPieces = (page: Page): Promise<number> =>
  page.locator('.sp-boot, .sp-window, .sp-outline').count();
const navOpacity = (page: Page): Promise<string> =>
  page.evaluate(
    () =>
      getComputedStyle(document.querySelector('.sp-nav') as Element).opacity,
  );

test.describe('no layer is created', () => {
  // Under reduced motion and a saved infinity only the ready dock exists (phase 4 ledger row); with no
  // JavaScript or a blocked runtime nothing exists at all.
  test('under reduced motion, with the nav visible', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('html')).toHaveAttribute(
      'data-build-status',
      'done',
    );
    // Stage 3 phase 4 (AC-14): the reduced dock stays; no show piece exists.
    expect(await showPieces(page)).toBe(0);
    await expect(page.locator('.sp-dock')).toHaveAttribute(
      'data-state',
      'reduced',
    );
    expect(await navOpacity(page)).toBe('1');
    await ctx.close();
  });

  test('with a saved infinity speed, with the nav visible', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
    await ctx.addInitScript(() => localStorage.setItem('sp-speed', 'inf'));
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('html')).toHaveAttribute(
      'data-build-status',
      'done',
    );
    // Stage 3 phase 4 (AC-13): the ready dock stays; no show piece exists.
    expect(await showPieces(page)).toBe(0);
    await expect(page.locator('.sp-dock')).toHaveAttribute(
      'data-state',
      'idle',
    );
    expect(await navOpacity(page)).toBe('1');
    await ctx.close();
  });

  test('without JavaScript, with the nav visible', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      javaScriptEnabled: false,
    });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    expect(await layerCount(page)).toBe(0);
    expect(await navOpacity(page)).toBe('1');
    await ctx.close();
  });

  test('when the runtime is blocked: the nav is hidden while pending, then shown by the watchdog with no layer', async ({
    page,
  }) => {
    await page.route(/\/_astro\/.*\.js/, (route) => route.abort());
    await startClocked(page);
    expect(await navOpacity(page)).toBe('0');
    await page.clock.pauseAt(60000);
    expect(await layerCount(page)).toBe(0);
    expect(await navOpacity(page)).toBe('1');
  });
});

test.describe('reserved footer build slot', () => {
  test('is present, empty and one line high on / without JavaScript', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      javaScriptEnabled: false,
    });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    const slot = await page.evaluate(() => {
      const el = document.querySelector('[data-footer-build]');
      return el
        ? { text: el.textContent, height: el.getBoundingClientRect().height }
        : null;
    });
    expect(slot).not.toBeNull();
    expect(slot?.text).toBe('');
    expect(slot?.height ?? 0).toBeGreaterThanOrEqual(20);
    await ctx.close();
  });

  test('takes its own row under 768 px', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      javaScriptEnabled: false,
    });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    const rows = await page.evaluate(() => {
      const meta = (
        document.querySelector('.sp-footer-meta') as Element
      ).getBoundingClientRect();
      const slot = (
        document.querySelector('[data-footer-build]') as Element
      ).getBoundingClientRect();
      return { metaBottom: meta.bottom, slotTop: slot.top };
    });
    expect(rows.slotTop).toBeGreaterThanOrEqual(rows.metaBottom - 0.5);
    await ctx.close();
  });

  test('is absent from project pages, which also carry no build-layer markup', async ({
    request,
  }) => {
    const html = await (await request.get('/projects/relay/')).text();
    expect(html).not.toContain('data-footer-build');
    expect(html).not.toContain('data-build-layer');
    expect(html).not.toMatch(
      /<[a-z][^>]*\sclass="[^"]*\bsp-(boot|dock|window|outline)\b/,
    );
  });
});
