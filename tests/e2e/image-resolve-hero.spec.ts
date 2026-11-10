// PRPs/prds/stage-4-sections-effects.prd.md AC-1 Hero photo from ASCII (skeleton, then ASCII in the overlay vanishing in an
// ordered dither while the photo rises from a non-zero opacity to 1, nothing left behind), AC-9 (the ASCII is an
// aria-hidden overlay piece outside <main>; only opacity, clip-path and transform change; the photo box never moves),
// AC-10 Instant paths (skip, run all, focus, infinity, width change, reduced motion, saved infinity, no JavaScript),
// AC-11 Mobile (same sequence at 375x812, the ASCII fits the photo box, no horizontal scroll)
// (phase 2 plan: AC-A1, AC-A2, AC-A4, AC-A5)
// The hero photo step runs 1600-2600 ms of the hero clock: selection 1600-1750, skeleton to 1900, then the 700 ms
// dissolve 1900-2600. Sampled moments keep at least the ~52 ms late / ~16 ms early sampling error (see effects-hero.spec.ts)
// away from a phase boundary: 1800 (skeleton), 2000 (early dissolve), 2250 (mid dissolve), 2750 (after the step).
import { expect, test, type Page } from '@playwright/test';
import { DESKTOP_VIEWPORT, runUntil } from './support/runtime';
import { startPaused } from './support/layer';
import { advanceTo } from './support/effects';
import {
  clickIn,
  frames,
  isFinal,
  readBuild,
  untilFrames,
} from './support/controls';

test.setTimeout(120_000);

// The standard 4x4 dispersed-dot threshold map, written out independently of the source.
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

interface PhotoFrame {
  asciiCount: number;
  asciiText: string;
  asciiOpacity: string;
  asciiAriaHidden: string | null;
  asciiInLayer: boolean;
  asciiInMain: boolean;
  asciiRect: number[] | null;
  blurCount: number;
  full: string;
  photoRect: number[];
  photoFx: string | null;
  imgInlineOpacity: string;
  imgInlineClip: string;
  imgInlineNames: string[];
  imgOpacity: string;
  overflow: number;
  filterOrMask: number;
}

const photoFrame = (page: Page): Promise<PhotoFrame> =>
  page.evaluate(() => {
    const photo = document.querySelector(
      '#top [data-build-target="photo"]',
    ) as HTMLElement;
    const img = photo.querySelector('img') as HTMLElement;
    const ascii = document.querySelector('.sp-ascii') as HTMLElement | null;
    const rect = (e: Element) => {
      const r = e.getBoundingClientRect();
      return [r.x + scrollX, r.y + scrollY, r.width, r.height];
    };
    const names: string[] = [];
    for (let k = 0; k < img.style.length; k++) names.push(img.style.item(k));
    return {
      asciiCount: document.querySelectorAll('.sp-ascii').length,
      asciiText: ascii?.textContent ?? '',
      asciiOpacity: ascii?.style.opacity ?? '',
      asciiAriaHidden: ascii?.getAttribute('aria-hidden') ?? null,
      asciiInLayer: !!ascii?.closest('[data-build-layer] [aria-hidden="true"]'),
      asciiInMain: !!ascii && !!document.querySelector('main')?.contains(ascii),
      asciiRect: ascii ? rect(ascii) : null,
      blurCount: document.querySelectorAll('.sp-blur-cover').length,
      full: photo.getAttribute('data-build-ascii') ?? '',
      photoRect: rect(photo),
      photoFx: photo.getAttribute('data-build-fx'),
      imgInlineOpacity: img.style.opacity,
      imgInlineClip: img.style.clipPath,
      imgInlineNames: names,
      imgOpacity: getComputedStyle(img).opacity,
      overflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      filterOrMask: [...document.querySelectorAll('main *')].filter((e) => {
        const s = (e as HTMLElement).style;
        return s.filter || s.maskImage || s.getPropertyValue('mask');
      }).length,
    };
  });

const nonSpace = (text: string): number =>
  [...text].filter((c) => c !== ' ' && c !== '\n').length;

// Cells that were a character in the source ASCII and are a space now.
const removed = (full: string, now: string): number =>
  [...now].filter((c, i) => c === ' ' && full[i] !== ' ' && full[i] !== '\n')
    .length;

