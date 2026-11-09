// PRPs/prds/stage-3-runtime.prd.md AC-21 mobile build layer and tall sections: at 375x812 the hero window shows a
// compact bar, the dock shows only the status and "» Skip", and a tap on the window's bar skips the section; at
// 1280x800 and 375x812 a section taller than the viewport keeps its title bar and command bar stuck under the nav
// until the section's end (AC-7 skip by the window bar)
// (phase 5 plan: Notes, the mobile-build spec named in docs/context/testing.md)
// The 375x812 width, the compact bar and the dock inset are already measured by build-layer-layout.spec.ts; this
// spec adds the tap, the dock contents and the sticky bars of a tall section. The nav is 64 px tall (the same value
// build-layer-layout.spec.ts uses). Under page.clock the scroll is followed by one clock frame so layout settles.
import { expect, test, type Page } from '@playwright/test';
import { sleep } from './support/runtime';
import { heroAt, startPaused } from './support/layer';
import { scrollSectionIntoBuild } from './support/effects';
import { frames, readBuild, skipHero, untilFrames } from './support/controls';

const NAV = 64;

test.describe('375x812 touch', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test('the dock shows only the status and Skip while the hero builds, and a tap on the window bar skips the hero', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const duration = await startPaused(page);
    await heroAt(page, 1700, duration);

    const dock = await page.evaluate(() => {
      const el = document.querySelector('.sp-dock') as Element;
      const display = (selector: string): string => {
        const part = el.querySelector(selector);
        return part ? getComputedStyle(part).display : 'missing';
      };
      return {
        shown: [...el.querySelectorAll('[data-dock-action]')]
          .filter((b) => getComputedStyle(b).display !== 'none')
          .map((b) => b.getAttribute('data-dock-action')),
        hint: display('.sp-dock-hint'),
        log: display('.sp-dock-log'),
        status: el.querySelector('.sp-dock-status')?.textContent ?? '',
        windowBar: (() => {
          const bar = document.querySelector('.sp-window-bar');
          return bar ? getComputedStyle(bar).display : 'missing';
        })(),
      };
    });
    expect(dock.shown).toEqual(['skip']);
    expect(dock.hint).toBe('none');
    expect(dock.log).toBe('none');
    expect(dock.status).toContain('Building hero');
    expect(dock.windowBar).toBe('none');

    // The compact bar is the window's command bar: bring it under the nav, then tap its middle.
    await page.evaluate(() =>
      window.scrollTo({ top: 150, behavior: 'instant' }),
    );
    await page.clock.runFor(32);
    await sleep(20);
    const tap = await page.evaluate(() => {
      const cmd = document.querySelector(
        '.sp-window[data-section="top"] .sp-window-cmd',
      ) as Element;
      const r = cmd.getBoundingClientRect();
      const x = r.x + r.width / 2;
      const y = r.y + r.height / 2;
      return {
        x,
        y,
        reached: !!document.elementFromPoint(x, y)?.closest('.sp-window-cmd'),
      };
    });
    expect(tap.reached).toBe(true);
    expect((await readBuild(page)).states[0]).not.toBe('skipped');

    await page.touchscreen.tap(tap.x, tap.y);
    await frames(page, 2);
    expect((await readBuild(page)).states[0]).toBe('skipped');
    await expect(page.locator('.sp-window[data-section="top"]')).toHaveCount(0);
    await expect(page.locator('.sp-boot')).toHaveCount(0);
  });
});

interface Geometry {
  sectionTop: number;
  sectionBottom: number;
  chromeTop: number;
  chromeBottom: number;
  bars: { name: string; top: number; bottom: number }[];
}

const geometry = (page: Page): Promise<Geometry> =>
  page.evaluate(() => {
    const section = (
      document.getElementById('projects') as Element
    ).getBoundingClientRect();
    const win = document.querySelector(
      '.sp-window[data-section="projects"]',
    ) as Element;
    const chrome = (
      win.querySelector('.sp-window-chrome') as Element
    ).getBoundingClientRect();
    const bars = ['.sp-window-bar', '.sp-window-cmd']
      .map((selector) => win.querySelector(selector) as Element)
      .filter((el) => getComputedStyle(el).display !== 'none')
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { name: el.className, top: r.top, bottom: r.bottom };
      });
    return {
      sectionTop: section.top,
      sectionBottom: section.bottom,
      chromeTop: chrome.top,
      chromeBottom: chrome.bottom,
      bars,
    };
  });

async function scrollAndRead(page: Page, y: number): Promise<Geometry> {
  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: 'instant' }),
    y,
  );
  await page.clock.runFor(16);
  await sleep(10);
  return geometry(page);
}

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 375, height: 812 },
]) {
  test(`keeps the title bar and command bar of a section taller than the viewport under the nav until its end at ${viewport.width}x${viewport.height}`, async ({
    browser,
  }) => {
    test.setTimeout(180_000);
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    await startPaused(page);
    await skipHero(page);
    await scrollSectionIntoBuild(page, 'projects');
    await untilFrames(
      page,
      (b) => b.states[2] === 'building',
      'projects building',
    );

    const start = await page.evaluate(() => {
      const r = (
        document.getElementById('projects') as Element
      ).getBoundingClientRect();
      return {
        docTop: r.top + window.scrollY,
        height: r.height,
        viewport: window.innerHeight,
      };
    });
    expect(
      start.height,
      'Projects is taller than the viewport',
    ).toBeGreaterThan(start.viewport);
    const natural = await geometry(page);
    const chromeHeight = natural.chromeBottom - natural.chromeTop;
    expect(chromeHeight).toBeGreaterThan(0);

    // Before the section reaches the nav the bars sit at the section's own top.
    const early = await scrollAndRead(page, start.docTop - 300);
    expect(Math.abs(early.chromeTop - early.sectionTop)).toBeLessThanOrEqual(1);

    // Through the section the bars stay stuck under the nav, each one of them.
    for (const [label, y] of [
      ['just past the nav', start.docTop + 100],
      ['the middle', start.docTop + start.height / 2],
      [
        'just before the end',
        start.docTop + start.height - (NAV + chromeHeight + 60),
      ],
    ] as const) {
      const g = await scrollAndRead(page, y);
      expect(
        Math.abs(g.chromeTop - NAV),
        `${label}: bars under the nav`,
      ).toBeLessThanOrEqual(1);
      expect(g.bars.length, `${label}: bars shown`).toBeGreaterThan(0);
      for (const bar of g.bars) {
        expect(bar.top, `${label}: ${bar.name}`).toBeGreaterThanOrEqual(
          NAV - 1,
        );
      }
    }

    // At the section's end the bars leave with it: they never hang below its bottom.
    const end = await scrollAndRead(
      page,
      start.docTop + start.height - (NAV + chromeHeight / 2),
    );
    expect(end.chromeTop).toBeLessThan(NAV - 1);
    expect(Math.abs(end.chromeBottom - end.sectionBottom)).toBeLessThanOrEqual(
      1,
    );
    await ctx.close();
  });
}
