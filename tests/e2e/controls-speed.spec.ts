// PRPs/prds/stage-3-runtime.prd.md AC-13 Speed and revisits (1x, 2x, infinity, names, sp-speed, ready dock),
// AC-14 Reduced motion and Play build, AC-17 Replay in instant mode (phase 4 plan: AC-A3, AC-A4, AC-A5)
// Page clicks under page.clock use element.click() in page.evaluate; real-clock tests use locators.
import { expect, test } from '@playwright/test';
import { DESKTOP_VIEWPORT, useInstantBuild } from './support/runtime';
import { startPaused, stepUntil } from './support/layer';
import {
  clickIn,
  dockButtonName,
  dockInfo,
  frames,
  isFinal,
  openClocked,
  readBuild,
  untilFrames,
} from './support/controls';

test.use({ viewport: DESKTOP_VIEWPORT });

const SHOW_PIECES = '.sp-boot, .sp-window, .sp-select, .sp-skel, .sp-outline';
const speedState = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const b = document.querySelector(
      '[data-dock-action="speed"]',
    ) as HTMLButtonElement;
    return {
      label: b.getAttribute('aria-label'),
      glyph: b.textContent?.trim(),
      stored: localStorage.getItem('sp-speed'),
      attr: document.documentElement.getAttribute('data-build-speed'),
    };
  });

test('the speed button cycles 1x, 2x, infinity, 1x with its name and sp-speed following', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startPaused(page);
  await stepUntil(page, (l) => l.dockState === 'building', 'dock building');

  let s = await speedState(page);
  expect(s).toMatchObject({
    label: 'Build speed: 1×. Switch to 2×',
    glyph: '1×',
    stored: null,
  });

  await clickIn(page, '[data-dock-action="speed"]');
  await frames(page, 1);
  s = await speedState(page);
  expect(s).toMatchObject({
    label: 'Build speed: 2×. Switch to instant',
    glyph: '2×',
    stored: '2',
    attr: '2',
  });

  await clickIn(page, '[data-dock-action="speed"]');
  await frames(page, 2);
  s = await speedState(page);
  expect(s).toMatchObject({
    label: 'Build speed: ∞ (instant). Switch to 1×',
    glyph: '∞',
    stored: 'inf',
    attr: 'inf',
  });
  // Infinity finishes the section that was building.
  expect(isFinal((await readBuild(page)).states[0])).toBe(true);

  await clickIn(page, '[data-dock-action="speed"]');
  await frames(page, 1);
  s = await speedState(page);
  expect(s).toMatchObject({
    label: 'Build speed: 1×. Switch to 2×',
    stored: '1',
  });
});

test('switching to infinity finishes the building section and every triggered one', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startPaused(page);
  await untilFrames(page, (b) => b.states[0] === 'building', 'hero building');
  await page.evaluate(() =>
    window.scrollTo({
      top:
        (document.getElementById('projects') as Element).getBoundingClientRect()
          .top +
        window.scrollY -
        500,
      behavior: 'instant',
    }),
  );
  await untilFrames(page, (b) => b.states[2] === 'queued', 'projects queued');
  await clickIn(page, '[data-dock-action="speed"]');
  await clickIn(page, '[data-dock-action="speed"]');
  await frames(page, 3);
  const b = await readBuild(page);
  expect(b.states.slice(0, 3).every(isFinal)).toBe(true);
  expect(b.states[3]).toBe('pending');
});

test('at 2x the hero completes in about half of its 1x clock time', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => localStorage.setItem('sp-speed', '2'));
  await startPaused(page);
  const { t } = await untilFrames(
    page,
    (b) => isFinal(b.states[0]),
    'hero done at 2x',
  );
  // 1x is 3100 ms; at 2x about 1550 ms minus whatever ran before the clock paused. 1x would be well above 2400.
  expect(t).toBeGreaterThanOrEqual(1100);
  expect(t).toBeLessThanOrEqual(2100);
});

