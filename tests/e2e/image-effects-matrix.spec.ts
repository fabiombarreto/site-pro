// PRPs/prds/stage-4-sections-effects.prd.md AC-9 Layout and accessibility hold during the new effects (every box and the
// document height equal the no-JS values within 0.5 px, summed layout shift <= 0.01, axe 0 violations with the WCAG 2.0,
// 2.1 and 2.2 A/AA tags, the accessibility tree and text of <main> equal the no-JS page, ASCII and blurred pieces inside
// the aria-hidden overlay, only opacity and clip-path written on page elements) mid photo dissolve, mid card cover resolve
// (a fixture cover) and after the build, in Midnight and Daylight at 1280x800 and 375x812;
// AC-11 Mobile (scrollWidth equals clientWidth at every sampled moment)
// (phase 5 plan: Notes 5, the image-effects-matrix spec named in docs/context/testing.md)
// The reference is the no-JS page of the same fixture, so the cover's own box is part of what must not move.
// Each cell is its own page: the moment is reached on a fresh paused clock, read, then the build is frozen (a hidden tab
// pauses it, PRD AC-16) so axe sees the real DOM while Playwright's timers run for the tool.
import { expect, test, type Browser, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { AXE_TAGS, expectNoAxeViolations } from './support/home';
import { runUntil, sleep } from './support/runtime';
import { startPaused } from './support/layer';
import {
  advanceTo,
  boxes,
  expectSameBoxes,
  freezeBuild,
  layoutShift,
  layoutShiftInit,
  mainText,
  mainTree,
  scrollSectionIntoBuild,
  type Boxes,
} from './support/effects';
import { frames } from './support/controls';
import { noScriptReference, useCoverFixture } from './support/cover-fixture';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 375, height: 812 },
];

const inlineProps = (page: Page): Promise<string[]> =>
  page.evaluate(() => {
    const names = new Set<string>();
    for (const el of document.querySelectorAll('main, main *')) {
      const style = (el as HTMLElement).style;
      for (let k = 0; k < style.length; k++) names.add(style.item(k));
    }
    return [...names];
  });

interface Reference {
  boxes: Boxes;
  tree: string;
  text: string;
  inline: string[];
}

async function reference(
  browser: Browser,
  viewport: { width: number; height: number },
): Promise<Reference> {
  const page = await noScriptReference(browser, viewport, { cover: true });
  const result = {
    boxes: await boxes(page),
    tree: await mainTree(page.locator('main')),
    text: await mainText(page),
    inline: await inlineProps(page),
  };
  await page.context().close();
  return result;
}

const pieces = (page: Page) =>
  page.evaluate(() => {
    const all = [...document.querySelectorAll('.sp-ascii, .sp-blur-cover')];
    return {
      ascii: document.querySelectorAll('.sp-ascii').length,
      blur: document.querySelectorAll('.sp-blur-cover').length,
      allInOverlay: all.every(
        (e) => !!e.closest('[data-build-fx-layer][aria-hidden="true"]'),
      ),
      anyInMain: all.some((e) => !!document.querySelector('main')?.contains(e)),
    };
  });

type Reach = (page: Page, duration: number) => Promise<void>;

const MOMENTS: {
  name: string;
  ascii: number;
  blur: number;
  reach: Reach;
  excusedOverlayLabel?: boolean;
}[] = [
  {
    name: 'mid photo dissolve',
    ascii: 1,
    blur: 0,
    reach: async (page, duration) => {
      await advanceTo(page, 'top', duration, 2250);
    },
  },
  {
    name: 'mid cover resolve',
    ascii: 0,
    blur: 1,
    reach: async (page) => {
      await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
      await scrollSectionIntoBuild(page, 'projects');
      for (let i = 0; i < 1500; i++) {
        await page.clock.runFor(8);
        await sleep(3);
        // Mid resolve: the blurred cover is between a quarter and three quarters opaque.
        const opacity = await page.evaluate(() => {
          const piece = document.querySelector(
            '.sp-blur-cover',
          ) as HTMLElement | null;
          return piece ? Number(piece.style.opacity || '1') : null;
        });
        if (opacity !== null && opacity > 0.25 && opacity < 0.75) return;
      }
      throw new Error('timed out waiting for the mid cover resolve');
    },
    // The Projects heading's selection label fades during the whole cover resolve (the first card is the only one with
    // a cover). It is a decorative, transient label inside the aria-hidden build layer (two registers rule: the build
    // layer is aria-hidden, the page itself must be axe-clean), so axe leaves out that one node and nothing else.
    excusedOverlayLabel: true,
  },
  {
    name: 'after the build',
    ascii: 0,
    blur: 0,
    reach: async (page) => {
      await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
      await page.keyboard.press('Shift+Escape');
      await frames(page, 3);
      await expect(page.locator('.sp-dock')).toHaveAttribute(
        'data-state',
        'done',
      );
    },
  },
];

