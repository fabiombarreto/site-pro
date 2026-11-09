// Shared helpers for the build-layer specs (PRPs/prds/stage-3-runtime.prd.md AC-1, AC-4, AC-11, AC-21).
// Builds on the Phase 1 helpers in ./runtime (startClocked, runUntil, snapshot).
import type { Page } from '@playwright/test';
import { sleep, snapshot, startClocked, type Snapshot } from './runtime';

export interface LayerState {
  boot: number;
  bootText: string;
  fnToken: string | null;
  windows: number;
  file: string | null;
  dockState: string | null;
  dockText: string;
  dockOpacity: string | null;
}

export const layerState = (page: Page): Promise<LayerState> =>
  page.evaluate(() => {
    const q = (s: string) => document.querySelector(s);
    const dock = q('.sp-dock');
    return {
      boot: document.querySelectorAll('.sp-boot').length,
      bootText: q('.sp-boot')?.textContent ?? '',
      fnToken: q('.sp-boot .sp-tok-function')?.textContent ?? null,
      windows: document.querySelectorAll('.sp-window').length,
      file: q('.sp-window')?.getAttribute('data-file') ?? null,
      dockState: dock?.getAttribute('data-state') ?? null,
      dockText: dock?.textContent ?? '',
      dockOpacity: dock ? getComputedStyle(dock).opacity : null,
    };
  });

export const navAttr = (page: Page): Promise<string | null> =>
  page.evaluate(() => document.documentElement.getAttribute('data-build-nav'));

export const durationOf = (page: Page, id = 'top'): Promise<number> =>
  page.evaluate(
    (sectionId) =>
      JSON.parse(
        document.getElementById(sectionId)?.getAttribute('data-build') ?? '{}',
      ).duration as number,
    id,
  );

// The hero's own clock (boot included) starts when the runtime module runs, which is before goto
// resolves, and Playwright's clock keeps running in real time until pauseAt. The clock is therefore
// paused straight after goto, before any other page read, to keep that gap as short as possible.

// Starts a clocked page, then pauses the fake clock so only runFor advances it.
export async function startPaused(page: Page): Promise<number> {
  await startClocked(page);
  await page.clock.pauseAt(60000);
  return durationOf(page);
}

// Runs the hero until its clock passes `ms` (progress is the fraction of the hero timeline).
export async function heroAt(
  page: Page,
  ms: number,
  duration: number,
): Promise<Snapshot> {
  for (let i = 0; i < 300; i++) {
    await page.clock.runFor(100);
    await sleep(5);
    const s = await snapshot(page);
    if (s.progress * duration >= ms && s.states[0] !== 'done') return s;
  }
  throw new Error(`timed out waiting for hero t=${ms}`);
}

export async function stepUntil(
  page: Page,
  done: (l: LayerState) => boolean,
  label: string,
): Promise<LayerState> {
  for (let i = 0; i < 400; i++) {
    await page.clock.runFor(16);
    await sleep(2);
    const l = await layerState(page);
    if (done(l)) return l;
  }
  throw new Error(`timed out waiting for ${label}`);
}
