// PRPs/prds/stage-3-runtime.prd.md AC-10 Keyboard focus (finish the focused section and every one before it; the hero
// during the boot) and AC-12 Resize during a build (a width change finishes the building section, a height change does
// not) (phase 4 plan: AC-A8, AC-A9)
// Stack renders no link or button, so a focus target inside it is made focusable for the test only.
import { expect, test, type Page } from '@playwright/test';
import { DESKTOP_VIEWPORT } from './support/runtime';
import { scrollSectionIntoBuild } from './support/effects';
import { startPaused } from './support/layer';
import { frames, isFinal, readBuild, untilFrames } from './support/controls';

test.use({ viewport: DESKTOP_VIEWPORT });

const activeIs = (page: Page, selector: string) =>
  page.evaluate(
    (q) => document.activeElement === document.querySelector(q),
    selector,
  );

test('focus entering Stack finishes Stack and every section before it within a frame, and keeps focus there', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startPaused(page);
  await untilFrames(page, (b) => isFinal(b.states[0]), 'hero done');
  expect((await readBuild(page)).states.slice(1, 4)).toEqual([
    'pending',
    'pending',
    'pending',
  ]);
  await page.evaluate(() => {
    const heading = document.querySelector('#stack h2') as HTMLElement;
    heading.setAttribute('tabindex', '0');
    heading.focus();
  });
  await frames(page, 2);
  const b = await readBuild(page);
  expect(b.states.slice(0, 4).every(isFinal)).toBe(true);
  expect(b.states[4]).toBe('pending');
  expect(await activeIs(page, '#stack h2')).toBe(true);
});

test('focus entering a link in Projects finishes About and Projects, keeps focus and shows the 2px accent ring', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startPaused(page);
  await untilFrames(page, (b) => isFinal(b.states[0]), 'hero done');
  // A key press first, so a script focus counts as keyboard focus (:focus-visible).
  await page.keyboard.press('Shift');
  await page.evaluate(() =>
    (document.querySelector('#projects a.sp-card-link') as HTMLElement).focus(),
  );
  await frames(page, 2);
  const b = await readBuild(page);
  expect(b.states.slice(0, 3).every(isFinal)).toBe(true);
  expect(b.states[3]).toBe('pending');
  expect(await activeIs(page, '#projects a.sp-card-link')).toBe(true);
  const ring = await page.evaluate(() => {
    const el = document.querySelector('#projects a.sp-card-link') as Element;
    const probe = document.createElement('div');
    probe.style.outlineColor = 'var(--accent)';
    document.body.append(probe);
    const accent = getComputedStyle(probe).outlineColor;
    probe.remove();
    const cs = getComputedStyle(el);
    return {
      width: cs.outlineWidth,
      style: cs.outlineStyle,
      color: cs.outlineColor,
      accent,
    };
  });
  expect(ring.width).toBe('2px');
  expect(ring.style).toBe('solid');
  expect(ring.color).toBe(ring.accent);
});

for (const target of [
  '.sp-nav-link[href="#about"]',
  '#main',
  '#top .sp-hero-actions a',
]) {
  test(`focus moving to ${target} during the boot finishes the hero within a frame`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await startPaused(page);
    await untilFrames(
      page,
      (b) => b.states[0] !== 'pending' && !isFinal(b.states[0]),
      'hero started',
    );
    await page.evaluate(
      (q) => (document.querySelector(q) as HTMLElement).focus(),
      target,
    );
    await frames(page, 2);
    expect(isFinal((await readBuild(page)).states[0])).toBe(true);
    expect(await activeIs(page, target)).toBe(true);
  });
}

for (const width of [1024, 800]) {
  test(`a width change to ${width} finishes the building section and the next one builds on its trigger with its window on the new box`, async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await startPaused(page);
    await untilFrames(page, (b) => b.states[0] === 'building', 'hero building');
    await page.setViewportSize({ width, height: 800 });
    await frames(page, 4);
    expect((await readBuild(page)).states[0]).toBe('skipped');

    await scrollSectionIntoBuild(page, 'about');
    await untilFrames(
      page,
      (b) => b.states[1] === 'building',
      'about building',
    );
    await frames(page, 3);
    const aligned = await page.evaluate(() => {
      const w = (
        document.querySelector('.sp-window[data-section="about"]') as Element
      ).getBoundingClientRect();
      const s = (
        document.getElementById('about') as Element
      ).getBoundingClientRect();
      return [w.x - s.x, w.y - s.y, w.width - s.width, w.height - s.height];
    });
    aligned.forEach((d) => expect(Math.abs(d)).toBeLessThanOrEqual(1));
  });
}

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('a height-only resize, as when the URL bar shows or hides, lets the build continue', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await startPaused(page);
    await untilFrames(page, (b) => b.states[0] === 'building', 'hero building');
    const before = Number(
      await page.evaluate(() =>
        document.documentElement.getAttribute('data-build-progress'),
      ),
    );
    await page.setViewportSize({ width: 375, height: 700 });
    await frames(page, 10);
    const b = await readBuild(page);
    expect(isFinal(b.states[0])).toBe(false);
    const after = Number(
      await page.evaluate(() =>
        document.documentElement.getAttribute('data-build-progress'),
      ),
    );
    expect(after).toBeGreaterThan(before);
  });
});