test('a saved infinity renders the ready page with the dock at 5/5 sections, no show piece, and Replay in the footer', async ({
  page,
}) => {
  await useInstantBuild(page);
  await page.goto('/');
  const dock = page.locator('.sp-dock');
  await expect(dock).toHaveAttribute('data-state', 'idle');
  await expect(page.locator('html')).toHaveAttribute(
    'data-build-mode',
    'instant',
  );
  await expect(dock.locator('.sp-dock-status')).toContainText('✓ 5/5 sections');
  await expect(dock.locator('.sp-dock-hint')).toHaveText('');
  await expect(page.locator(SHOW_PIECES)).toHaveCount(0);
  await expect(page.locator('[data-footer-build]')).toHaveText('↻ Replay');

  const speed = page.locator('[data-dock-action="speed"]');
  await expect(speed).toBeVisible();
  await expect(speed).toHaveAttribute(
    'aria-label',
    'Build speed: ∞ (instant). Switch to 1×',
  );
  await speed.click();
  await expect(speed).toHaveAttribute(
    'aria-label',
    'Build speed: 1×. Switch to 2×',
  );
  expect(await page.evaluate(() => localStorage.getItem('sp-speed'))).toBe('1');
  await expect(page.locator('html')).toHaveAttribute('data-build-speed', '1');
});

test('Replay from a ready page scrolls to the top, plays from the boot at 1x and saves 1x', async ({
  page,
}) => {
  await useInstantBuild(page);
  await page.goto('/');
  await expect(page.locator('.sp-dock')).toHaveAttribute('data-state', 'idle');
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  await page.locator('.sp-footer-replay').click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-build-mode',
    'pending',
  );
  await expect(page.locator('html')).toHaveAttribute('data-build-speed', '1');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('sp-speed'))).toBe('1');
  await expect(page.locator('.sp-boot')).toHaveCount(1);
});

test.describe('reduced motion', () => {
  test('shows the ready dock with Play build only, a steady cursor and no pulse', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    await openClocked(page);
    await untilFrames(page, (b) => isFinal(b.states[0]), 'ready page', 5000);
    await frames(page, 3);
    const d = await dockInfo(page);
    expect(d.state).toBe('reduced');
    expect(d.text).toContain('✔ Ready');
    expect(d.text).toContain('motion reduced');
    expect(d.shown).toEqual(['play']);
    expect(await dockButtonName(page, 'play')).toBe('Play the build animation');
    expect(d.footer).toBe('↻ Replay');
    const r = await page.evaluate(() => ({
      pieces: document.querySelectorAll(
        '.sp-boot, .sp-window, .sp-select, .sp-skel, .sp-outline',
      ).length,
      h1: getComputedStyle(document.querySelector('h1') as Element).opacity,
      cursor: getComputedStyle(
        document.querySelector('.sp-dock .sp-cursor') as Element,
      ).animationName,
    }));
    expect(r).toEqual({ pieces: 0, h1: '1', cursor: 'none' });
    // It never pulses, however long it idles.
    await page.clock.runFor(6000);
    expect((await dockInfo(page)).pulse).toBe(false);
    await ctx.close();
  });

  test('Play build scrolls to the top and builds from the boot at 1x', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const ctx = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    await openClocked(page);
    await untilFrames(page, (b) => isFinal(b.states[0]), 'ready page', 5000);
    await frames(page, 3);
    await page.evaluate(() =>
      window.scrollTo({ top: 400, behavior: 'instant' }),
    );
    await clickIn(page, '[data-dock-action="play"]');
    await frames(page, 20);
    const r = await page.evaluate(() => ({
      y: window.scrollY,
      mode: document.documentElement.getAttribute('data-build-mode'),
      speed: document.documentElement.getAttribute('data-build-speed'),
      boot: document.querySelectorAll('.sp-boot').length,
      footer:
        document.querySelector('[data-footer-build]')?.textContent?.trim() ??
        null,
    }));
    expect(r).toEqual({
      y: 0,
      mode: 'pending',
      speed: '1',
      boot: 1,
      footer: '',
    });
    const { t } = await untilFrames(
      page,
      (b) => isFinal(b.states[0]),
      'hero done after Play build',
    );
    // 400 ms already stepped; the hero takes 3100 ms at 1x.
    expect(t + 400).toBeGreaterThanOrEqual(2700);
    expect(t + 400).toBeLessThanOrEqual(3700);
    await ctx.close();
  });
});
