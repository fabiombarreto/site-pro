// PRPs/prds/stage-3-runtime.prd.md AC-1 hero timing and order, AC-11 elements not yet created get no pointer events
// (phase 3 plan: AC-A1, AC-A5, AC-A7)
// Hero steps (1x, section clock): title 1300-1842, role 1500-2000, photo 1600-2050, intro 1900-2370,
// links 2200-2530 (150 ms selection box 2200-2350, then the 180 ms pop 2350-2530), created 2600, done 3100.
// Effect phases inside a step: a target goes live (its data-build-fx marker is removed) once the step passes
// its selection phase: title 1450, role 1650, photo 1950, intro 2250, links 2350.
// Sampling error: advanceTo returns once the published progress (rounded to 1 percent, 31 ms of the 3100 ms
// hero) times the duration reaches the requested moment. The rounding makes the real clock up to ~16 ms
// earlier than requested; the 1 percent step plus a 20 ms slice and one 16.7 ms frame make it up to ~52 ms
// later. Every sampled moment below sits at least that far (-16 / +52 ms) from the boundary of the phase it
// asserts; where a window is only 100 ms wide (intro live at 2250, links popping from 2350) the slice is
// tightened to 10 ms, which cuts the late bound to ~35 ms.
import { expect, test } from '@playwright/test';
import { DESKTOP_VIEWPORT, runUntil } from './support/runtime';
import { startPaused } from './support/layer';
import {
  SCRAMBLE_GLYPHS,
  advanceTo,
  heroFrame,
  windowCommand,
} from './support/effects';

test.use({ viewport: DESKTOP_VIEWPORT });
test.setTimeout(120_000);

test('selects the headline under a selection box while it is hidden and unclickable, with later steps untouched', async ({
  page,
}) => {
  const duration = await startPaused(page);
  await advanceTo(page, 'top', duration, 1340);
  const f = await heroFrame(page);
  expect(f.title.fx).toBe('hidden');
  expect(f.title.opacity).toBe('0');
  expect(f.title.pointerEvents).toBe('none');
  expect(f.select).toBeGreaterThanOrEqual(1);
  for (const later of [f.role, f.photo, f.intro, f.links]) {
    expect(later.fx).toBe('hidden');
    expect(later.pointerEvents).toBe('none');
  }
});

test('types the headline with a thin caret and a clip-path, and has it readable by 2.0 s with the text untouched', async ({
  page,
}) => {
  const duration = await startPaused(page);
  // The headline is live from 1450 and the role stays hidden until 1650: sample the middle of that window.
  await advanceTo(page, 'top', duration, 1550);
  let f = await heroFrame(page);
  expect(f.title.fx).toBeNull();
  expect(f.title.clip).toMatch(/^polygon/);
  expect(f.title.pointerEvents).not.toBe('none');
  expect(f.caret).toBeGreaterThanOrEqual(1);
  expect(f.role.fx).toBe('hidden');
  expect(f.role.pointerEvents).toBe('none');
  expect(f.links.fx).toBe('hidden');
  await expect(page.locator('h1')).toHaveText('Fabio Barreto.');

  // The headline step ends at 1842 ms; by 1.9 s it is fully there and back to its resting state.
  await advanceTo(page, 'top', duration, 1920);
  f = await heroFrame(page);
  expect(f.title.fx).toBeNull();
  expect(f.title.clip).toBe('');
  expect(f.title.opacity).toBe('1');
  await expect(page.locator('h1')).toHaveText('Fabio Barreto.');
});

test('decodes the role through scrambled glyphs and shows the photo as a skeleton before the placeholder', async ({
  page,
}) => {
  const duration = await startPaused(page);
  await advanceTo(page, 'top', duration, 1800);
  let f = await heroFrame(page);
  expect(f.role.fx).toBeNull();
  expect(f.scramble.length).toBeGreaterThanOrEqual(1);
  for (const ch of f.scramble) {
    expect(ch === ' ' || SCRAMBLE_GLYPHS.includes(ch), `glyph "${ch}"`).toBe(
      true,
    );
  }
  expect(f.photo.fx).toBe('hidden');
  expect(f.skeletonBlocks).toBeGreaterThanOrEqual(1);

  // Title, role and photo are back to the untouched page by 2.15 s.
  await advanceTo(page, 'top', duration, 2150);
  f = await heroFrame(page);
  expect(f.title.fx).toBeNull();
  expect(f.title.clip).toBe('');
  expect(f.role.fx).toBeNull();
  expect(f.role.clip).toBe('');
  expect(f.photo.fx).toBeNull();
  expect(f.photo.opacity).toBe('1');
});

