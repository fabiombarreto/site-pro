// PRPs/prds/stage-3-runtime.prd.md AC-7 Skip (Esc, the dock button, the window title and command bars; the window body
// does not skip; Esc yields to the open mobile menu) and AC-8 Run all (Shift + Esc) (phase 4 plan: AC-A1, AC-A2)
// Shift + Esc on real Chrome for Windows is an owner step (docs/02-experience.md): here the keydown is dispatched to
// the page, so these tests prove the runtime's handler, not the browser's reservation of the key.
import { expect, test } from '@playwright/test';
import { DESKTOP_VIEWPORT } from './support/runtime';
import { scrollSectionIntoBuild } from './support/effects';
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

const CREATED = /^✔ (\w+) Section created\. \(\d+(\.\d+)?s\)$/;

test('Esc finishes the building section as created and leaves the next one waiting for its trigger', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startPaused(page);
  await untilFrames(page, (b) => b.states[0] === 'building', 'hero building');
  await page.keyboard.press('Escape');
  await frames(page, 2);

  expect((await readBuild(page)).states[0]).toBe('skipped');
  expect(await page.locator('.sp-window').count()).toBe(0);
  expect((await dockInfo(page)).text).toMatch(
    /^✔ Hero Section created\. \(\d+(\.\d+)?s\)$/,
  );
  // 600 ms later, no trigger has fired: About still waits.
  await frames(page, 30);
  expect((await readBuild(page)).states[1]).toBe('pending');
});

test('the dock button named "Skip this section\'s build" skips the section', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startPaused(page);
  await skipHero(page);
  await scrollSectionIntoBuild(page, 'projects');
  // Projects triggers About first (order), both at turbo; wait for Projects itself.
  await untilFrames(page, (b) => b.states[2] === 'building', 'projects');
  expect(await dockButtonName(page, 'skip')).toBe("Skip this section's build");
  await clickIn(page, '[data-dock-action="skip"]');
  await frames(page, 2);
  expect((await readBuild(page)).states[2]).toBe('skipped');
  expect(await page.locator('.sp-window').count()).toBe(0);
  expect((await dockInfo(page)).text).toMatch(
    /^✔ Projects Section created\. \(\d+(\.\d+)?s\)$/,
  );
});

test('a click on the window title bar skips, a click on the window body does not, and a click on the command bar skips', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await startPaused(page);
  await skipHero(page);

  await scrollSectionIntoBuild(page, 'about');
  await untilFrames(page, (b) => b.states[1] === 'building', 'about building');
  const probe = await page.evaluate(() => {
    const h2 = (
      document.querySelector('#about h2') as Element
    ).getBoundingClientRect();
    const x = h2.x + 4;
    const y = h2.y + h2.height / 2;
    const hit = document.elementFromPoint(x, y);
    const bar = (
      document.querySelector(
        '.sp-window[data-section="about"] .sp-window-bar',
      ) as Element
    ).getBoundingClientRect();
    return {
      body: [x, y],
      bodyInLayer: !!hit?.closest('[data-build-layer]'),
      bar: [bar.x + bar.width / 2, bar.y + bar.height / 2],
    };
  });
  expect(probe.bodyInLayer).toBe(false);
  await page.mouse.click(probe.body[0] as number, probe.body[1] as number);
  await frames(page, 2);
  expect(isFinal((await readBuild(page)).states[1])).toBe(false);

  await page.mouse.click(probe.bar[0] as number, probe.bar[1] as number);
  await frames(page, 2);
  expect((await readBuild(page)).states[1]).toBe('skipped');
  expect((await dockInfo(page)).text).toMatch(CREATED);

  await scrollSectionIntoBuild(page, 'stack');
  await untilFrames(page, (b) => b.states[3] === 'building', 'stack building');
  const cmd = await page.evaluate(() => {
    const r = (
      document.querySelector(
        '.sp-window[data-section="stack"] .sp-window-cmd',
      ) as Element
    ).getBoundingClientRect();
    return [r.x + r.width / 2, r.y + r.height / 2];
  });
  await page.mouse.click(cmd[0] as number, cmd[1] as number);
  await frames(page, 2);
  expect((await readBuild(page)).states[3]).toBe('skipped');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('Esc with the mobile menu open only closes the menu; the next Esc skips', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await startPaused(page);
    await untilFrames(page, (b) => b.states[0] === 'building', 'hero building');
    await clickIn(page, '.sp-menu-toggle');
    expect(
      await page.evaluate(() =>
        (document.getElementById('mobile-menu') as Element).matches(
          ':popover-open',
        ),
      ),
    ).toBe(true);

    await page.keyboard.press('Escape');
    await frames(page, 2);
    expect(
      await page.evaluate(() =>
        (document.getElementById('mobile-menu') as Element).matches(
          ':popover-open',
        ),
      ),
    ).toBe(false);
    expect(isFinal((await readBuild(page)).states[0])).toBe(false);

    await page.keyboard.press('Escape');
    await frames(page, 2);
    expect((await readBuild(page)).states[0]).toBe('skipped');
  });
});

test('Shift + Esc finishes every remaining section within a frame and shows the complete state with Replay', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await startPaused(page);
  await skipHero(page);
  await scrollSectionIntoBuild(page, 'about');
  await untilFrames(page, (b) => b.states[1] === 'building', 'about building');
  await page.keyboard.press('Shift+Escape');
  await frames(page, 2);

  const b = await readBuild(page);
  expect(b.states.every(isFinal)).toBe(true);
  expect(await page.locator('.sp-window').count()).toBe(0);
  const d = await dockInfo(page);
  expect(d.state).toBe('done');
  expect(d.text).toMatch(/^✔ Build complete: 5 sections in \d+(\.\d+)?s$/);
  expect(d.shown).toEqual(['replay']);
});

test('Shift + Esc also finishes sections that no trigger has reached', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startPaused(page);
  await skipHero(page);
  expect((await readBuild(page)).states[1]).toBe('pending');
  await page.keyboard.press('Shift+Escape');
  await frames(page, 2);
  expect((await readBuild(page)).states.every(isFinal)).toBe(true);
  expect((await dockInfo(page)).text).toMatch(
    /^✔ Build complete: 5 sections in \d+(\.\d+)?s$/,
  );
});
