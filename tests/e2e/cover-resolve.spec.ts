// PRPs/prds/stage-4-sections-effects.prd.md AC-3 Covers resolve from blur (a fixture cover wired through the real
// runtime: an inlined blurred copy in the overlay gives way to the sharp cover within the card's step, no animated
// filter, nothing left behind; a card without a cover keeps the dot-grid placeholder with no blur phase),
// AC-9 (the blurred piece is an aria-hidden overlay piece outside <main>), AC-10 Instant paths (skip, run all, focus,
// infinity, width change mid cover resolve; reduced motion, saved infinity and no JavaScript never show a blurred piece)
// (phase 5 plan: Notes 4 and 6, the cover-resolve spec named in docs/context/testing.md)
// The fixture cover is served by route interception (./support/cover-fixture), never from src/content.
// A card step lasts 300 ms: selection to 150, skeleton to 190, then the cover resolves 190-270 while the title types.
// The mid-cover moment is found by observation (the blurred piece at an opacity strictly between 0 and 1) with 8 ms
// slices, because that window is only 80 ms wide.
import { expect, test, type Page } from '@playwright/test';
import { DESKTOP_VIEWPORT, runUntil, sleep } from './support/runtime';
import { startPaused } from './support/layer';
import { scrollSectionIntoBuild } from './support/effects';
import { clickIn, frames, readBuild } from './support/controls';
import { FIXTURE_SLUG, useCoverFixture } from './support/cover-fixture';

test.use({ viewport: DESKTOP_VIEWPORT });
test.setTimeout(180_000);

interface CoverFrame {
  blurCount: number;
  blurOpacity: number | null;
  blurInOverlay: boolean;
  blurInMain: boolean;
  blurSrcInlined: boolean;
  blurFilter: string[];
  blurRect: number[] | null;
  frameRect: number[];
  imgOpacity: string;
  imgInlineOpacity: string;
  placeholders: number;
  placeholderStyled: number;
  animatedFilter: boolean;
}

const coverFrame = (page: Page, slug = FIXTURE_SLUG): Promise<CoverFrame> =>
  page.evaluate((slugName) => {
    const cell = document.querySelector(
      `[data-build-target="card-${slugName}"]`,
    ) as HTMLElement;
    const frame = cell.querySelector('.sp-card-cover') as HTMLElement;
    const img = frame.querySelector('img');
    const blur = document.querySelector('.sp-blur-cover') as HTMLElement | null;
    const blurImg = blur?.querySelector('img') ?? null;
    const rect = (e: Element) => {
      const r = e.getBoundingClientRect();
      return [r.x + scrollX, r.y + scrollY, r.width, r.height];
    };
    return {
      blurCount: document.querySelectorAll('.sp-blur-cover').length,
      blurOpacity: blur ? Number(blur.style.opacity || '1') : null,
      blurInOverlay:
        !!blur &&
        !!blur.closest('[data-build-fx-layer][aria-hidden="true"]') &&
        blur.getAttribute('aria-hidden') === 'true',
      blurInMain: !!blur && !!document.querySelector('main')?.contains(blur),
      blurSrcInlined: !!blurImg && blurImg.src.startsWith('data:'),
      blurFilter: blur
        ? [getComputedStyle(blur).filter, getComputedStyle(blurImg!).filter]
        : [],
      blurRect: blur ? rect(blur) : null,
      frameRect: rect(frame),
      imgOpacity: img ? getComputedStyle(img).opacity : '',
      imgInlineOpacity: img?.style.opacity ?? '',
      placeholders: document.querySelectorAll('.sp-cover-ph').length,
      placeholderStyled: [...document.querySelectorAll('.sp-cover-ph')].filter(
        (e) => e.getAttribute('style'),
      ).length,
      animatedFilter: document
        .getAnimations()
        .some((a) =>
          (a.effect as KeyframeEffect | null)
            ?.getKeyframes()
            .some((k) => 'filter' in k),
        ),
    };
  }, slug);

// Builds the hero, scrolls Projects into its trigger and steps the clock until the first card's blurred piece
// is half-way through its resolve.
async function reachMidCover(page: Page): Promise<CoverFrame> {
  await startPaused(page);
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
  await scrollSectionIntoBuild(page, 'projects');
  for (let i = 0; i < 1500; i++) {
    await page.clock.runFor(8);
    await sleep(3);
    const f = await coverFrame(page);
    if (
      f.blurCount === 1 &&
      f.blurOpacity !== null &&
      f.blurOpacity > 0.25 &&
      f.blurOpacity < 0.75
    ) {
      return f;
    }
  }
  throw new Error('timed out waiting for the mid cover resolve');
}

