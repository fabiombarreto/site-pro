// PRPs/prds/stage-4-sections-effects.prd.md AC-6 Section budgets (the dock's created line within 2.5 s after the hero,
// the hero within 3.2 s), AC-7 Sections build with their effects (the window opens at Enter while the dock log is
// shown), AC-8 Commands and logs from the content (the per-section dock logs) (phase 3 plan: AC-A1, AC-A2, AC-A8)
// Time is Playwright's page.clock; each section is triggered in turn and its dock and window are read.
import { expect, test } from '@playwright/test';
import { DESKTOP_VIEWPORT, runUntil, sleep } from './support/runtime';
import { heroAt, layerState, startPaused, stepUntil } from './support/layer';
import { scrollSectionIntoBuild } from './support/effects';

test.use({ viewport: DESKTOP_VIEWPORT });
test.setTimeout(240_000);

const SECTIONS = [
  {
    id: 'about',
    index: 1,
    label: 'About',
    command: 'renderAbout();',
    log: 'Reading about.md...',
    file: 'about.md',
  },
  {
    id: 'projects',
    index: 2,
    label: 'Projects',
    command: 'renderProjects();',
    log: 'Fetching projects... 4 found',
    file: 'projects.tsx',
  },
  {
    id: 'stack',
    index: 3,
    label: 'Stack',
    command: 'renderStack();',
    log: 'Resolving dependencies...',
    file: 'stack.tsx',
  },
  {
    id: 'contact',
    index: 4,
    label: 'Contact',
    command: 'renderContact();',
    log: 'Opening channels...',
    file: 'contact.tsx',
  },
];

test('shows each section its own dock log while the window opens at Enter, then the created line within 2.5 s', async ({
  page,
}) => {
  const duration = await startPaused(page);
  await runUntil(page, (s) => s.states[0] === 'closing', 30000, 'hero closing');
  const hero = await layerState(page);
  const heroSeconds = Number(
    /✔ Hero Section created\. \((\d+\.\d{2})s\)/.exec(hero.dockText)?.[1],
  );
  expect(heroSeconds).toBeGreaterThan(0);
  expect(heroSeconds).toBeLessThanOrEqual(3.2);
  expect(duration).toBeLessThanOrEqual(3200);
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');

  for (const section of SECTIONS) {
    await scrollSectionIntoBuild(page, section.id);
    let l = await stepUntil(
      page,
      (x) =>
        x.dockState === 'typing' &&
        x.dockText.includes(section.log) &&
        x.dockText.includes(section.command),
      `${section.id} command and log in the dock`,
    );
    expect(l.dockText, section.id).toContain(section.log);

    // The window opens at Enter, while the log is still shown.
    await page.clock.runFor(32);
    await sleep(5);
    l = await layerState(page);
    expect(l.dockText, `${section.id} log held after Enter`).toContain(
      section.log,
    );
    expect(l.windows, `${section.id} window open during the log`).toBe(1);
    expect(l.file).toBe(section.file);

    // The log stays about 100 ms after Enter (about 48 ms have passed since it appeared), then the dock builds.
    let held = 48;
    while (l.dockText.includes(section.log) && held < 400) {
      await page.clock.runFor(10);
      await sleep(3);
      held += 10;
      l = await layerState(page);
    }
    expect(held, `${section.id} log hold`).toBeGreaterThanOrEqual(80);
    expect(held, `${section.id} log leaves`).toBeLessThan(400);
    expect(l.dockText).not.toContain(section.log);

    await runUntil(
      page,
      (s) => s.states[section.index] === 'closing',
      30000,
      `${section.id} closing`,
    );
    l = await layerState(page);
    const created = new RegExp(
      `✔ ${section.label} Section created\\. \\((\\d+\\.\\d{2})s\\)`,
    ).exec(l.dockText);
    expect(created, `${section.id} created line`).not.toBeNull();
    const seconds = Number(created?.[1]);
    expect(seconds, `${section.id} created seconds`).toBeLessThanOrEqual(2.5);
    await runUntil(
      page,
      (s) => s.states[section.index] === 'done',
      30000,
      `${section.id} done`,
    );
  }
});

test('keeps the hero on its boot logs, with no per-section dock log', async ({
  page,
}) => {
  const duration = await startPaused(page);
  await heroAt(page, 1000, duration);
  const l = await layerState(page);
  expect(l.bootText).toContain('Initializing application...');
  expect(l.bootText).toContain('Opening hero.tsx...');
  expect(l.bootText).not.toContain('Reading hero.tsx');
  expect(l.dockText).not.toContain('Reading hero.tsx');
});
