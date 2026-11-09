// PRPs/prds/stage-3-runtime.prd.md AC-4 no box, document height or layout shift changes while elements are created,
// AC-18 the text and accessibility tree of <main> equal the no-JS page at every moment
// (phase 3 plan: AC-A3, AC-A4)
import { expect, test } from '@playwright/test';
import { DESKTOP_VIEWPORT, runUntil, sleep } from './support/runtime';
import { startPaused } from './support/layer';
import {
  advanceTo,
  boxes,
  expectSameBoxes,
  layoutShift,
  layoutShiftInit,
  mainText,
  mainTree,
  noScriptPage,
  readyPage,
  scrollSectionIntoBuild,
  timelinesOnPage,
} from './support/effects';

test.use({ viewport: DESKTOP_VIEWPORT });

for (const viewport of [DESKTOP_VIEWPORT, { width: 375, height: 812 }]) {
  test(`never adds horizontal scroll while the hero elements are created at ${viewport.width}px`, async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    const duration = await startPaused(page);
    for (const ms of [1340, 1600, 1800, 2150, 2450]) {
      await advanceTo(page, 'top', duration, ms);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, `hero t=${ms}`).toBeLessThanOrEqual(0);
    }
    await ctx.close();
  });
}

test('keeps every box, the document height and the text of the ready page while elements are created, and shifts layout by at most 0.01', async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const ready = await readyPage(browser);
  const bare = await noScriptPage(browser);
  expect(ready.text).toBe(bare.text);

  const ctx = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
  await ctx.addInitScript(layoutShiftInit);
  const page = await ctx.newPage();
  const duration = await startPaused(page);
  const tls = await timelinesOnPage(page);
  const main = page.locator('main');

  const heroMoments: [number, string][] = [
    [1340, 'hero: headline selected'],
    [1500, 'hero: title typing'],
    [1700, 'hero: decode and skeleton'],
    [1950, 'hero: intro bars'],
    [2300, 'hero: intro resolving'],
    [2450, 'hero: links pop'],
  ];
  for (const [ms, label] of heroMoments) {
    await advanceTo(page, 'top', duration, ms);
    expectSameBoxes(await boxes(page), ready.boxes, label);
    expect(await mainTree(main), `${label}: accessibility tree`).toBe(
      bare.tree,
    );
    expect(await mainText(page), `${label}: text`).toBe(bare.text);
  }
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
  expectSameBoxes(await boxes(page), ready.boxes, 'hero done');

  await scrollSectionIntoBuild(page, 'projects');
  const cards = (tls.projects?.steps ?? []).filter((s) =>
    s.call.startsWith('projects.card('),
  );
  const [first, second] = cards;
  const overlap = ((second?.start ?? 0) + (first?.end ?? 0)) / 2;
  await advanceTo(page, 'projects', tls.projects?.duration ?? 0, overlap);
  expectSameBoxes(
    await boxes(page),
    ready.boxes,
    'projects: two cards overlap',
  );
  expect(await mainTree(main), 'projects: accessibility tree').toBe(bare.tree);
  await runUntil(page, (s) => s.states[2] === 'done', 90000, 'projects done');
  expectSameBoxes(await boxes(page), ready.boxes, 'after projects');

  await scrollSectionIntoBuild(page, 'stack');
  const stackSteps = tls.stack?.steps ?? [];
  const midStagger = (stackSteps[3]?.start ?? 0) + 200;
  await advanceTo(page, 'stack', tls.stack?.duration ?? 0, midStagger);
  expectSameBoxes(await boxes(page), ready.boxes, 'stack: stagger');
  expect(await mainTree(main), 'stack: accessibility tree').toBe(bare.tree);
  await runUntil(page, (s) => s.states[3] === 'done', 90000, 'stack done');
  expectSameBoxes(await boxes(page), ready.boxes, 'after stack');

  await sleep(50);
  expect(await layoutShift(page)).toBeLessThanOrEqual(0.01);
  await ctx.close();
});
