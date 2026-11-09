// PRPs/prds/stage-3-runtime.prd.md AC-1 pending hero at first paint and the hero final within 3.2 s of clock time,
// AC-2 the 75 % trigger boundary and scrolling up and down without a second build, AC-4 the dashed pending outline,
// AC-11 a real click on the relay card title navigates, AC-15 the 3 s watchdog as an explicit clock bound
// (phase 5 plan: Notes, the behavior-gaps spec named in docs/context/testing.md)
// Sampling rules (phases 3 and 4): progress is rounded to 1 % (31 ms of the 3100 ms hero), a sampled moment is up
// to ~52 ms late and ~16 ms early with 20 ms slices, and a target goes live 150 ms after its step starts.
import { expect, test, type Page } from '@playwright/test';
import {
  DESKTOP_VIEWPORT,
  IDS,
  runUntil,
  sleep,
  snapshot,
  startClocked,
} from './support/runtime';
import { layerState, startPaused, stepUntil } from './support/layer';
import {
  advanceTo,
  scrollSectionIntoBuild,
  timelinesOnPage,
} from './support/effects';
import { dockInfo, frames, skipHero, untilFrames } from './support/controls';

test.use({ viewport: DESKTOP_VIEWPORT });

// ---------------------------------------------------------------------------------------------------------
// AC-1
// ---------------------------------------------------------------------------------------------------------

test('AC-1: before the runtime starts the hero is pending, hidden but laid out and in the accessibility tree', async ({
  page,
}) => {
  await page.route(/\/_astro\/.*\.js/, (route) => route.abort());
  await startClocked(page);
  const hero = await page.evaluate(() => {
    const el = document.getElementById('top') as Element;
    const style = getComputedStyle(el);
    return {
      mode: document.documentElement.getAttribute('data-build-mode'),
      state: el.getAttribute('data-build-state'),
      opacity: style.opacity,
      display: style.display,
      visibility: style.visibility,
      height: el.getBoundingClientRect().height,
    };
  });
  expect(hero.mode).toBe('pending');
  expect(hero.state).toBeNull();
  expect(hero.opacity).toBe('0');
  expect(hero.display).not.toBe('none');
  expect(hero.visibility).toBe('visible');
  expect(hero.height).toBeGreaterThan(100);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Fabio Barreto.' }),
  ).toHaveCount(1);
});

test('AC-1: the hero is final within 3.2 s of clock time, with the created line, no window and the idle dock', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const duration = await startPaused(page);
  // The hero clock may already have run a few frames before the clock was paused (at most
  // MAX_START_OFFSET_MS, which startPaused enforces): count them against the 3.2 s.
  const offset = (await snapshot(page)).progress * duration;

  const closing = await untilFrames(
    page,
    (b) => b.states[0] === 'closing',
    'hero closing',
  );
  const created = await dockInfo(page);
  expect(created.state).toBe('created');
  expect(created.text).toMatch(/^✔ Hero Section created\. \(\d+\.\d{2}s\)$/);

  const done = await untilFrames(
    page,
    (b) => b.states[0] === 'done',
    'hero done',
  );
  expect(offset + closing.t + done.t).toBeLessThanOrEqual(3200);

  await expect(page.locator('.sp-window')).toHaveCount(0);
  await expect(page.locator('.sp-boot')).toHaveCount(0);
  const idle = await dockInfo(page);
  expect(idle.state).toBe('idle');
  expect(idle.text).toContain('✓ 1/5 sections');
  expect(idle.text).toContain('❯');
  expect(idle.hint).toBe('scroll ↓');
  expect(await page.locator('.sp-dock .sp-cursor').count()).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------------------------------------
// AC-2
// ---------------------------------------------------------------------------------------------------------

const aboutTop = (page: Page): Promise<number> =>
  page.evaluate(
    () =>
      (document.getElementById('about') as Element).getBoundingClientRect().top,
  );

// About's top this far below the top of the viewport is just past the 75 % line of an 800 px viewport:
// About triggers, and the section after it (a whole About height further down) does not.
const JUST_PAST_THE_LINE = 0.75 * DESKTOP_VIEWPORT.height - 24;

// Scrolls so that About's top sits `y` px below the top of the viewport (as far as the page allows).
const placeAboutTopAt = (page: Page, y: number): Promise<void> =>
  page.evaluate((target) => {
    const el = document.getElementById('about') as Element;
    const docTop = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, docTop - target), behavior: 'instant' });
  }, y);

