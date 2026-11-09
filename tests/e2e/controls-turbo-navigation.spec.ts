// PRPs/prds/stage-3-runtime.prd.md AC-5 Turbo (queued n/5, one fifth of the 1x time, the last section at 1x),
// AC-6 Never hijack scrolling, AC-9 Deep links and nav clicks (browser anchor navigation, earlier sections in turbo)
// (phase 4 plan: AC-A6, AC-A7)
// Sampling error: data-build-progress is rounded to 1 % and the loop steps 20 ms, so durations carry 150 to 300 ms
// tolerances. The hero can run a few frames at 1x before a deep link queues it, so its turbo time is only bounded above.
import { expect, test } from '@playwright/test';
import { DESKTOP_VIEWPORT, IDS } from './support/runtime';
import { scrollSectionIntoBuild, timelinesOnPage } from './support/effects';
import { startPaused } from './support/layer';
import {
  clickIn,
  dockInfo,
  frames,
  isFinal,
  openClocked,
  readBuild,
  skipHero,
  untilFrames,
  watchBuild,
} from './support/controls';

test.use({ viewport: DESKTOP_VIEWPORT });

const inView = (page: import('@playwright/test').Page, id: string) =>
  page.evaluate((i) => {
    const r = (document.getElementById(i) as Element).getBoundingClientRect();
    return r.top <= innerHeight * 0.75 && r.bottom > 0;
  }, id);

test('scrolling straight to Contact queues the sections between, builds them at 5x with queued n/5, then Contact at 1x', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await startPaused(page);
  const tl = await timelinesOnPage(page);
  await untilFrames(page, (b) => isFinal(b.states[0]), 'hero done');
  await scrollSectionIntoBuild(page, 'contact');
  const y0 = (await readBuild(page)).y;

  const { watch, scrolled } = await watchBuild(page, y0, 4);
  expect(scrolled).toEqual([]);
  expect(['2/5', '3/5', '4/5'].every((q) => watch.seen.has(q))).toBe(true);
  for (const [k, id] of [
    [1, 'about'],
    [2, 'projects'],
    [3, 'stack'],
  ] as const) {
    const took = (watch.last[k] as number) - (watch.first[k] as number);
    expect(
      Math.abs(took - (tl[id]?.duration ?? 0) / 5),
      `${id} at 5x took ${took}`,
    ).toBeLessThanOrEqual(150);
  }
  const contact = (watch.last[4] as number) - (watch.first[4] as number);
  expect(Math.abs(contact - (tl.contact?.duration ?? 0))).toBeLessThanOrEqual(
    300,
  );
});

test('the dock shows the queue status as queued n/5 while turbo catches up and none while the last section builds', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await startPaused(page);
  await untilFrames(page, (b) => isFinal(b.states[0]), 'hero done');
  await scrollSectionIntoBuild(page, 'contact');
  await untilFrames(page, (b) => b.queue === '2/5', 'queue 2/5');
  expect((await dockInfo(page)).text).toBe('queued 2/5');
  await untilFrames(
    page,
    (b) => b.states[4] === 'building',
    'contact building',
  );
  expect((await readBuild(page)).queue).toBeNull();
});

test('the runtime never moves the page while the hero and the triggered sections build', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await startPaused(page);
  const heroY: number[] = [];
  await untilFrames(
    page,
    (b) => {
      heroY.push(b.y);
      return isFinal(b.states[0]);
    },
    'hero done',
  );
  expect(new Set(heroY)).toEqual(new Set([0]));

  await scrollSectionIntoBuild(page, 'about');
  const y0 = (await readBuild(page)).y;
  expect(y0).toBeGreaterThan(0);
  const { scrolled } = await watchBuild(page, y0, 1);
  expect(scrolled).toEqual([]);
});

test('a first visit to /#projects scrolls at once by the browser, builds the hero and About in turbo, then Projects at 1x', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await openClocked(page, '#projects');
  const tl = await timelinesOnPage(page);
  let y1 = 0;
  for (let i = 0; i < 40 && y1 === 0; i++) {
    await frames(page, 1);
    y1 = (await readBuild(page)).y;
  }
  expect(y1, 'anchor navigation put Projects in view').toBeGreaterThan(0);
  expect(await inView(page, 'projects')).toBe(true);
  const outline = await page.evaluate(() =>
    [...document.querySelectorAll('.sp-outline')].some(
      (o) =>
        (o.textContent ?? '').includes('projects.tsx') &&
        !o.hasAttribute('data-hidden'),
    ),
  );
  expect(outline, 'Projects shows its pending outline').toBe(true);

  const { watch, scrolled } = await watchBuild(page, y1, 2);
  expect(scrolled, 'the runtime did not scroll').toEqual([]);
  expect(watch.seen.has('1/5') || watch.seen.has('2/5')).toBe(true);
  expect(watch.last[0] as number).toBeLessThanOrEqual(watch.first[2] as number);
  expect(watch.last[1] as number).toBeLessThanOrEqual(watch.first[2] as number);
  // Whole hero in turbo: at most a fifth of 3100 ms plus a few frames that ran at 1x before the queue formed.
  expect(watch.last[0] as number).toBeLessThanOrEqual(
    (tl.top?.duration ?? 0) / 5 + 250,
  );
  const projects = (watch.last[2] as number) - (watch.first[2] as number);
  expect(Math.abs(projects - (tl.projects?.duration ?? 0))).toBeLessThanOrEqual(
    300,
  );
});

for (const id of ['about', 'contact']) {
  test(`a first visit to /#${id} goes to the target at once and builds every earlier section before it`, async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await openClocked(page, `#${id}`);
    const k = IDS.indexOf(id);
    let y = 0;
    for (let i = 0; i < 40 && y === 0; i++) {
      await frames(page, 1);
      y = (await readBuild(page)).y;
    }
    expect(y).toBeGreaterThan(0);
    const reached = await untilFrames(
      page,
      (b) => b.states[k] === 'building',
      `${id} building`,
    );
    expect(reached.b.states.slice(0, k).every(isFinal)).toBe(true);
    expect(reached.b.y, 'the runtime did not scroll').toBe(y);
    await untilFrames(page, (b) => isFinal(b.states[k]), `${id} done`);
  });
}

test('activating the nav Stack link goes to Stack at once, builds About and Projects in turbo in order, then Stack at 1x', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await startPaused(page);
  const tl = await timelinesOnPage(page);
  await skipHero(page);
  await clickIn(page, '.sp-nav-links a[href="#stack"]');
  await frames(page, 3);
  const b = await readBuild(page);
  expect(b.y).toBeGreaterThan(0);
  expect(await inView(page, 'stack')).toBe(true);

  const { watch, scrolled } = await watchBuild(page, b.y, 3);
  expect(scrolled).toEqual([]);
  expect(watch.first[1] as number).toBeLessThan(watch.first[2] as number);
  expect(watch.first[2] as number).toBeLessThan(watch.first[3] as number);
  const about = (watch.last[1] as number) - (watch.first[1] as number);
  expect(Math.abs(about - (tl.about?.duration ?? 0) / 5)).toBeLessThanOrEqual(
    150,
  );
  const stack = (watch.last[3] as number) - (watch.first[3] as number);
  expect(Math.abs(stack - (tl.stack?.duration ?? 0))).toBeLessThanOrEqual(300);
});
