// PRPs/prds/stage-3-runtime.prd.md AC-3 Scroll hint (pulse after 4 s idle, stops at the next scroll),
// AC-17 Done, collapsed dock and Replay (done text, collapse after about 4 s, the expand button, the footer summary in
// its reserved slot, Replay from the dock and from the footer) (phase 4 plan: AC-A4, AC-A5, AC-A10)
// Idle moments are sampled 500 ms or more away from their 4000 ms thresholds (the idle timer counts frame deltas capped
// at 50 ms and the clock steps add up to about 50 ms of error).
import { expect, test } from '@playwright/test';
import { DESKTOP_VIEWPORT, sleep } from './support/runtime';
import {
  boxes,
  expectSameBoxes,
  scrollSectionIntoBuild,
} from './support/effects';
import { startPaused } from './support/layer';
import {
  clickIn,
  dockButtonName,
  dockInfo,
  frames,
  isFinal,
  readBuild,
  skipHero,
  untilFrames,
} from './support/controls';

test.use({ viewport: DESKTOP_VIEWPORT });

test('the scroll hint pulses after 4 s without a scroll and stops at the next scroll', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startPaused(page);
  await untilFrames(page, (b) => isFinal(b.states[0]), 'hero done');
  let d = await dockInfo(page);
  expect(d.state).toBe('idle');
  expect(d.hint).toBe('scroll ↓');
  expect(d.pulse).toBe(false);

  await page.clock.runFor(3000);
  expect((await dockInfo(page)).pulse, 'not yet at about 3 s').toBe(false);
  await page.clock.runFor(1500);
  expect((await dockInfo(page)).pulse, 'pulsing at about 4.5 s').toBe(true);

  // A scroll too small to reach About's trigger resets the pulse.
  await page.evaluate(() => window.scrollBy({ top: 4, behavior: 'instant' }));
  await sleep(50);
  await page.clock.runFor(100);
  d = await dockInfo(page);
  expect(d.state).toBe('idle');
  expect(d.pulse, 'the pulse stops at the next scroll').toBe(false);

  // The count restarts: still quiet 2 s after the scroll, pulsing again 4.5 s after it.
  await page.clock.runFor(2000);
  expect((await dockInfo(page)).pulse).toBe(false);
  await page.clock.runFor(2500);
  expect((await dockInfo(page)).pulse).toBe(true);
});

test('a finished 1x build shows the complete state with Replay, collapses after about 4 s, reopens from the expand button and fills the footer without moving anything', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await startPaused(page);
  await untilFrames(page, (b) => isFinal(b.states[0]), 'hero done');
  const before = await boxes(page);

  await scrollSectionIntoBuild(page, 'contact');
  await untilFrames(page, (b) => b.states.every(isFinal), 'every section done');
  const done = await dockInfo(page);
  const match = /^✔ Build complete: 5 sections in (\d+(?:\.\d+)?)s$/.exec(
    done.text,
  );
  expect(match, done.text).not.toBeNull();
  const t = match?.[1] as string;
  expect(done.state).toBe('done');
  expect(done.shown).toEqual(['replay']);
  expect(await dockButtonName(page, 'replay')).toBe('Replay the build');
  expect(done.footer).toBe(`Built live in ${t}s · ↻ Replay`);

  // Filling the reserved slot moves no box and no text.
  expectSameBoxes(await boxes(page), before, 'after the footer fills');

  await page.clock.runFor(2000);
  expect((await dockInfo(page)).state, 'still done at about 2 s').toBe('done');
  await page.clock.runFor(3000);
  const collapsed = await dockInfo(page);
  expect(collapsed.state, 'collapsed at about 5 s').toBe('collapsed');
  expect(collapsed.shown).toEqual(['expand']);
  expect(await dockButtonName(page, 'expand')).toBe('Show build status');
  expect(collapsed.footer, 'the footer keeps its summary').toBe(
    `Built live in ${t}s · ↻ Replay`,
  );

  await clickIn(page, '[data-dock-action="expand"]');
  await frames(page, 2);
  const reopened = await dockInfo(page);
  expect(reopened.state).toBe('done');
  expect(reopened.text).toBe(done.text);
  await page.clock.runFor(2000);
  expect((await dockInfo(page)).state).toBe('done');
  await page.clock.runFor(3000);
  expect((await dockInfo(page)).state, 'collapses again').toBe('collapsed');
});

test('Replay from the footer scrolls to the top, returns every section to pending and replays from the boot', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await startPaused(page);
  await skipHero(page);
  await page.keyboard.press('Shift+Escape');
  await frames(page, 2);
  const done = await dockInfo(page);
  const t = /in (\d+(?:\.\d+)?)s$/.exec(done.text)?.[1];
  expect(t).toBeDefined();
  expect(done.footer).toBe(`Built live in ${t}s · ↻ Replay`);

  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  await sleep(50);
  await clickIn(page, '.sp-footer-replay');
  await untilFrames(
    page,
    (b) => b.states[0] !== 'pending',
    'hero restarted',
    5000,
  );
  const r = await page.evaluate(() => ({
    y: window.scrollY,
    mode: document.documentElement.getAttribute('data-build-mode'),
    boot: document.querySelectorAll('.sp-boot').length,
    footer: document.querySelector('[data-footer-build]')?.textContent ?? '',
  }));
  expect(r).toEqual({ y: 0, mode: 'pending', boot: 1, footer: '' });
  const b = await readBuild(page);
  expect(isFinal(b.states[0])).toBe(false);
  expect(b.states.slice(1)).toEqual([
    'pending',
    'pending',
    'pending',
    'pending',
  ]);
});

test('Replay from the dock replays the same way', async ({ page }) => {
  test.setTimeout(150_000);
  await startPaused(page);
  await skipHero(page);
  await page.keyboard.press('Shift+Escape');
  await frames(page, 2);
  expect((await dockInfo(page)).shown).toEqual(['replay']);
  await clickIn(page, '[data-dock-action="replay"]');
  await untilFrames(
    page,
    (b) => b.states[0] !== 'pending',
    'hero restarted',
    5000,
  );
  expect(await page.locator('.sp-boot').count()).toBe(1);
  expect(
    await page.evaluate(() =>
      document.documentElement.getAttribute('data-build-mode'),
    ),
  ).toBe('pending');
  expect((await readBuild(page)).states.slice(1)).toEqual([
    'pending',
    'pending',
    'pending',
    'pending',
  ]);
});
