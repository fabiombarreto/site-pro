// PRPs/prds/stage-3-runtime.prd.md AC-15 Safe without JavaScript and when the runtime fails
// PRPs/prds/stage-3-runtime.prd.md AC-1 Page ready without the build, AC-13 Infinity speed,
// AC-14 Reduced motion, AC-5 speed values read before first paint (phase 1 plan: AC-A1, AC-A5)
import { expect, test, type Page } from '@playwright/test';
import {
  DESKTOP_VIEWPORT,
  IDS,
  snapshot,
  startClocked,
} from './support/runtime';

test.use({ viewport: DESKTOP_VIEWPORT });

const htmlAttr = (page: Page, name: string): Promise<string | null> =>
  page.evaluate((n) => document.documentElement.getAttribute(n), name);

test.describe('JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  test('equals the Stage 2 page: no pending state, no runtime state, content visible', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'load' });
    const dom = await page.evaluate(() => ({
      mode: document.documentElement.hasAttribute('data-build-mode'),
      status: document.documentElement.hasAttribute('data-build-status'),
      states: document.querySelectorAll('[data-build-state]').length,
      about: getComputedStyle(document.getElementById('about') as Element)
        .opacity,
    }));
    expect(dom.mode).toBe(false);
    expect(dom.status).toBe(false);
    expect(dom.states).toBe(0);
    expect(dom.about).toBe('1');
  });
});

test.describe('runtime module blocked or throwing', () => {
  test('keeps every section hidden before the watchdog and shows them all within 3 s of clock time', async ({
    page,
  }) => {
    await page.route(/\/_astro\/.*\.js/, (route) => route.abort());
    await startClocked(page);
    expect(await htmlAttr(page, 'data-build-mode')).toBe('pending');
    expect((await snapshot(page)).opacity[1]).toBe('0');

    await page.clock.pauseAt(1500);
    expect(await htmlAttr(page, 'data-build-mode')).toBe('pending');

    await page.clock.runFor(3000);
    const after = await snapshot(page);
    expect(after.mode).toBeNull();
    expect(after.opacity.every((o) => o === '1')).toBe(true);
  });

  test('reveals the page when the runtime script throws on load', async ({
    page,
  }) => {
    await page.route(/\/_astro\/.*\.js/, (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: 'throw new Error("runtime failed to start");',
      }),
    );
    await startClocked(page);
    await page.clock.pauseAt(60000);
    const after = await snapshot(page);
    expect(after.mode).toBeNull();
    expect(after.opacity.every((o) => o === '1')).toBe(true);
  });
});

test.describe('pending state before the runtime starts', () => {
  test('hides later sections with opacity only, keeping them laid out and in the accessibility tree', async ({
    page,
  }) => {
    await page.route(/\/_astro\/.*\.js/, (route) => route.abort());
    await startClocked(page);
    const about = await page.evaluate(() => {
      const el = document.getElementById('about') as Element;
      const style = getComputedStyle(el);
      return {
        opacity: style.opacity,
        display: style.display,
        visibility: style.visibility,
        height: el.getBoundingClientRect().height,
      };
    });
    expect(about.opacity).toBe('0');
    expect(about.display).not.toBe('none');
    expect(about.visibility).toBe('visible');
    expect(about.height).toBeGreaterThan(100);
    await expect(
      page.getByRole('heading', { level: 2, name: 'About me' }),
    ).toHaveCount(1);
  });
});

test.describe('instant mode', () => {
  test('renders ready at DOMContentLoaded under reduced motion and ends every section done', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const first = await snapshot(page);
    expect(first.mode).toBe('instant');
    expect(first.opacity.every((o) => o === '1')).toBe(true);
    await expect(page.locator('html')).toHaveAttribute(
      'data-build-status',
      'done',
    );
    const done = await snapshot(page);
    expect(done.states).toEqual(IDS.map(() => 'done'));
    await context.close();
  });

  test('renders ready at DOMContentLoaded for a saved infinity speed and ends every section done', async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
    await context.addInitScript(() =>
      window.localStorage.setItem('sp-speed', 'inf'),
    );
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const first = await snapshot(page);
    expect(first.mode).toBe('instant');
    expect(first.speed).toBe('inf');
    expect(first.opacity.every((o) => o === '1')).toBe(true);
    await expect(page.locator('html')).toHaveAttribute(
      'data-build-status',
      'done',
    );
    expect((await snapshot(page)).states).toEqual(IDS.map(() => 'done'));
    await context.close();
  });
});

test.describe('saved speed before first paint', () => {
  for (const [saved, expected] of [
    ['2', '2'],
    ['fast', '1'],
  ] as const) {
    test(`resolves a saved sp-speed of "${saved}" to ${expected}x and still builds`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
      await context.addInitScript(
        (value) => window.localStorage.setItem('sp-speed', value),
        saved,
      );
      const page = await context.newPage();
      await page.clock.install({ time: 0 });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const first = await snapshot(page);
      expect(first.mode).toBe('pending');
      expect(first.speed).toBe(expected);
      await context.close();
    });
  }
});
