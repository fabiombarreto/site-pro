// Shared helpers for the element-effects specs (PRPs/prds/stage-3-runtime.prd.md AC-1, AC-4, AC-11, AC-14, AC-15, AC-18).
// Builds on ./runtime and ./layer: time is Playwright's page.clock, so any build moment can be frozen.
import {
  expect,
  type Browser,
  type Locator,
  type Page,
} from '@playwright/test';
import {
  DESKTOP_VIEWPORT,
  IDS,
  sleep,
  snapshot,
  type Snapshot,
  type TimelineJson,
} from './runtime';

export const EFFECT_ARTIFACTS =
  '[data-build-fx], [data-build-fx-layer], .sp-build-fx, .sp-select, .sp-skel, .sp-caret, .sp-scramble, .sp-ascii, .sp-blur-cover';

// The characters a scrambled glyph may use (docs/04-animations.md decode effect).
export const SCRAMBLE_GLYPHS = '!<>-_\\/[]{}=+*^?#';

export const timelinesOnPage = (
  page: Page,
): Promise<Record<string, TimelineJson>> =>
  page.evaluate(
    (ids) =>
      Object.fromEntries(
        ids.map((id) => [
          id,
          JSON.parse(
            document.getElementById(id)?.getAttribute('data-build') ?? '{}',
          ),
        ]),
      ),
    IDS,
  );

// Runs the fake clock in `step` ms slices until the named section is building (or closing) and its
// own clock has passed `ms`. `duration` is that section's compiled duration (progress is a fraction).
export async function advanceTo(
  page: Page,
  id: string,
  duration: number,
  ms: number,
  step = 20,
): Promise<Snapshot> {
  const index = IDS.indexOf(id);
  for (let i = 0; i < 8000; i++) {
    await page.clock.runFor(step);
    await sleep(4);
    const s = await snapshot(page);
    const state = s.states[index];
    if (
      (state === 'building' || state === 'closing') &&
      s.progress * duration >= ms
    ) {
      return s;
    }
  }
  throw new Error(`timed out waiting for ${id} t=${ms}`);
}

export async function advanceUntilState(
  page: Page,
  id: string,
  state: string,
  step = 50,
): Promise<Snapshot> {
  const index = IDS.indexOf(id);
  for (let i = 0; i < 8000; i++) {
    await page.clock.runFor(step);
    await sleep(4);
    const s = await snapshot(page);
    if (s.states[index] === state) return s;
  }
  throw new Error(`timed out waiting for ${id} to be ${state}`);
}

export async function scrollSectionIntoBuild(
  page: Page,
  id: string,
): Promise<void> {
  const top = await page.evaluate(
    (sectionId) =>
      (document.getElementById(sectionId) as Element).getBoundingClientRect()
        .top + window.scrollY,
    id,
  );
  await page.evaluate(
    (y) => window.scrollTo({ top: y - 500, behavior: 'instant' }),
    top,
  );
}

// Pauses the runtime without stopping Playwright's clock: the build reads a hidden tab as a pause
// (PRD AC-16), so the page keeps its mid-build state while timers run for tools such as axe.
export async function freezeBuild(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.resume();
}

export interface TargetFx {
  fx: string | null;
  clip: string;
  // Inline clip-path of each direct child: the pop effect clips the created
  // elements (the buttons), not their wrapper.
  childClips: string[];
  opacity: string;
  // Computed opacity of the target's own <img> (the hero photo), or '' when it has none.
  imgOpacity: string;
  pointerEvents: string;
}

export interface HeroFrame {
  title: TargetFx;
  role: TargetFx;
  photo: TargetFx;
  intro: TargetFx;
  links: TargetFx;
  select: number;
  skeletonBlocks: number;
  caret: number;
  scramble: string;
  inlineStyled: number;
}