test('resolves the intro line by line from skeleton bars, then pops the buttons, none clickable before they are created', async ({
  page,
}) => {
  const duration = await startPaused(page);
  await advanceTo(page, 'top', duration, 2150);
  let f = await heroFrame(page);
  expect(f.intro.fx).toBe('hidden');
  expect(f.skeletonBlocks).toBeGreaterThanOrEqual(1);
  expect(f.links.fx).toBe('hidden');
  expect(f.links.pointerEvents).toBe('none');

  // The intro is live from 2250 and the links stay in their selection phase until 2350: sample the middle
  // of that window (2300 would sit 50 ms from 2350, under the late bound with a 20 ms slice).
  await advanceTo(page, 'top', duration, 2285, 10);
  f = await heroFrame(page);
  expect(f.intro.fx).toBeNull();
  expect(f.links.fx).toBe('hidden');
  expect(f.links.pointerEvents).toBe('none');

  await advanceTo(page, 'top', duration, 2450);
  f = await heroFrame(page);
  expect(f.links.fx).toBeNull();
  expect(f.links.pointerEvents).not.toBe('none');
  // The buttons are the created elements: each one is mid-pop, clipped by an inset.
  expect(f.links.childClips.length).toBeGreaterThan(0);
  for (const clip of f.links.childClips) expect(clip).toMatch(/^inset/);
});

test('leaves no marker, overlay element or inline style behind once the hero steps end, and keeps the final page', async ({
  page,
}) => {
  const duration = await startPaused(page);
  await advanceTo(page, 'top', duration, 2750);
  let f = await heroFrame(page);
  for (const target of [f.title, f.role, f.photo, f.intro, f.links]) {
    expect(target.fx).toBeNull();
    expect(target.pointerEvents).not.toBe('none');
  }
  expect(f.select).toBe(0);
  expect(f.skeletonBlocks).toBe(0);
  expect(f.caret).toBe(0);
  expect(f.scramble).toBe('');
  expect(f.inlineStyled).toBe(0);

  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
  f = await heroFrame(page);
  expect(f.inlineStyled).toBe(0);
  await expect(page.locator('.sp-window')).toHaveCount(0);
  await expect(page.locator('.sp-boot')).toHaveCount(0);
  await expect(page.locator('.sp-dock')).toHaveAttribute('data-state', 'idle');
});

test('compiles the hero within its budget: headline step done by 2.0 s, whole hero by 3.2 s', async ({
  page,
}) => {
  await startPaused(page);
  const hero = await page.evaluate(
    () =>
      JSON.parse(
        document.getElementById('top')?.getAttribute('data-build') ?? '{}',
      ) as {
        steps: { start: number; end: number }[];
        duration: number;
      },
  );
  expect(hero.steps[0]?.end ?? Infinity).toBeLessThanOrEqual(2000);
  expect(hero.duration).toBeLessThanOrEqual(3200);
});

test('shows the current call in the window bar, typed from the step start and cut to the displayed command', async ({
  page,
}) => {
  const duration = await startPaused(page);
  // The intro step runs 1900-2370 and the next step starts at 2200: a 13-character call is typed in 156 ms.
  await advanceTo(page, 'top', duration, 2110);
  expect(await windowCommand(page)).toBe('hero.intro(…)');

  // The last step starts at 2200; shortly after it the call is partly typed, a prefix of the full call.
  await advanceTo(page, 'top', duration, 2260);
  const partial = await windowCommand(page);
  const full = 'hero.links([…])';
  expect(partial.length).toBeGreaterThan(0);
  expect(partial.length).toBeLessThan(full.length);
  expect(full.startsWith(partial)).toBe(true);

  await advanceTo(page, 'top', duration, 2450);
  expect(await windowCommand(page)).toBe(full);
});