test('AC-2: About starts when its top crosses 75 % of the viewport height and not before, then types renderAbout(); and builds one about.md window', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await startPaused(page);
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
  const line = 0.75 * DESKTOP_VIEWPORT.height;

  // 24 px above the line (top below it): nothing starts, however long the clock runs.
  await placeAboutTopAt(page, line + 24);
  expect(await aboutTop(page)).toBeGreaterThan(line);
  await sleep(100);
  await frames(page, 40);
  expect((await snapshot(page)).states[1]).toBe('pending');
  let l = await layerState(page);
  expect(l.windows).toBe(0);
  expect(l.dockText).not.toContain('renderAbout();');

  // 24 px past the line: the dock types the command and logs the file, then the window opens.
  await placeAboutTopAt(page, line - 24);
  expect(await aboutTop(page)).toBeLessThan(line);
  await sleep(100);
  l = await stepUntil(
    page,
    (x) =>
      x.dockState === 'typing' &&
      x.dockText.includes('renderAbout();') &&
      x.dockText.includes('Reading about.md...'),
    'about command and log in the dock',
  );
  // The window opens at the same instant the log shows, so at most one window, and it is about.md.
  expect(l.windows).toBeLessThanOrEqual(1);
  if (l.windows === 1) expect(l.file).toBe('about.md');

  // At no moment are two windows open while About builds.
  let sawWindow = false;
  for (let i = 0; i < 400; i++) {
    await page.clock.runFor(20);
    await sleep(3);
    const s = await snapshot(page);
    const now = await layerState(page);
    expect(now.windows).toBeLessThanOrEqual(1);
    if (now.windows === 1) {
      sawWindow = true;
      expect(now.file).toBe('about.md');
    }
    if (s.states[1] === 'done') break;
  }
  expect(sawWindow).toBe(true);
  expect((await snapshot(page)).states[1]).toBe('done');
});

test('AC-2: after scrolling back up to built sections and down again, no window opens over them and none of their elements animates again', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await startPaused(page);
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
  await placeAboutTopAt(page, JUST_PAST_THE_LINE);
  await runUntil(page, (s) => s.states[1] === 'done', 60000, 'about done');
  const before = await dockInfo(page);
  expect(before.state).toBe('idle');

  const builtStays = (): Promise<{
    windows: number;
    markers: number;
    inlineStyled: number;
    animations: number;
    states: (string | null)[];
  }> =>
    page.evaluate(() => {
      const built = '#top, #about';
      return {
        windows: document.querySelectorAll(
          '.sp-window[data-section="top"], .sp-window[data-section="about"]',
        ).length,
        markers: document.querySelectorAll(
          '#top [data-build-fx], #about [data-build-fx]',
        ).length,
        inlineStyled: [
          ...document.querySelectorAll('#top, #top *, #about, #about *'),
        ].filter(
          (e) =>
            (e as HTMLElement).style.clipPath ||
            (e as HTMLElement).style.opacity ||
            (e as HTMLElement).style.transform,
        ).length,
        animations: document.getAnimations().filter((a) => {
          const target = (a.effect as KeyframeEffect | null)?.target;
          return !!target && !!target.closest(built);
        }).length,
        states: ['top', 'about'].map(
          (id) =>
            document.getElementById(id)?.getAttribute('data-build-state') ??
            null,
        ),
      };
    });

  const watch = async (label: string, count: number): Promise<void> => {
    for (let i = 0; i < count; i++) {
      await frames(page, 2);
      const now = await builtStays();
      expect(now.windows, `${label}: windows over built sections`).toBe(0);
      expect(now.markers, `${label}: build markers`).toBe(0);
      expect(now.inlineStyled, `${label}: inline styles`).toBe(0);
      expect(now.animations, `${label}: animations`).toBe(0);
      expect(now.states, `${label}: states`).toEqual(['done', 'done']);
    }
  };

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await sleep(50);
  await watch('scrolled up', 20);
  await placeAboutTopAt(page, JUST_PAST_THE_LINE);
  await sleep(50);
  await watch('scrolled down', 40);
});

