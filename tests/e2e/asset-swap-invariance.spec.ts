// PRPs/prds/stage-4-sections-effects.prd.md AC-4 Swapping in the real assets (a new 9:16 photo and a new 16:9 cover, with no
// code change, keep every section, heading, paragraph, button, project card and stack group box, and the document height,
// at 1280x800 and 375x812: the photo box comes from V6, covers from their 16:9 frame)
// (phase 5 plan: Notes 7, the asset-swap-invariance spec named in docs/context/testing.md)
// The committed content has the placeholder photo and no covers, so the swap is simulated on the served HTML (route
// interception, ./support/cover-fixture): the photo <img> gets another intrinsic size and the first card a cover. The page is
// compared before and after the swap, with JavaScript off and after the build (reduced motion). That the pipeline regenerates
// the derivatives, the ASCII and the blur from the new file is covered by the image-* unit specs; that a file with
// metadata fails `pnpm check:privacy` by privacy-image-metadata.test.ts.
import { expect, test, type Browser } from '@playwright/test';
import { boxes, expectSameBoxes, type Boxes } from './support/effects';
import { useFixture, type FixtureOptions } from './support/cover-fixture';

const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 375, height: 812 },
];

const SWAPS: [string, FixtureOptions][] = [
  ['a 1080x1920 photo', { photo: true, photoSize: [1080, 1920] }],
  ['a 540x960 photo', { photo: true, photoSize: [540, 960] }],
  ['a 1920x1080 cover', { cover: true, coverSize: [1920, 1080] }],
  ['a 640x360 cover', { cover: true, coverSize: [640, 360] }],
  [
    'a photo and a cover together',
    { photo: true, cover: true, photoSize: [1080, 1920] },
  ],
];

async function measure(
  browser: Browser,
  viewport: { width: number; height: number },
  mode: 'no-js' | 'built',
  options: FixtureOptions,
): Promise<Boxes> {
  const ctx = await browser.newContext(
    mode === 'no-js'
      ? { viewport, javaScriptEnabled: false }
      : { viewport, reducedMotion: 'reduce' },
  );
  await useFixture(ctx, options);
  const page = await ctx.newPage();
  await page.goto('/', { waitUntil: 'load' });
  if (mode === 'built') {
    await expect(page.locator('html')).toHaveAttribute(
      'data-build-status',
      'done',
    );
  }
  // Images are data URIs with intrinsic sizes: wait until they are decoded so a late decode cannot move a box.
  await page.evaluate(() =>
    Promise.all(
      [...document.images].map((img) => img.decode().catch(() => undefined)),
    ),
  );
  const result = await boxes(page);
  // The no-cover card shows a dot-grid placeholder labelled with the project name; a cover swap legitimately replaces it
  // with the cover image. The text of <main> is therefore compared with the placeholder label excluded on both sides:
  // any other text change, or any box change, still fails.
  result.text = await page.evaluate(() => {
    const clone = document.querySelector('main')?.cloneNode(true) as
      HTMLElement | undefined;
    clone?.querySelectorAll('.sp-cover-ph').forEach((el) => el.remove());
    return (clone?.textContent ?? '').replace(/\s+/g, ' ').trim();
  });
  await ctx.close();
  return result;
}

for (const viewport of VIEWPORTS) {
  for (const mode of ['no-js', 'built'] as const) {
    test.describe(`${viewport.width}x${viewport.height}, ${mode} page`, () => {
      for (const [label, options] of SWAPS) {
        test(`keeps every box and the document height when ${label} is swapped in`, async ({
          browser,
        }) => {
          const before = await measure(browser, viewport, mode, {});
          expect(before.boxes.length).toBeGreaterThan(20);
          const after = await measure(browser, viewport, mode, options);
          expectSameBoxes(after, before, label);
        });
      }
    });
  }
}