for (const viewport of VIEWPORTS) {
  for (const theme of ['midnight', 'daylight'] as const) {
    test.describe(`${viewport.name} ${viewport.width}x${viewport.height}, ${theme} theme`, () => {
      test.use({
        viewport: { width: viewport.width, height: viewport.height },
      });

      test.beforeEach(async ({ page }) => {
        await page.addInitScript((value) => {
          if (value === 'daylight') localStorage.setItem('sp-theme', value);
        }, theme);
        await page.addInitScript(layoutShiftInit);
        await useCoverFixture(page);
      });

      for (const moment of MOMENTS) {
        test(`keeps the layout, the tree and axe clean at ${moment.name}`, async ({
          page,
          browser,
        }) => {
          test.setTimeout(240_000);
          const ref = await reference(browser, viewport);
          const duration = await startPaused(page);
          await moment.reach(page, duration);
          await expect(page.locator('html')).toHaveAttribute(
            'data-theme',
            theme,
          );

          // The moment is the one asked for.
          const p = await pieces(page);
          expect(p.ascii, 'ASCII pieces').toBe(moment.ascii);
          expect(p.blur, 'blurred pieces').toBe(moment.blur);
          // Pieces live only in the aria-hidden overlay, never in <main>.
          expect(p.allInOverlay).toBe(true);
          expect(p.anyInMain).toBe(false);

          // Every box and the document height equal the no-JS page.
          expectSameBoxes(await boxes(page), ref.boxes, moment.name);
          expect(await mainTree(page.locator('main')), 'main tree').toBe(
            ref.tree,
          );
          expect(await mainText(page), 'main text').toBe(ref.text);

          // Only opacity and clip-path are written inline on page elements.
          const written = (await inlineProps(page)).filter(
            (name) => !ref.inline.includes(name),
          );
          expect(
            written.filter((name) => !['opacity', 'clip-path'].includes(name)),
            'inline properties beyond opacity and clip-path',
          ).toEqual([]);

          // No horizontal scroll at the sampled moment.
          const widths = await page.evaluate(() => [
            document.documentElement.scrollWidth,
            document.documentElement.clientWidth,
          ]);
          expect(widths[0], 'scrollWidth equals clientWidth').toBe(widths[1]);

          await sleep(50);
          expect(
            await layoutShift(page),
            'summed layout shift',
          ).toBeLessThanOrEqual(0.01);

          await freezeBuild(page);
          if (moment.excusedOverlayLabel) {
            // Only the fading selection label is excused, and only while it really sits in the aria-hidden overlay; the
            // cover, the card, the page text and every other rule and node stay checked.
            expect(
              await page.evaluate(() =>
                [
                  ...document.querySelectorAll(
                    '.sp-select[data-state="fading"] .sp-select-label',
                  ),
                ].every(
                  (el) =>
                    !!el.closest('[data-build-fx-layer][aria-hidden="true"]'),
                ),
              ),
              'the excused label is inside the aria-hidden overlay',
            ).toBe(true);
            const results = await new AxeBuilder({ page })
              .withTags(AXE_TAGS)
              .exclude('.sp-select[data-state="fading"] .sp-select-label')
              .analyze();
            expect(
              results.violations.map(
                (v) => `${v.id}: ${v.nodes.length} node(s)`,
              ),
              'axe violations apart from the fading overlay label',
            ).toEqual([]);
          } else {
            await expectNoAxeViolations(page);
          }
        });
      }
    });
  }
}