// True when `now` is the source ASCII with exactly the cells whose Bayer value is below some step k blanked.
const isBayerDissolve = (full: string, now: string): boolean => {
  if (now.length !== full.length) return false;
  const rows = full.split('\n');
  for (let k = 0; k <= 16; k++) {
    const expected = rows
      .map((row, y) =>
        [...row]
          .map((c, x) =>
            c !== ' ' && (BAYER[y % 4]?.[x % 4] ?? 99) < k ? ' ' : c,
          )
          .join(''),
      )
      .join('\n');
    if (expected === now) return true;
  }
  return false;
};

async function expectSequence(page: Page, label: string): Promise<void> {
  const duration = await startPaused(page);

  // Skeleton phase: the real photo is still held back and no ASCII is visible yet.
  await advanceTo(page, 'top', duration, 1800);
  const skeleton = await photoFrame(page);
  expect(skeleton.photoFx, `${label}: photo held while skeleton`).toBe(
    'hidden',
  );
  expect(
    skeleton.asciiCount === 0 || skeleton.asciiOpacity === '0',
    `${label}: no visible ASCII yet`,
  ).toBe(true);
  expect(skeleton.overflow).toBeLessThanOrEqual(0);

  // Early dissolve: ASCII in the aria-hidden overlay, photo live above 0 and below 1.
  await advanceTo(page, 'top', duration, 2000);
  const early = await photoFrame(page);
  expect(early.asciiCount, `${label}: one ASCII piece`).toBe(1);
  expect(early.asciiOpacity).toBe('1');
  expect(early.asciiAriaHidden).toBe('true');
  expect(
    early.asciiInLayer,
    `${label}: ASCII inside the aria-hidden layer`,
  ).toBe(true);
  expect(early.asciiInMain).toBe(false);
  expect(early.photoFx).toBeNull();
  expect(Number(early.imgOpacity)).toBeGreaterThan(0);
  expect(Number(early.imgOpacity)).toBeLessThan(1);
  expect(early.full.length).toBeGreaterThan(0);
  expect(isBayerDissolve(early.full, early.asciiText), `${label}: dither`).toBe(
    true,
  );
  expect(nonSpace(early.asciiText)).toBeGreaterThan(0);
  expect(early.overflow).toBeLessThanOrEqual(0);

  // Mid dissolve: more of the ASCII gone, still in the same order, photo more opaque, boxes unchanged.
  await advanceTo(page, 'top', duration, 2250);
  const mid = await photoFrame(page);
  expect(mid.asciiCount).toBe(1);
  expect(isBayerDissolve(mid.full, mid.asciiText), `${label}: dither`).toBe(
    true,
  );
  expect(removed(mid.full, mid.asciiText)).toBeGreaterThan(
    removed(early.full, early.asciiText),
  );
  expect(nonSpace(mid.asciiText)).toBeGreaterThan(0);
  expect(nonSpace(mid.asciiText)).toBeLessThan(nonSpace(mid.full));
  expect(Number(mid.imgOpacity)).toBeGreaterThan(Number(early.imgOpacity));
  expect(Number(mid.imgOpacity)).toBeLessThan(1);
  expect(mid.overflow).toBeLessThanOrEqual(0);
  expect(mid.filterOrMask, 'no filter or mask on page elements').toBe(0);
  mid.photoRect.forEach((v, i) =>
    expect(Math.abs(v - (early.photoRect[i] ?? Infinity))).toBeLessThanOrEqual(
      0.5,
    ),
  );
  // The ASCII fills the photo's box.
  mid.asciiRect?.forEach((v, i) =>
    expect(
      Math.abs(v - (mid.photoRect[i] ?? Infinity)),
      `${label}: ASCII box coordinate ${i}`,
    ).toBeLessThanOrEqual(1),
  );
  expect(mid.asciiRect).not.toBeNull();

  // Only opacity may be written inline on the photo (plus what the static page already has).
  const midNames = mid.imgInlineNames;

  // After the step: no ASCII, the photo fully opaque with no clip-path, its box as before.
  await advanceTo(page, 'top', duration, 2750);
  const after = await photoFrame(page);
  expect(after.asciiCount).toBe(0);
  expect(after.blurCount).toBe(0);
  expect(after.photoFx).toBeNull();
  expect(after.imgOpacity).toBe('1');
  expect(after.imgInlineOpacity).toBe('');
  expect(after.imgInlineClip).toBe('');
  expect(after.overflow).toBeLessThanOrEqual(0);
  for (const name of midNames) {
    expect(
      ['opacity', ...after.imgInlineNames],
      `${label}: inline property ${name} written on the photo`,
    ).toContain(name);
  }
  after.photoRect.forEach((v, i) =>
    expect(Math.abs(v - (mid.photoRect[i] ?? Infinity))).toBeLessThanOrEqual(
      0.5,
    ),
  );
}