// ---------------------------------------------------------------------------------------------------------
// AC-4
// ---------------------------------------------------------------------------------------------------------

test('AC-4: every pending section shows a dashed outline over its box, labeled with its window file name and hidden from the accessibility tree', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startPaused(page);
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
  const outlines = await page.evaluate((ids) => {
    return [...document.querySelectorAll('.sp-outline')].map((o, i) => {
      const box = o.querySelector('.sp-outline-box') as Element;
      const label = o.querySelector('.sp-outline-label') as Element;
      const own = o.getBoundingClientRect();
      const section = (
        document.getElementById(ids[i + 1] as string) as Element
      ).getBoundingClientRect();
      return {
        label: label.textContent ?? '',
        borderStyle: getComputedStyle(box).borderTopStyle,
        borderWidth: getComputedStyle(box).borderTopWidth,
        opacity: getComputedStyle(o).opacity,
        withdrawn: o.hasAttribute('data-hidden'),
        ariaHidden: !!o.closest('[aria-hidden="true"]'),
        overSection: [
          own.x - section.x,
          own.y - section.y,
          own.width - section.width,
          own.height - section.height,
        ],
      };
    });
  }, IDS);
  expect(outlines.map((o) => o.label)).toEqual([
    'about.md',
    'projects.tsx',
    'stack.tsx',
    'contact.tsx',
  ]);
  for (const o of outlines) {
    expect(o.borderStyle, `${o.label} border`).toBe('dashed');
    expect(o.borderWidth, `${o.label} border width`).toBe('1px');
    expect(o.opacity, `${o.label} opacity`).toBe('1');
    expect(o.withdrawn, `${o.label} withdrawn`).toBe(false);
    expect(o.ariaHidden, `${o.label} aria-hidden`).toBe(true);
    o.overSection.forEach((d) =>
      expect(Math.abs(d), `${o.label} box`).toBeLessThanOrEqual(1),
    );
  }
  expect(await page.locator('body').ariaSnapshot()).not.toMatch(
    /about\.md|projects\.tsx|stack\.tsx|contact\.tsx/,
  );
});

// ---------------------------------------------------------------------------------------------------------
// AC-11
// ---------------------------------------------------------------------------------------------------------

