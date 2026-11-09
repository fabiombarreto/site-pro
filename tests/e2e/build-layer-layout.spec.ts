// PRPs/prds/stage-3-runtime.prd.md AC-4 the final layout never moves, AC-12 windows realign to the section box,
// AC-21 compact window and dock, sticky bars under the nav (phase 2 plan: AC-A3, AC-A5)
import { expect, test, type Browser, type Page } from '@playwright/test';
import { DESKTOP_VIEWPORT, runUntil, sleep, snapshot } from './support/runtime';
import { heroAt, layerState, startPaused } from './support/layer';
import { isFinal } from './support/controls';

test.use({ viewport: DESKTOP_VIEWPORT });

const boxes = (page: Page) =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const els = [
      ...document.querySelectorAll(
        'main > section, main h1, main h2, main p, main a, main article, footer, footer p',
      ),
    ];
    return {
      height: document.documentElement.scrollHeight,
      text: (document.querySelector('main')?.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim(),
      boxes: els.map((e) => {
        const r = e.getBoundingClientRect();
        return [r.x + scrollX, r.y + scrollY, r.width, r.height];
      }),
    };
  });

type Boxes = Awaited<ReturnType<typeof boxes>>;

function expectSame(actual: Boxes, ready: Boxes, label: string): void {
  expect(
    Math.abs(actual.height - ready.height),
    `${label} height`,
  ).toBeLessThanOrEqual(0.5);
  expect(actual.boxes, `${label} box count`).toHaveLength(ready.boxes.length);
  actual.boxes.forEach((box, i) =>
    box.forEach((v, j) =>
      expect(
        Math.abs(v - (ready.boxes[i]?.[j] ?? Infinity)),
        `${label} box ${i} coordinate ${j}`,
      ).toBeLessThanOrEqual(0.5),
    ),
  );
  expect(actual.text, `${label} main text`).toBe(ready.text);
}

async function readyBoxes(browser: Browser): Promise<Boxes> {
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
  const result = await boxes(page);
  await ctx.close();
  return result;
}

test('never moves a box or the text while the hero and Projects windows are open, and shifts layout by at most 0.01', async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const ready = await readyBoxes(browser);
  const ctx = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
  await ctx.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as unknown as {
        hadRecentInput: boolean;
        value: number;
      }[]) {
        if (!e.hadRecentInput)
          (window as unknown as { __cls: number }).__cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  const page = await ctx.newPage();
  const duration = await startPaused(page);

  await heroAt(page, 1700, duration);
  expectSame(await boxes(page), ready, 'mid-hero');
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');

  const top = await page.evaluate(
    () =>
      (document.getElementById('projects') as Element).getBoundingClientRect()
        .top + window.scrollY,
  );
  await page.evaluate(
    (y) => window.scrollTo({ top: y - 500, behavior: 'instant' }),
    top,
  );
  await runUntil(
    page,
    (s) => s.states[2] === 'building',
    90000,
    'mid projects',
  );
  expectSame(await boxes(page), ready, 'mid-projects');
  await runUntil(page, (s) => s.states[2] === 'done', 90000, 'projects done');
  expectSame(await boxes(page), ready, 'after projects');

  await sleep(50);
  const cls = await page.evaluate(
    () => (window as unknown as { __cls: number }).__cls,
  );
  expect(cls).toBeLessThanOrEqual(0.01);
  await ctx.close();
});

const chromeTop = (page: Page) =>
  page.evaluate(
    () =>
      (
        document.querySelector('.sp-window-chrome') as Element
      ).getBoundingClientRect().top,
  );

async function openHeroWindow(
  browser: Browser,
  viewport: { width: number; height: number },
) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const duration = await startPaused(page);
  await heroAt(page, 1700, duration);
  return { page, ctx };
}

test('desktop: the bars stick under the nav and the window follows the section after a height-only resize', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const { page, ctx } = await openHeroWindow(browser, DESKTOP_VIEWPORT);
  await page.evaluate(() => window.scrollTo({ top: 150, behavior: 'instant' }));
  await page.clock.runFor(32);
  await sleep(20);
  expect(Math.abs((await chromeTop(page)) - 64)).toBeLessThanOrEqual(1);

  // AC-12: only a width change is a resize, so a height change keeps the hero and its window.
  await page.setViewportSize({
    width: DESKTOP_VIEWPORT.width,
    height: 700,
  });
  await page.clock.runFor(100);
  await sleep(50);
  const fit = await page.evaluate(() => {
    const w = (
      document.querySelector('.sp-window') as Element
    ).getBoundingClientRect();
    const s = (
      document.getElementById('top') as Element
    ).getBoundingClientRect();
    return [w.x - s.x, w.width - s.width];
  });
  fit.forEach((d) => expect(Math.abs(d)).toBeLessThanOrEqual(0.5));
  expect(Math.abs((await chromeTop(page)) - 64)).toBeLessThanOrEqual(1);
  await ctx.close();
});

test('desktop: a width change finishes the building hero and leaves no window for it', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const { page, ctx } = await openHeroWindow(browser, DESKTOP_VIEWPORT);
  const heroFile = (await layerState(page)).file;
  expect(heroFile).not.toBeNull();
  expect((await snapshot(page)).states[0]).not.toBe('done');

  await page.setViewportSize({ width: 1100, height: 800 });
  await page.clock.runFor(100);
  await sleep(50);
  await page.clock.runFor(100);
  await sleep(50);

  expect(isFinal((await snapshot(page)).states[0])).toBe(true);
  const files = await page.evaluate(() =>
    [...document.querySelectorAll('.sp-window')].map((w) =>
      w.getAttribute('data-file'),
    ),
  );
  expect(files).not.toContain(heroFile);
  await ctx.close();
});

test('mobile 375x812: one compact bar with the current command, a dock of viewport width minus 16 px per side, bars stuck under the nav', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const { page, ctx } = await openHeroWindow(browser, {
    width: 375,
    height: 812,
  });
  const m = await page.evaluate(() => {
    const bar = document.querySelector('.sp-window-bar') as Element;
    const cmd = document.querySelector('.sp-window-cmd') as Element;
    const dock = (
      document.querySelector('.sp-dock') as Element
    ).getBoundingClientRect();
    return {
      barDisplay: getComputedStyle(bar).display,
      cmdDisplay: getComputedStyle(cmd).display,
      cmdText: cmd.textContent ?? '',
      hintDisplay: getComputedStyle(
        document.querySelector('.sp-dock-hint') as Element,
      ).display,
      dockLeft: dock.left,
      dockWidth: dock.width,
    };
  });
  expect(m.barDisplay).toBe('none');
  expect(m.cmdDisplay).not.toBe('none');
  expect(m.cmdText).toContain('hero');
  expect(Math.abs(m.dockWidth - 343)).toBeLessThanOrEqual(1);
  expect(Math.abs(m.dockLeft - 16)).toBeLessThanOrEqual(1);
  expect(m.hintDisplay).toBe('none');

  await page.evaluate(() => window.scrollTo({ top: 150, behavior: 'instant' }));
  await page.clock.runFor(32);
  await sleep(20);
  expect(Math.abs((await chromeTop(page)) - 64)).toBeLessThanOrEqual(1);
  await ctx.close();
});
