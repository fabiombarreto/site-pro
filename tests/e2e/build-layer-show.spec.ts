// PRPs/prds/stage-3-runtime.prd.md AC-1 first load (layer parts), AC-2 dock and window per section,
// AC-4 one aria-hidden overlay root outside <main>, AC-11 pointer events (phase 2 plan: AC-A1, AC-A2, AC-A3, AC-A4)
// Time is Playwright's page.clock; the layer is driven by the runtime clock so any moment can be frozen.
import { expect, test } from '@playwright/test';
import { DESKTOP_VIEWPORT, runUntil } from './support/runtime';
import {
  heroAt,
  layerState,
  navAttr,
  startPaused,
  stepUntil,
} from './support/layer';

test.use({ viewport: DESKTOP_VIEWPORT });

test('shows the boot, folds it into the dock, opens and closes the hero window, then builds About in the dock', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const duration = await startPaused(page);

  await heroAt(page, 500, duration);
  let l = await layerState(page);
  expect(l.boot).toBe(1);
  expect(l.windows).toBe(0);
  expect(l.bootText).toContain('start');
  expect(l.fnToken?.startsWith('start')).toBe(true);
  expect(l.dockOpacity).toBe('0');

  const at1000 = await heroAt(page, 1000, duration);
  l = await layerState(page);
  expect(l.bootText).toContain('startSite();');
  expect(l.bootText).toContain('Initializing application...');
  expect(l.bootText).toContain('Opening hero.tsx...');
  expect(['sliding', 'in']).toContain(await navAttr(page));
  expect(at1000.states[0]).not.toBe('done');

  await heroAt(page, 1450, duration);
  l = await layerState(page);
  expect(l.boot).toBe(0);
  expect(l.windows).toBe(1);
  expect(l.file).toBe('hero.tsx');
  expect(l.dockState).toBe('building');
  expect(l.dockOpacity).toBe('1');
  const aligned = await page.evaluate(() => {
    const w = (
      document.querySelector('.sp-window') as Element
    ).getBoundingClientRect();
    const s = (
      document.getElementById('top') as Element
    ).getBoundingClientRect();
    return [w.x - s.x, w.y - s.y, w.width - s.width, w.height - s.height];
  });
  aligned.forEach((d) => expect(Math.abs(d)).toBeLessThanOrEqual(0.5));

  await runUntil(page, (s) => s.states[0] === 'closing', 20000, 'hero closing');
  l = await layerState(page);
  expect(l.dockState).toBe('created');
  expect(l.dockText).toMatch(/✔ Hero Section created\. \(\d+\.\d{2}s\)/);

  await runUntil(page, (s) => s.states[0] === 'done', 20000, 'hero done');
  l = await layerState(page);
  expect(await navAttr(page)).toBe('in');
  expect(l.windows).toBe(0);
  expect(l.boot).toBe(0);
  expect(l.dockState).toBe('idle');
  expect(l.dockText).toContain('✓ 1/5 sections');
  expect(l.dockText).toContain('❯');
  expect(l.dockText).toContain('scroll ↓');

  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  await stepUntil(
    page,
    (x) =>
      x.dockState === 'typing' &&
      x.dockText.includes('Reading about.md...') &&
      x.dockText.includes('renderAbout();'),
    'about command and log in the dock',
  );
  await runUntil(
    page,
    (s) => s.states[1] === 'building',
    20000,
    'about building',
  );
  l = await layerState(page);
  expect(l.windows).toBe(1);
  expect(l.file).toBe('about.md');
  expect(l.dockState).toBe('building');
  expect(l.dockText).toContain('Building about…');
});

