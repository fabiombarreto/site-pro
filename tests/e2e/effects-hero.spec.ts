// PRPs/prds/stage-3-runtime.prd.md AC-1 hero timing and order, AC-11 elements not yet created get no pointer events
// (phase 3 plan: AC-A1, AC-A5, AC-A7)
// Hero steps (1x, section clock): title 1300-1842, role 1500-2000, photo 1600-2600, intro 1850-2320,
// links 2080-2590 (150 ms selection box 2080-2230, then three buttons popping 90 ms apart from 2230), created 2650,
// done 3150.
// Effect phases inside a step: a target goes live (its data-build-fx marker is removed) once the step passes
// its selection phase: title 1450, role 1650, photo 1950, intro 2200, links 2230.
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

  // Title and role are back to the untouched page by 2.15 s. The photo (step 1600-2600) went live at 1900
  // and is mid-dissolve: visible, but not yet fully opaque.
  await advanceTo(page, 'top', duration, 2150);
  f = await heroFrame(page);
  expect(f.title.fx).toBeNull();
  expect(f.title.clip).toBe('');
  expect(f.role.fx).toBeNull();
  expect(f.role.clip).toBe('');
  expect(f.photo.fx).toBeNull();
  const midPhoto = Number(f.photo.imgOpacity);
  expect(midPhoto).toBeGreaterThan(0);
  expect(midPhoto).toBeLessThan(1);
});

test('resolves the intro line by line from skeleton bars, then pops the buttons, none clickable before they are created', async ({
  page,
}) => {
  const duration = await startPaused(page);
  // The intro is live from 2200 and the links from 2230. That 30 ms gap is too narrow to sample, so the
  // order is pinned on the compiled timeline in the budget test below; here both are hidden at 2120 (the
  // links box is already being selected from 2080).
  await advanceTo(page, 'top', duration, 2120, 10);
  let f = await heroFrame(page);
  expect(f.intro.fx).toBe('hidden');
  expect(f.skeletonBlocks).toBeGreaterThanOrEqual(1);
  expect(f.links.fx).toBe('hidden');
  expect(f.links.pointerEvents).toBe('none');

  // Both are live well after 2230 (2300 is at least 50 ms past it with a 10 ms slice).
  await advanceTo(page, 'top', duration, 2300, 10);
  f = await heroFrame(page);
  expect(f.intro.fx).toBeNull();
  expect(f.links.fx).toBeNull();
  expect(f.links.pointerEvents).not.toBe('none');

  await advanceTo(page, 'top', duration, 2400, 10);
  f = await heroFrame(page);
  expect(f.links.fx).toBeNull();
  expect(f.links.pointerEvents).not.toBe('none');
  // The buttons are the created elements: each one is mid-pop, clipped by an inset.
  expect(f.links.childClips.length).toBeGreaterThan(0);
  for (const clip of f.links.childClips) expect(clip).toMatch(/^inset/);
  // They pop one after another, 90 ms apart: at 2400 (170 ms into the pop group) the first button is fully
  // there and the last one has not begun to appear.
  const opacities = await page.evaluate(() =>
    [...document.querySelectorAll('#top [data-build-target="links"] > *')].map(
      (el) => getComputedStyle(el).opacity,
    ),
  );
  expect(opacities).toHaveLength(3);
  expect(opacities[0]).toBe('1');
  expect(Number(opacities[2])).toBeLessThan(1);
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
  expect(f.photo.opacity).toBe('1');
  expect(f.photo.imgOpacity).toBe('1');
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
        steps: { start: number; end: number; target: string }[];
        duration: number;
        createdAt: number;
        log?: string;
      },
  );
  expect(hero.steps[0]?.end ?? Infinity).toBeLessThanOrEqual(2000);
  expect(hero.duration).toBeLessThanOrEqual(3200);
  // The hero keeps its boot logs: no per-section dock log.
  expect(hero.log).toBeUndefined();
  // The intro goes live (start + 150 ms selection + 200 ms skeleton bars) before the links (start + 150 ms).
  const intro = hero.steps.find((s) => s.target === 'intro');
  const links = hero.steps.find((s) => s.target === 'links');
  expect((intro?.start ?? Infinity) + 350).toBeLessThan(
    (links?.start ?? 0) + 150,
  );
  // The three hero buttons pop 90 ms apart: 330 + 90 x 2.
  expect((links?.end ?? 0) - (links?.start ?? 0)).toBe(510);
  expect(hero.createdAt).toBeGreaterThanOrEqual(links?.end ?? Infinity);
});

test('shows the current call in the window bar, typed from the step start and cut to the displayed command', async ({
  page,
}) => {
  const duration = await startPaused(page);
  // The window shows each call cut to 29 characters (12 ms per character), a prefix of it while typing.
  const intro = 'hero.intro("12+ years ship…")';
  const links = 'hero.links(["GitHub", "Linke…';
  expect(intro).toHaveLength(29);
  expect(links).toHaveLength(29);

  // The intro step starts at 1850 and the links step takes over at 2080: 230 ms is not enough to type the
  // whole cut call (348 ms), so it is a prefix at 2030 (about 15 characters).
  await advanceTo(page, 'top', duration, 2030, 10);
  const typedIntro = await windowCommand(page);
  expect(typedIntro.length).toBeGreaterThanOrEqual(8);
  expect(typedIntro.length).toBeLessThan(intro.length);
  expect(intro.startsWith(typedIntro)).toBe(true);

  // The last step starts at 2080; shortly after it the call is partly typed, a prefix of the cut call.
  await advanceTo(page, 'top', duration, 2125, 10);
  const partial = await windowCommand(page);
  expect(partial.length).toBeGreaterThan(0);
  expect(partial.length).toBeLessThan(links.length);
  expect(links.startsWith(partial)).toBe(true);

  // Typing the 29 characters takes 348 ms: by 2500 the whole cut call is there.
  await advanceTo(page, 'top', duration, 2500);
  expect(await windowCommand(page)).toBe(links);
});
