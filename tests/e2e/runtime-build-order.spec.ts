// PRPs/prds/stage-3-runtime.prd.md AC-2 Sections build in order as the visitor scrolls (trigger and order parts)
// PRPs/prds/stage-3-runtime.prd.md AC-5 turbo x5, AC-16 hidden tab pauses, AC-4 the final layout never moves
// (phase 1 plan: AC-A2, AC-A4, AC-A6, AC-A8)
// Time is Playwright's page.clock. Real pauses between clock slices let the
// IntersectionObserver deliver its entries.
import { expect, test, type Page } from '@playwright/test';
import {
  ACTIVE_STATES,
  DESKTOP_VIEWPORT,
  IDS,
  runUntil,
  sleep,
  snapshot,
  startClocked,
  timelinesOf,
} from './support/runtime';

test.use({ viewport: DESKTOP_VIEWPORT });

test('builds the hero, leaves About pending without scrolling, then builds the rest in order, one at a time, at turbo speed', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const durations = Object.fromEntries(
    timelinesOf(await (await request.get('/')).text()).map((t) => [
      t.section,
      t.duration,
    ]),
  );

  await startClocked(page);
  await page.clock.pauseAt(60000);
  const heroDone = await runUntil(
    page,
    (s) => s.states[0] === 'done',
    20000,
    'hero done',
  );
  expect(heroDone.opacity[0]).toBe('1');
  expect(heroDone.states[1]).toBe('pending');

  await page.clock.runFor(30000);
  const idle = await snapshot(page);
  expect(idle.states[1]).toBe('pending');
  expect(idle.status).toBe('idle');
  expect(idle.scrollY).toBe(0);

  await page.evaluate(() =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    }),
  );
  const scrolledTo = (await snapshot(page)).scrollY;

  const order: string[] = [];
  let maxActive = 0;
  let elapsed = 0;
  let last = await snapshot(page);
  for (; elapsed < 90000; elapsed += 100) {
    await page.clock.runFor(100);
    await sleep(5);
    last = await snapshot(page);
    last.states.forEach((state, i) => {
      const id = IDS[i] as string;
      if (ACTIVE_STATES.includes(state ?? '') && !order.includes(id)) {
        order.push(id);
      }
    });
    maxActive = Math.max(
      maxActive,
      last.states.filter((s) => ACTIVE_STATES.includes(s ?? '')).length,
    );
    if (last.status === 'done') break;
  }

  expect(order).toEqual(['about', 'projects', 'stack', 'contact']);
  expect(maxActive).toBe(1);
  expect(last.status).toBe('done');
  expect(last.mode).toBeNull();
  expect(last.states).toEqual(IDS.map(() => 'done'));
  expect(last.scrollY).toBe(scrolledTo);
  // About, Projects and Stack run at x5 (the next section is queued); Contact at 1x.
  const expected =
    ((durations.about ?? 0) +
      (durations.projects ?? 0) +
      (durations.stack ?? 0)) /
      5 +
    (durations.contact ?? 0);
  expect(Math.abs(elapsed - expected)).toBeLessThanOrEqual(1500);
});

test('does not advance the build while the tab is hidden and resumes when it is visible', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startClocked(page);
  await page.clock.pauseAt(60000);
  await runUntil(
    page,
    (s) => s.progress >= 0.2 && s.states[0] !== 'done',
    20000,
    'hero at 20%',
  );

  const setVisibility = (hidden: boolean) =>
    page.evaluate((h) => {
      if (h) {
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          configurable: true,
        });
      } else {
        delete (document as unknown as Record<string, unknown>).visibilityState;
      }
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);

  await setVisibility(true);
  const before = (await snapshot(page)).progress;
  await page.clock.runFor(10000);
  const during = await snapshot(page);
  expect(during.progress).toBe(before);
  expect(during.states[0]).not.toBe('done');

  await setVisibility(false);
  await runUntil(
    page,
    (s) => s.states[0] === 'done',
    20000,
    'hero resumes and finishes',
  );
});

const boxes = (page: Page) =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const els = [
      ...document.querySelectorAll(
        'main > section, main h1, main h2, main p, main a, main article',
      ),
    ];
    return {
      height: document.documentElement.scrollHeight,
      boxes: els.map((e) => {
        const r = e.getBoundingClientRect();
        return [r.x + scrollX, r.y + scrollY, r.width, r.height];
      }),
    };
  });

test('lays out the pending page exactly like the ready page', async ({
  page,
  browser,
}) => {
  await startClocked(page);
  const pending = await boxes(page);

  const ready = await browser.newContext({
    viewport: DESKTOP_VIEWPORT,
    reducedMotion: 'reduce',
  });
  const readyPage = await ready.newPage();
  await readyPage.goto('/', { waitUntil: 'load' });
  await expect(readyPage.locator('html')).toHaveAttribute(
    'data-build-status',
    'done',
  );
  const final = await boxes(readyPage);
  await ready.close();

  expect(Math.abs(final.height - pending.height)).toBeLessThanOrEqual(0.5);
  expect(final.boxes).toHaveLength(pending.boxes.length);
  final.boxes.forEach((box, i) => {
    box.forEach((value, j) => {
      expect(
        Math.abs(value - (pending.boxes[i]?.[j] ?? Infinity)),
        `box ${i} coordinate ${j}`,
      ).toBeLessThanOrEqual(0.5);
    });
  });
});