test('keeps the layer in one decorative overlay outside main and only catches clicks on the bars', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await startPaused(page);
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');

  const outlines = await page.evaluate(() =>
    [...document.querySelectorAll('.sp-outline')].map((o) => ({
      text: o.textContent ?? '',
      hidden: !!o.closest('[aria-hidden="true"]'),
    })),
  );
  expect(outlines).toHaveLength(4);
  for (const file of ['about.md', 'projects.tsx', 'stack.tsx', 'contact.tsx']) {
    expect(outlines.some((o) => o.text.includes(file))).toBe(true);
  }
  expect(outlines.every((o) => o.hidden)).toBe(true);

  const tree = await page.locator('body').ariaSnapshot();
  expect(tree).not.toMatch(
    /projects\.tsx|about\.md|stack\.tsx|contact\.tsx|startSite|hero\.tsx/,
  );

  const top = await page.evaluate(
    () =>
      (document.getElementById('projects') as Element).getBoundingClientRect()
        .top + window.scrollY,
  );
  await page.evaluate(
    (y) => window.scrollTo({ top: y - 500, behavior: 'instant' }),
    top,
  );
  await runUntil(
    page,
    (s) => s.states[2] === 'building',
    90000,
    'projects building',
  );

  const inv = await page.evaluate(() => {
    const root = document.querySelector('[data-build-layer]') as HTMLElement;
    const win = root.querySelector(
      '.sp-window[data-section="projects"]',
    ) as HTMLElement;
    const all = [...root.querySelectorAll('*')];
    const allowed = new Set([
      'opacity',
      'transform',
      'clip-path',
      'offset',
      'easing',
      'composite',
      'computedOffset',
    ]);
    const badProps = new Set<string>();
    for (const a of document.getAnimations()) {
      const effect = a.effect as KeyframeEffect | null;
      for (const kf of effect?.getKeyframes() ?? []) {
        for (const k of Object.keys(kf)) if (!allowed.has(k)) badProps.add(k);
      }
    }
    const badTransitions = all
      .flatMap((e) => {
        const cs = getComputedStyle(e);
        const d = cs.transitionDuration.split(',');
        const p = cs.transitionProperty.split(',');
        return p
          .filter((_, i) => parseFloat(d[i % d.length] ?? '0') > 0)
          .map((x) => x.trim());
      })
      .filter((x) => !['transform', 'opacity', 'clip-path'].includes(x));
    const pe = (el: Element) => getComputedStyle(el).pointerEvents;
    const bar = (
      win.querySelector('.sp-window-bar') as Element
    ).getBoundingClientRect();
    const barHit = document.elementFromPoint(
      bar.x + bar.width / 2,
      bar.y + bar.height / 2,
    );
    const h2 = (
      document.querySelector('#projects h2') as Element
    ).getBoundingClientRect();
    const hit = document.elementFromPoint(h2.x + 4, h2.y + h2.height / 2);
    return {
      outside: !(document.querySelector('main') as Element).contains(root),
      sibling:
        root.parentElement === document.body &&
        !!root.previousElementSibling?.classList.contains('sp-page'),
      // Stage 3 phase 4 (AC-4, AC-18): the dock is a role=group named "Site build" holding the only
      // real controls; every other layer element stays aria-hidden and unfocusable.
      controls: root.querySelectorAll(
        'button:not(.sp-dock-btn), a, input, select, textarea, [tabindex]',
      ).length,
      dockButtons: root.querySelectorAll(
        '.sp-dock[role="group"] button.sp-dock-btn',
      ).length,
      groupName: root.querySelector('.sp-dock')?.getAttribute('aria-label'),
      rootHidden: root.hasAttribute('aria-hidden'),
      unhidden: all
        .filter((e) => !e.closest('[aria-hidden="true"]'))
        .filter(
          (e) => !e.closest('.sp-dock-controls') && !e.closest('.sp-dock'),
        ).length,
      dockHiddenText: [
        '.sp-dock-log',
        '.sp-dock-status',
        '.sp-dock-hint',
      ].every(
        (s) => root.querySelector(s)?.closest('[aria-hidden="true"]') !== null,
      ),
      windows: root.querySelectorAll('.sp-window').length,
      badProps: [...badProps],
      badTransitions,
      rootPE: pe(root),
      winPE: pe(win),
      bodyPE: pe(win.querySelector('.sp-window-body') as Element),
      barPE: pe(win.querySelector('.sp-window-bar') as Element),
      cmdPE: pe(win.querySelector('.sp-window-cmd') as Element),
      barHit: !!barHit?.closest('.sp-window-bar'),
      pageHit: !!hit && !root.contains(hit),
      stackPE: pe(document.getElementById('stack') as Element),
      heroPE: pe(document.getElementById('top') as Element),
    };
  });
  expect(inv.outside).toBe(true);
  expect(inv.sibling).toBe(true);
  expect(inv.controls).toBe(0);
  expect(inv.dockButtons).toBe(5);
  expect(inv.groupName).toBe('Site build');
  expect(inv.rootHidden).toBe(false);
  expect(inv.dockHiddenText).toBe(true);
  expect(inv.unhidden).toBe(0);
  expect(inv.windows).toBe(1);
  expect(inv.badProps).toEqual([]);
  expect(inv.badTransitions).toEqual([]);
  expect(inv.rootPE).toBe('none');
  expect(inv.winPE).toBe('none');
  expect(inv.bodyPE).toBe('none');
  expect(inv.barPE).toBe('auto');
  expect(inv.cmdPE).toBe('auto');
  expect(inv.barHit).toBe(true);
  expect(inv.pageHit).toBe(true);
  expect(inv.stackPE).toBe('none');
  expect(inv.heroPE).toBe('auto');
});
