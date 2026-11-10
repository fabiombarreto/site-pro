// PRPs/prds/stage-3-runtime.prd.md AC-11 elements not yet created get no pointer events, created ones are clickable
// while the window is open; AC-20 project cards build with a 120 ms overlap and a window command cut to 29 characters
// (phase 3 plan: AC-A5, AC-A7)
import { expect, test } from '@playwright/test';
import { DESKTOP_VIEWPORT, IDS, runUntil, sleep } from './support/runtime';
import { startPaused } from './support/layer';
import {
  advanceTo,
  scrollSectionIntoBuild,
  timelinesOnPage,
  windowCommand,
} from './support/effects';

test.use({ viewport: DESKTOP_VIEWPORT });

// The window command is the call typed at 12 ms per character, cut with an ellipsis to 29 characters.
const cut = (call: string): string => {
  if (call.length <= 29) return call;
  const open = call.indexOf('("') + 2;
  return `${call.slice(0, open + (29 - open - 3))}…")`;
};

test('lets a created card take clicks while the next ones are hidden and ignore the pointer, and cuts the window command', async ({
  page,
}) => {
  test.setTimeout(240_000);
  const duration = await startPaused(page);
  expect(duration).toBeGreaterThan(0);
  const tls = await timelinesOnPage(page);
  const projects = tls.projects;
  const cards = (projects?.steps ?? []).filter((s) =>
    s.call.startsWith('projects.card('),
  );
  expect(cards.length).toBeGreaterThanOrEqual(3);
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
  await scrollSectionIntoBuild(page, 'projects');

  // First card: the window shows its call as a typed prefix of the cut command (at most 29 characters).
  // The next card starts typing its own call at cards[1].start: stay at least the ~52 ms sampling error before it.
  const slotEnd = (cards[1]?.start ?? 0) - 70;
  expect(slotEnd).toBeGreaterThan((cards[0]?.start ?? 0) + 100);
  await advanceTo(page, 'projects', projects?.duration ?? 0, slotEnd);
  const typed = await windowCommand(page);
  const expected = cut(cards[0]?.call ?? '');
  expect(expected.length).toBeLessThanOrEqual(29);
  expect(typed.length).toBeGreaterThan(0);
  expect(expected.startsWith(typed)).toBe(true);

  // Second card: its 31-character call is shown cut to 29 characters with an ellipsis before the closing quote.
  // Cards start 180 ms apart, so the next card takes over the window after 180 ms (15 characters at 12 ms each):
  // sample 80 ms before it, where at least 5 characters of the call are typed (100 ms - 16 ms error = 84 ms).
  await advanceTo(
    page,
    'projects',
    projects?.duration ?? 0,
    (cards[2]?.start ?? 0) - 80,
  );
  const typedSecond = await windowCommand(page);
  const cutSecond = cut(cards[1]?.call ?? '');
  expect(cutSecond.length).toBeLessThanOrEqual(29);
  expect(cutSecond).toContain('…');
  expect(typedSecond.length).toBeGreaterThanOrEqual(5);
  expect(cutSecond.startsWith(typedSecond)).toBe(true);

  // Third card selecting (a card goes live 190 ms after its start): the second card is live, the third and
  // fourth are not.
  await advanceTo(
    page,
    'projects',
    projects?.duration ?? 0,
    (cards[2]?.start ?? 0) + 100,
  );
  await page.evaluate(() => {
    const cell = document.querySelectorAll('#projects .sp-projects-cell')[1];
    window.scrollTo({
      top: (cell?.getBoundingClientRect().top ?? 0) + window.scrollY - 150,
      behavior: 'instant',
    });
  });
  await page.clock.runFor(16);
  await sleep(10);
  const r = await page.evaluate((ids) => {
    const cells = [
      ...document.querySelectorAll('#projects .sp-projects-cell'),
    ] as HTMLElement[];
    const center = (e: Element) => {
      const b = e.getBoundingClientRect();
      return [b.x + b.width / 2, b.y + b.height / 2] as const;
    };
    const link = cells[1]?.querySelector('a.sp-card-link') as Element;
    const [lx, ly] = center(link);
    const hit = document.elementFromPoint(lx, ly);
    const [cx, cy] = center(cells[3] as Element);
    const hit3 = document.elementFromPoint(cx, cy);
    const pe = (e: Element) => getComputedStyle(e).pointerEvents;
    return {
      createdFx: cells[1]?.getAttribute('data-build-fx') ?? null,
      createdPe: pe(cells[1] as Element),
      laterFx: [2, 3].map((i) => cells[i]?.getAttribute('data-build-fx')),
      laterPe: [2, 3].map((i) => pe(cells[i] as Element)),
      linkHit: !!hit && link.contains(hit),
      laterHit: !!hit3 && (cells[3] as Element).contains(hit3),
      states: ids.map((id) =>
        document.getElementById(id)?.getAttribute('data-build-state'),
      ),
    };
  }, IDS);
  expect(r.states[3], 'scrolling for the hit test did not start Stack').toBe(
    'pending',
  );
  expect(r.createdFx).toBeNull();
  expect(r.createdPe).not.toBe('none');
  expect(r.laterFx).toEqual(['hidden', 'hidden']);
  expect(r.laterPe).toEqual(['none', 'none']);
  expect(r.linkHit).toBe(true);
  expect(r.laterHit).toBe(false);
});

test('keeps a section that has not started building from taking the pointer', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startPaused(page);
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
  const pe = await page.evaluate(() =>
    ['about', 'projects', 'stack', 'contact'].map(
      (id) =>
        getComputedStyle(document.getElementById(id) as Element).pointerEvents,
    ),
  );
  expect(pe).toEqual(['none', 'none', 'none', 'none']);
});