test.describe('on desktop', () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test('goes from skeleton to an ASCII that vanishes in Bayer order while the photo rises from above 0 to 1', async ({
    page,
  }) => {
    await expectSequence(page, 'desktop');
    await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
    const done = await photoFrame(page);
    expect(done.asciiCount).toBe(0);
    expect(done.imgOpacity).toBe('1');
    expect(done.imgInlineOpacity).toBe('');
  });

  test('animates only opacity, clip-path and transform while the photo resolves', async ({
    page,
  }) => {
    const duration = await startPaused(page);
    await advanceTo(page, 'top', duration, 2250);
    const props = await page.evaluate(() => {
      const found = new Set<string>();
      for (const a of document.getAnimations()) {
        const target = (a.effect as KeyframeEffect | null)?.target ?? null;
        if (!target) continue;
        const inScope =
          target.closest('[data-build-layer]') !== null ||
          !!document.querySelector('main')?.contains(target);
        if (!inScope) continue;
        for (const kf of (a.effect as KeyframeEffect).getKeyframes()) {
          for (const key of Object.keys(kf)) found.add(key);
        }
      }
      return [...found];
    });
    const allowed = new Set([
      'opacity',
      'transform',
      'clip-path',
      'offset',
      'easing',
      'composite',
      'computedOffset',
    ]);
    expect(props.filter((p) => !allowed.has(p))).toEqual([]);
  });
});

test.describe('instant paths leave no ASCII behind', () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

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
      'moving focus into the page',
      (page) =>
        page.evaluate(() =>
          (
            document.querySelector('#top .sp-hero-actions a') as HTMLElement
          ).focus(),
        ),
    ],
    [
      'a viewport width change',
      (page) => page.setViewportSize({ width: 1024, height: 800 }),
    ],
  ];

  for (const [name, act] of actions) {
    test(`${name} during the dissolve`, async ({ page }) => {
      const duration = await startPaused(page);
      await advanceTo(page, 'top', duration, 2150);
      const before = await photoFrame(page);
      expect(before.asciiCount, 'the dissolve is in progress').toBe(1);
      expect(isFinal((await readBuild(page)).states[0])).toBe(false);

      await act(page);
      await frames(page, 4);

      expect(isFinal((await readBuild(page)).states[0])).toBe(true);
      const f = await photoFrame(page);
      expect(f.asciiCount).toBe(0);
      expect(f.blurCount).toBe(0);
      expect(f.photoFx).toBeNull();
      expect(f.imgInlineOpacity).toBe('');
      expect(f.imgInlineClip).toBe('');
      expect(f.imgOpacity).toBe('1');
    });
  }

  test('Esc during the first selection frames also leaves the photo untouched', async ({
    page,
  }) => {
    await startPaused(page);
    await untilFrames(page, (b) => b.states[0] === 'building', 'hero building');
    await page.keyboard.press('Escape');
    await frames(page, 3);
    const f = await photoFrame(page);
    expect(f.asciiCount).toBe(0);
    expect(f.imgOpacity).toBe('1');
    expect(f.photoFx).toBeNull();
  });
});

test.describe('no ASCII ever appears when the build does not animate', () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  const expectUntouchedPhoto = async (page: Page) => {
    const f = await photoFrame(page);
    expect(f.asciiCount).toBe(0);
    expect(f.blurCount).toBe(0);
    expect(f.photoFx).toBeNull();
    expect(f.imgOpacity).toBe('1');
  };

  test('under reduced motion, with the photo visible at DOMContentLoaded', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expectUntouchedPhoto(page);
    await page.waitForLoadState('load');
    await expectUntouchedPhoto(page);
    await ctx.close();
  });

  test('with a saved infinity speed, with the photo visible at DOMContentLoaded', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
    await ctx.addInitScript(() => localStorage.setItem('sp-speed', 'inf'));
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expectUntouchedPhoto(page);
    await page.waitForLoadState('load');
    await expectUntouchedPhoto(page);
    await ctx.close();
  });

  test('without JavaScript', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      javaScriptEnabled: false,
    });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expectUntouchedPhoto(page);
    await ctx.close();
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('goes through the same sequence with the ASCII inside the photo box and no horizontal scroll', async ({
    page,
  }) => {
    await expectSequence(page, 'mobile');
    await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
    const done = await photoFrame(page);
    expect(done.asciiCount).toBe(0);
    expect(done.overflow).toBeLessThanOrEqual(0);
  });
});
