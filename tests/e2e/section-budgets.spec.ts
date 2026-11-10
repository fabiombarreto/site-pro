// PRPs/prds/stage-4-sections-effects.prd.md AC-6 Section budgets (each of About, Projects, Stack and Contact triggered on
// its own shows the dock's `✔ <Section> Section created. (<t>s)` line within 2.5 s of clock time after the trigger, with
// <t> <= 2.50), AC-7 Every section with its docs/04 effects (observed while the clock runs: consecutive project cards overlap
// by about 120 ms and never more than two are building; the buttons and the stack chips pop one after another 90 ms apart)
// (phase 5 plan: Notes 3, the section-budgets spec named in docs/context/testing.md)
// The hero marks of AC-6 (headline readable by 2.0 s, final with no window by 3.2 s) are pinned in effects-hero.spec.ts and
// behavior-gaps.spec.ts; the compiled timelines in effects-scripts.spec.ts and runtime-pacing.test.ts.
// Sampling: the clock runs in 10 ms slices and the runtime renders on animation frames (16.7 ms), so an observed moment is
// up to one frame late; a section is triggered by an IntersectionObserver a frame or two after the scroll. The 2.5 s mark is
// therefore asserted with a 60 ms allowance for that sampling (the compiled createdAt itself is unit-tested at <= 2500 ms).
import { expect, test, type Page } from '@playwright/test';
import { DESKTOP_VIEWPORT, runUntil, sleep } from './support/runtime';
import { layerState, startPaused } from './support/layer';
import { scrollSectionIntoBuild } from './support/effects';
import { dockInfo, frames, readBuild, untilFrames } from './support/controls';

test.use({ viewport: DESKTOP_VIEWPORT });
test.setTimeout(300_000);

const SAMPLING_ALLOWANCE_MS = 60;

const now = (page: Page): Promise<number> =>
  page.evaluate(() => performance.now());

const SECTIONS = [
  { id: 'about', index: 1, label: 'About' },
  { id: 'projects', index: 2, label: 'Projects' },
  { id: 'stack', index: 3, label: 'Stack' },
  { id: 'contact', index: 4, label: 'Contact' },
];

async function idleDock(page: Page): Promise<void> {
  for (let i = 0; i < 100; i++) {
    if ((await dockInfo(page)).state === 'idle') return;
    await frames(page, 1);
  }
  throw new Error('the dock never went idle');
}

test('creates each section within 2.5 s of clock time after its own trigger', async ({
  page,
}) => {
  await startPaused(page);
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');

  for (const section of SECTIONS) {
    await idleDock(page);
    expect(
      (await readBuild(page)).states[section.index],
      `${section.id} is still pending before its trigger`,
    ).not.toBe('building');
    await scrollSectionIntoBuild(page, section.id);
    const t0 = await now(page);
    await untilFrames(
      page,
      (b) => b.states[section.index] === 'closing',
      `${section.id} created`,
      6000,
    );
    const elapsed = (await now(page)) - t0;
    const line = new RegExp(
      `✔ ${section.label} Section created\\. \\((\\d+\\.\\d{2})s\\)`,
    ).exec((await layerState(page)).dockText);
    expect(line, `${section.id} created line`).not.toBeNull();
    const seconds = Number(line?.[1]);
    expect(seconds, `${section.id} created seconds`).toBeLessThanOrEqual(2.5);
    expect(seconds, `${section.id} is a real build time`).toBeGreaterThan(1);
    expect(
      elapsed,
      `${section.id} clock time from the trigger to the created line`,
    ).toBeLessThanOrEqual(2500 + SAMPLING_ALLOWANCE_MS);
    // The printed time is the clock time that passed, not a constant.
    expect(Math.abs(elapsed - seconds * 1000)).toBeLessThanOrEqual(150);
    await runUntil(
      page,
      (s) => s.states[section.index] === 'done',
      30000,
      `${section.id} done`,
    );
  }
});

async function watch(
  page: Page,
  id: string,
  index: number,
  onSample: (t: number) => Promise<void>,
): Promise<void> {
  await idleDock(page);
  await scrollSectionIntoBuild(page, id);
  for (let i = 0; i < 900; i++) {
    await page.clock.runFor(10);
    await sleep(3);
    await onSample(await now(page));
    if ((await readBuild(page)).states[index] === 'done') return;
  }
  throw new Error(`${id} never finished`);
}

// Clock time at which each child first has a non-zero inline opacity (the pop has started for it).
const popStarts = (
  seen: Map<string, number>,
  key: string,
  opacities: string[],
  t: number,
): void => {
  opacities.forEach((value, i) => {
    const id = `${key}:${i}`;
    if (!seen.has(id) && value !== '' && Number(value) > 0) seen.set(id, t);
  });
};

const gaps = (seen: Map<string, number>, key: string, count: number) =>
  Array.from({ length: count - 1 }, (_, i) => {
    const a = seen.get(`${key}:${i}`);
    const b = seen.get(`${key}:${i + 1}`);
    expect(a, `${key} child ${i} popped`).toBeDefined();
    expect(b, `${key} child ${i + 1} popped`).toBeDefined();
    return (b ?? 0) - (a ?? 0);
  });