test('AC-11: with the Projects window open and the relay card created, a real click on the card title navigates to /projects/relay', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await startPaused(page);
  const tls = await timelinesOnPage(page);
  const projects = tls.projects;
  const cards = (projects?.steps ?? []).filter((s) =>
    s.call.startsWith('projects.card('),
  );
  expect(cards[0]?.call).toBe('projects.card("relay")');
  expect(cards.length).toBeGreaterThanOrEqual(3);
  await skipHero(page);
  await scrollSectionIntoBuild(page, 'projects');

  // The second card has started selecting for at most ~110 ms (its target goes live after 150 ms),
  // the relay card is created, the third and fourth cards are still hidden.
  await advanceTo(
    page,
    'projects',
    projects?.duration ?? 0,
    (cards[1]?.start ?? 0) + 60,
  );
  await page.evaluate(() => {
    const link = document.querySelector(
      '#projects .sp-projects-cell a.sp-card-link',
    ) as Element;
    window.scrollTo({
      top: link.getBoundingClientRect().top + window.scrollY - 300,
      behavior: 'instant',
    });
  });
  await page.clock.runFor(16);
  await sleep(10);

  const probe = await page.evaluate((ids) => {
    const cells = [
      ...document.querySelectorAll('#projects .sp-projects-cell'),
    ] as HTMLElement[];
    const link = cells[0]?.querySelector('a.sp-card-link') as HTMLElement;
    const r = link.getBoundingClientRect();
    const x = r.x + r.width / 2;
    const y = r.y + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      x,
      y,
      title: link.textContent,
      href: link.getAttribute('href'),
      linkHit: !!hit && link.contains(hit),
      windowOpen: !!document.querySelector(
        '.sp-window[data-section="projects"]',
      ),
      relayFx: cells[0]?.getAttribute('data-build-fx') ?? null,
      laterFx: [2, 3].map((i) => cells[i]?.getAttribute('data-build-fx')),
      states: ids.map(
        (id) =>
          document.getElementById(id)?.getAttribute('data-build-state') ?? null,
      ),
    };
  }, IDS);
  expect(probe.states[2]).toBe('building');
  expect(probe.states[3], 'scrolling for the click did not start Stack').toBe(
    'pending',
  );
  expect(probe.windowOpen).toBe(true);
  expect(probe.relayFx).toBeNull();
  expect(probe.laterFx).toEqual(['hidden', 'hidden']);
  expect(probe.title).toBe('relay');
  expect(probe.href).toBe('/projects/relay');
  expect(probe.linkHit).toBe(true);

  await Promise.all([
    page.waitForURL(/\/projects\/relay\/?$/),
    page.mouse.click(probe.x, probe.y),
  ]);
  expect(new URL(page.url()).pathname).toMatch(/^\/projects\/relay\/?$/);
});

// ---------------------------------------------------------------------------------------------------------
// AC-15
// ---------------------------------------------------------------------------------------------------------

test('AC-15: with the runtime request aborted every section is revealed within 3 s of clock time, with no build-layer element on screen', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.clock.install({ time: 0 });
  // Clock times of the pending mode being set by the head script and of it being removed. The
  // clock's own init script runs first, so performance.now is the fake clock in these callbacks.
  await page.addInitScript(() => {
    const w = window as unknown as {
      __armedAt?: number;
      __revealedAt?: number;
    };
    new MutationObserver((records) => {
      for (const r of records) {
        const value = (r.target as Element).getAttribute('data-build-mode');
        if (value === 'pending' && w.__armedAt === undefined) {
          w.__armedAt = performance.now();
        } else if (
          value === null &&
          w.__armedAt !== undefined &&
          w.__revealedAt === undefined
        ) {
          w.__revealedAt = performance.now();
        }
      }
    }).observe(document, {
      attributes: true,
      attributeFilter: ['data-build-mode'],
      subtree: true,
    });
  });
  await page.route(/\/_astro\/.*\.js/, (route) => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.clock.pauseAt(1500);
  expect((await snapshot(page)).mode).toBe('pending');

  let revealed = false;
  for (let i = 0; i < 45 && !revealed; i++) {
    await page.clock.runFor(100);
    await sleep(5);
    revealed = (await snapshot(page)).mode === null;
  }
  expect(revealed).toBe(true);

  const times = await page.evaluate(() => {
    const w = window as unknown as {
      __armedAt?: number;
      __revealedAt?: number;
    };
    return { armed: w.__armedAt, revealed: w.__revealedAt };
  });
  expect(times.armed).toBeDefined();
  expect(times.revealed).toBeDefined();
  expect(times.armed as number).toBeLessThan(1500);
  expect(
    (times.revealed as number) - (times.armed as number),
  ).toBeLessThanOrEqual(3050);

  const after = await snapshot(page);
  expect(after.status).toBe('failed');
  expect(after.opacity.every((o) => o === '1')).toBe(true);
  const layer = await page.evaluate(
    () =>
      document.querySelectorAll(
        '.sp-build-layer, [data-build-layer], .sp-boot, .sp-dock, .sp-window, .sp-outline',
      ).length,
  );
  expect(layer).toBe(0);
});