export const heroFrame = (page: Page): Promise<HeroFrame> =>
  page.evaluate(() => {
    const target = (name: string): HTMLElement =>
      document.querySelector(
        `#top [data-build-target="${name}"]`,
      ) as HTMLElement;
    const read = (name: string) => {
      const el = target(name);
      const style = getComputedStyle(el);
      const img = el.querySelector('img');
      return {
        imgOpacity: img ? getComputedStyle(img).opacity : '',
        fx: el.getAttribute('data-build-fx'),
        clip: el.style.clipPath,
        childClips: [...el.children].map(
          (c) => (c as HTMLElement).style.clipPath,
        ),
        opacity: style.opacity,
        pointerEvents: style.pointerEvents,
      };
    };
    const count = (selector: string) =>
      document.querySelectorAll(selector).length;
    return {
      title: read('title'),
      role: read('role'),
      photo: read('photo'),
      intro: read('intro'),
      links: read('links'),
      select: count('.sp-select'),
      skeletonBlocks: count('.sp-skel-block'),
      caret: count('.sp-caret'),
      scramble: [...document.querySelectorAll('.sp-scramble')]
        .map((e) => e.textContent ?? '')
        .join(''),
      inlineStyled: [...document.querySelectorAll('#top, #top *')].filter(
        (e) =>
          (e as HTMLElement).style.clipPath ||
          (e as HTMLElement).style.opacity ||
          (e as HTMLElement).style.transform ||
          (e as HTMLElement).style.pointerEvents,
      ).length,
    };
  });

export const windowCommand = (page: Page): Promise<string> =>
  page.evaluate(() =>
    (
      document.querySelector('.sp-window .sp-window-cmd')?.textContent ?? ''
    ).replace('█', ''),
  );

export interface Boxes {
  height: number;
  text: string;
  boxes: number[][];
}

export const boxes = (page: Page): Promise<Boxes> =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const els = [
      ...document.querySelectorAll(
        'main > section, main h1, main h2, main h3, main p, main a, main article, main li, main .sp-tag, footer, footer p',
      ),
    ];
    return {
      height: document.documentElement.scrollHeight,
      text: (document.querySelector('main')?.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim(),
      boxes: els.map((e) => {
        const r = e.getBoundingClientRect();
        return [r.x + scrollX, r.y + scrollY, r.width, r.height];
      }),
    };
  });

export function expectSameBoxes(
  actual: Boxes,
  ready: Boxes,
  label: string,
): void {
  expect(
    Math.abs(actual.height - ready.height),
    `${label}: document height`,
  ).toBeLessThanOrEqual(0.5);
  expect(actual.boxes, `${label}: box count`).toHaveLength(ready.boxes.length);
  actual.boxes.forEach((box, i) =>
    box.forEach((v, j) =>
      expect(
        Math.abs(v - (ready.boxes[i]?.[j] ?? Infinity)),
        `${label}: box ${i} coordinate ${j}`,
      ).toBeLessThanOrEqual(0.5),
    ),
  );
  expect(actual.text, `${label}: main text`).toBe(ready.text);
}

// The page as a visitor sees it without any build: a reduced-motion visit renders it at once.
export async function readyPage(
  browser: Browser,
  viewport = DESKTOP_VIEWPORT,
): Promise<{ boxes: Boxes; tree: string; text: string }> {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/', { waitUntil: 'load' });
  await expect(page.locator('html')).toHaveAttribute(
    'data-build-status',
    'done',
  );
  const result = {
    boxes: await boxes(page),
    tree: await mainTree(page.locator('main')),
    text: await mainText(page),
  };
  await ctx.close();
  return result;
}

// The no-JS page, the reference the accessibility tree and text of <main> must always equal.
export async function noScriptPage(
  browser: Browser,
  viewport = DESKTOP_VIEWPORT,
): Promise<{ tree: string; text: string }> {
  const ctx = await browser.newContext({ viewport, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/', { waitUntil: 'load' });
  const result = {
    tree: await mainTree(page.locator('main')),
    text: await mainText(page),
  };
  await ctx.close();
  return result;
}

export const mainTree = (main: Locator): Promise<string> => main.ariaSnapshot();

export const mainText = (page: Page): Promise<string> =>
  page.evaluate(() =>
    (document.querySelector('main')?.textContent ?? '')
      .replace(/\s+/g, ' ')
      .trim(),
  );

export const layoutShiftInit = (): void => {
  const store = window as unknown as { __cls: number };
  store.__cls = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as unknown as {
      hadRecentInput: boolean;
      value: number;
    }[]) {
      if (!entry.hadRecentInput) store.__cls += entry.value;
    }
  }).observe({ type: 'layout-shift', buffered: true });
};

export const layoutShift = (page: Page): Promise<number> =>
  page.evaluate(() => (window as unknown as { __cls: number }).__cls);

export const effectArtifacts = (page: Page): Promise<number> =>
  page.evaluate(
    (selector) => document.querySelectorAll(selector).length,
    EFFECT_ARTIFACTS,
  );