test('pops the About buttons, overlaps the project cards and pops the stack chips as documented', async ({
  page,
}) => {
  await startPaused(page);
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');

  // About: the two buttons pop one after another, 90 ms apart.
  const buttons = new Map<string, number>();
  let buttonCount = 0;
  await watch(page, 'about', 1, async (t) => {
    const opacities = await page.evaluate(() =>
      [
        ...(document.querySelector('#about [data-build-target="links"]')
          ?.children ?? []),
      ].map((el) => (el as HTMLElement).style.opacity),
    );
    buttonCount = Math.max(buttonCount, opacities.length);
    popStarts(buttons, 'about', opacities, t);
  });
  expect(buttonCount, 'About buttons').toBe(2);
  for (const gap of gaps(buttons, 'about', buttonCount)) {
    expect(gap, 'About buttons pop about 90 ms apart').toBeGreaterThanOrEqual(
      60,
    );
    expect(gap).toBeLessThanOrEqual(125);
  }

  // Projects: consecutive cards overlap by about 120 ms and at most two build at once.
  // The overlap is derived from step START times, not from how long a selection box is visible (a box fades out before its
  // step ends): docs/04 and effect-timing.ts give a card step CARD_MS = 300 ms, and the compiled pitch between consecutive
  // card starts is 180 ms, so the overlap is CARD_MS minus the observed start spacing, about 120 ms.
  // Start signal: the build-card runner hides each card (data-build-fx="hidden") until its cover phase starts, a fixed
  // 190 ms into the step (cardPhases().coverStarted), and then drops the attribute. That fixed offset cancels out of the
  // spacing between consecutive cards, so the moment each card goes live stands in for its start. (Revision 3: the earlier
  // probe used the first sighting of any `.sp-select` box, which also picked up boxes from other steps and measured a
  // spacing of about 290 ms.)
  const CARD_MS = 300;
  const cardLive = new Map<string, number>();
  const cardsHidden = new Set<string>();
  let maxBuilding = 0;
  let headingDone = false;
  await watch(page, 'projects', 2, async (t) => {
    const s = await page.evaluate(() => {
      const heading = document.querySelector(
        '#projects [data-build-target="heading"]',
      ) as HTMLElement;
      const h = heading.getBoundingClientRect();
      // Only the selection boxes of card steps: not the heading's own selection (its box centre lies inside the heading).
      const cardSelects = [...document.querySelectorAll('.sp-select')].filter(
        (el) => {
          if (el.getAttribute('data-state') === 'fading') return false;
          const r = el.getBoundingClientRect();
          const cx = r.x + r.width / 2;
          const cy = r.y + r.height / 2;
          return !(
            cx >= h.left &&
            cx <= h.right &&
            cy >= h.top &&
            cy <= h.bottom
          );
        },
      );
      const cards = [
        ...document.querySelectorAll('#projects [data-build-target^="card-"]'),
      ].map((card) => ({
        id: card.getAttribute('data-build-target') ?? '',
        fx: card.getAttribute('data-build-fx'),
      }));
      return {
        cards,
        selects: cardSelects.length,
        state: document
          .getElementById('projects')
          ?.getAttribute('data-build-state'),
        fx: heading.getAttribute('data-build-fx'),
        clip: heading.style.clipPath,
      };
    });
    if (s.state === 'building' && s.fx === null && s.clip === '') {
      headingDone = true;
    }
    maxBuilding = Math.max(maxBuilding, s.selects);
    for (const card of s.cards) {
      if (card.fx === 'hidden') cardsHidden.add(card.id);
      else if (card.fx === null && cardsHidden.has(card.id)) {
        if (!cardLive.has(card.id)) cardLive.set(card.id, t);
      }
    }
  });
  expect(cardsHidden.size, 'cards observed hidden before their step').toBe(
    cardLive.size,
  );
  expect(headingDone, 'the heading was observed typed').toBe(true);
  expect(maxBuilding, 'never more than two steps building').toBeLessThanOrEqual(
    2,
  );
  // Cards build in page order, so sorting the live moments gives consecutive starts.
  const starts = [...cardLive.values()].sort((a, b) => a - b);
  expect(starts.length, 'card steps observed starting').toBeGreaterThanOrEqual(
    3,
  );
  const overlaps = starts
    .slice(1)
    .map((time, i) => CARD_MS - (time - starts[i]));
  // Each start is seen up to one 10 ms slice plus one animation frame late, so one spacing is off by at most about 27 ms:
  // a single overlap must sit within 120 +/- 35 ms, and their mean within 120 +/- 20 ms.
  for (const overlap of overlaps) {
    expect(
      overlap,
      'a card overlaps its predecessor by about 120 ms',
    ).toBeGreaterThanOrEqual(85);
    expect(overlap).toBeLessThanOrEqual(155);
  }
  const mean = overlaps.reduce((a, b) => a + b, 0) / overlaps.length;
  expect(mean, 'mean card overlap about 120 ms').toBeGreaterThanOrEqual(100);
  expect(mean).toBeLessThanOrEqual(140);

  // Stack: each group's chips pop one after another, 90 ms apart.
  const chips = new Map<string, number>();
  let sizes: number[] = [];
  await watch(page, 'stack', 3, async (t) => {
    const groups = await page.evaluate(() =>
      [...document.querySelectorAll('#stack [data-build-target]')]
        .filter((target) => target.querySelector('li'))
        .map((target) =>
          [...target.querySelectorAll('li')].map(
            (li) => (li as HTMLElement).style.opacity,
          ),
        ),
    );
    sizes = groups.map((g) => g.length);
    groups.forEach((opacities, g) =>
      popStarts(chips, `group${g}`, opacities, t),
    );
  });
  expect(sizes.length, 'stack groups').toBeGreaterThanOrEqual(2);
  const all = sizes.flatMap((count, g) => gaps(chips, `group${g}`, count));
  expect(all.length, 'chip gaps measured').toBeGreaterThanOrEqual(3);
  for (const gap of all) {
    expect(gap, 'stack chips pop about 90 ms apart').toBeGreaterThanOrEqual(60);
    expect(gap).toBeLessThanOrEqual(125);
  }
});
