// PRPs/prds/stage-3-runtime.prd.md AC-18 Accessibility (the dock's controls are real buttons with their names, in a group
// named "Site build", reachable by Tab, each with the 2px accent focus ring; the status text is not exposed), AC-4 (the
// only non-aria-hidden build-layer element is that dock) (phase 4 plan: AC-A4, AC-A11)
// Real clock: the ready docks (saved infinity, reduced motion) need no build to run. Names while building are asserted
// in tests/e2e/controls-skip.spec.ts and controls-speed.spec.ts, Replay in controls-done-replay.spec.ts.
import { expect, test, type Page } from '@playwright/test';
import { DESKTOP_VIEWPORT, useInstantBuild } from './support/runtime';

test.use({ viewport: DESKTOP_VIEWPORT });

async function tabToDock(page: Page): Promise<boolean> {
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab');
    const hit = await page.evaluate(() =>
      document.activeElement?.hasAttribute('data-dock-action'),
    );
    if (hit) return true;
  }
  return false;
}

test('the ready dock is a group named "Site build" holding real buttons, with its status text hidden from assistive technology', async ({
  page,
}) => {
  await useInstantBuild(page);
  await page.goto('/');
  const group = page.getByRole('group', { name: 'Site build' });
  await expect(group).toHaveCount(1);
  await expect(
    group.getByRole('button', {
      name: 'Build speed: ∞ (instant). Switch to 1×',
    }),
  ).toBeVisible();
  const tags = await page.evaluate(() =>
    [...document.querySelectorAll('.sp-dock [data-dock-action]')].map(
      (b) => b.tagName,
    ),
  );
  expect(tags).toEqual(['BUTTON', 'BUTTON', 'BUTTON', 'BUTTON', 'BUTTON']);
  const hidden = await page.evaluate(() =>
    ['.sp-dock-log', '.sp-dock-status', '.sp-dock-hint'].map(
      (s) =>
        document.querySelector(s)?.closest('[aria-hidden="true"]') !== null,
    ),
  );
  expect(hidden).toEqual([true, true, true]);
  // The status text is not part of the accessibility tree.
  expect(await group.ariaSnapshot()).not.toContain('5/5 sections');
});

test('the reduced-motion dock exposes a button named "Play the build animation"', async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    viewport: DESKTOP_VIEWPORT,
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(
    page
      .getByRole('group', { name: 'Site build' })
      .getByRole('button', { name: 'Play the build animation' }),
  ).toBeVisible();
  await ctx.close();
});

test('Tab reaches the dock button and it shows the 2px accent ring', async ({
  page,
}) => {
  await useInstantBuild(page);
  await page.goto('/');
  await expect(page.locator('.sp-dock')).toHaveAttribute('data-state', 'idle');
  expect(await tabToDock(page)).toBe(true);
  const ring = await page.evaluate(() => {
    const el = document.activeElement as Element;
    const probe = document.createElement('div');
    probe.style.outlineColor = 'var(--accent)';
    document.body.append(probe);
    const accent = getComputedStyle(probe).outlineColor;
    probe.remove();
    const cs = getComputedStyle(el);
    return {
      width: cs.outlineWidth,
      style: cs.outlineStyle,
      offset: cs.outlineOffset,
      color: cs.outlineColor,
      accent,
    };
  });
  expect(ring.width).toBe('2px');
  expect(ring.style).toBe('solid');
  expect(ring.offset).toBe('2px');
  expect(ring.color).toBe(ring.accent);
});

test('the text and accessibility tree of main equal the no-JS page with the ready dock present', async ({
  page,
  browser,
}) => {
  await useInstantBuild(page);
  await page.goto('/');
  await expect(page.locator('.sp-dock')).toHaveCount(1);
  const withDock = await page.locator('main').ariaSnapshot();

  const bare = await browser.newContext({
    viewport: DESKTOP_VIEWPORT,
    javaScriptEnabled: false,
  });
  const barePage = await bare.newPage();
  await barePage.goto('/');
  const without = await barePage.locator('main').ariaSnapshot();
  await bare.close();
  expect(withDock).toBe(without);
});