test.describe('a card with a fixture cover', () => {
  test.beforeEach(async ({ page }) => {
    await useCoverFixture(page);
  });

  test('resolves from an inlined blurred copy in the overlay while the sharp cover rises, then leaves nothing behind', async ({
    page,
  }) => {
    const mid = await reachMidCover(page);
    expect(mid.blurInOverlay, 'blurred piece in the aria-hidden overlay').toBe(
      true,
    );
    expect(mid.blurInMain, 'never inside <main>').toBe(false);
    expect(mid.blurSrcInlined, 'the blurred copy is a data URI').toBe(true);
    // It covers the cover's box.
    mid.blurRect?.forEach((v, i) =>
      expect(
        Math.abs(v - (mid.frameRect[i] ?? Infinity)),
        `blurred piece coordinate ${i}`,
      ).toBeLessThanOrEqual(1),
    );
    // The sharp cover rises as the blurred one fades; no filter is animated or applied.
    const sharp = Number(mid.imgOpacity);
    expect(sharp).toBeGreaterThan(0);
    expect(sharp).toBeLessThan(1);
    expect((mid.blurOpacity ?? 0) + sharp).toBeCloseTo(1, 1);
    expect(mid.blurFilter).toEqual(['none', 'none']);
    expect(mid.animatedFilter).toBe(false);

    // Later in the same step the blurred copy is fainter and the sharp cover stronger.
    let later = mid;
    for (let i = 0; i < 40 && later.blurCount === 1; i++) {
      await page.clock.runFor(8);
      await sleep(3);
      const f = await coverFrame(page);
      if (f.blurCount === 0) break;
      expect(f.blurOpacity ?? 1).toBeLessThanOrEqual(later.blurOpacity ?? 1);
      expect(Number(f.imgOpacity)).toBeGreaterThanOrEqual(
        Number(later.imgOpacity),
      );
      later = f;
    }

    // At the end of the step no piece remains, the cover is opaque and its box is the page's own.
    await runUntil(page, (s) => s.states[2] === 'done', 60000, 'projects done');
    const done = await coverFrame(page);
    expect(done.blurCount).toBe(0);
    expect(done.imgOpacity).toBe('1');
    expect(done.imgInlineOpacity).toBe('');
    done.frameRect.forEach((v, i) =>
      expect(
        Math.abs(v - (mid.frameRect[i] ?? Infinity)),
        `cover box coordinate ${i}`,
      ).toBeLessThanOrEqual(0.5),
    );
  });

  const actions: [string, (page: Page) => Promise<void>][] = [
    ['Esc', (page) => page.keyboard.press('Escape')],
    ['Shift + Esc', (page) => page.keyboard.press('Shift+Escape')],
    [
      'the dock skip button',
      (page) => clickIn(page, '[data-dock-action="skip"]'),
    ],
    [
      'a click on the window bar',
      async (page) => {
        const at = await page.evaluate(() => {
          const r = (
            document.querySelector('.sp-window .sp-window-bar') as Element
          ).getBoundingClientRect();
          return [r.x + r.width / 2, r.y + r.height / 2];
        });
        await page.mouse.click(at[0] as number, at[1] as number);
      },
    ],
    [
      'switching to infinity',
      async (page) => {
        await clickIn(page, '[data-dock-action="speed"]');
        await frames(page, 2);
        await clickIn(page, '[data-dock-action="speed"]');
      },
    ],
    [
      'moving focus into a later section',
      (page) =>
        page.evaluate(() =>
          (document.querySelector('#contact a') as HTMLElement).focus(),
        ),
    ],
    [
      'a viewport width change',
      (page) => page.setViewportSize({ width: 1024, height: 800 }),
    ],
  ];

  for (const [name, act] of actions) {
    test(`${name} during the cover resolve leaves no blurred piece and an opaque cover`, async ({
      page,
    }) => {
      const mid = await reachMidCover(page);
      expect(mid.blurCount, 'the resolve is in progress').toBe(1);

      await act(page);
      await frames(page, 4);

      const f = await coverFrame(page);
      expect(f.blurCount).toBe(0);
      expect(f.imgOpacity).toBe('1');
      expect(f.imgInlineOpacity).toBe('');
      expect(
        await page.evaluate(
          () => document.querySelectorAll('.sp-ascii').length,
        ),
      ).toBe(0);
      // The build never returns to the card: still nothing a few frames later.
      await frames(page, 6);
      expect((await coverFrame(page)).blurCount).toBe(0);
      expect((await coverFrame(page)).imgOpacity).toBe('1');
    });
  }
});

test.describe('a build that does not animate never shows the blurred piece', () => {
  const expectResolved = async (page: Page) => {
    const f = await coverFrame(page);
    expect(f.blurCount).toBe(0);
    expect(f.imgOpacity).toBe('1');
    expect(f.imgInlineOpacity).toBe('');
  };

  test('under reduced motion, with the cover opaque at DOMContentLoaded', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      reducedMotion: 'reduce',
    });
    await useCoverFixture(ctx);
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expectResolved(page);
    await page.waitForLoadState('load');
    await expectResolved(page);
    await ctx.close();
  });

  test('with a saved infinity speed, with the cover opaque at DOMContentLoaded', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
    await ctx.addInitScript(() => localStorage.setItem('sp-speed', 'inf'));
    await useCoverFixture(ctx);
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expectResolved(page);
    await page.waitForLoadState('load');
    await expectResolved(page);
    await ctx.close();
  });

  test('without JavaScript', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      javaScriptEnabled: false,
    });
    await useCoverFixture(ctx);
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expectResolved(page);
    await ctx.close();
  });
});

test.describe('a card without a cover (the committed content)', () => {
  test('keeps its dot-grid placeholder untouched, with no blur phase, while Projects builds', async ({
    page,
  }) => {
    await startPaused(page);
    await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
    await scrollSectionIntoBuild(page, 'projects');

    const cards = await page.evaluate(
      () => document.querySelectorAll('[data-build-target^="card-"]').length,
    );
    expect(cards).toBe(4);
    let sawCards = false;
    for (let i = 0; i < 700; i++) {
      await page.clock.runFor(10);
      await sleep(3);
      const f = await coverFrame(page);
      const state = (await readBuild(page)).states[2];
      if (state === 'building') sawCards = true;
      expect(f.blurCount, 'no blurred piece without a cover').toBe(0);
      expect(f.placeholders, 'the dot-grid placeholder stays').toBe(4);
      expect(f.placeholderStyled, 'the placeholder is never restyled').toBe(0);
      if (state === 'done') break;
    }
    expect(sawCards, 'Projects was observed building').toBe(true);
    expect((await readBuild(page)).states[2]).toBe('done');
  });
});
