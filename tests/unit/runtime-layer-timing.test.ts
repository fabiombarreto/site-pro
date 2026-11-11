// PRPs/prds/stage-3-runtime.prd.md AC-1 Boot, fold and window timing; AC-2 per-section dock and window timing
// (phase 2 plan: AC-A1, AC-A2)
// The pure timing contract every build surface follows: the hero's `startSite();` enters at
// 810 ms, the window opens between windowEnd and buildStart, and so on.
import { describe, expect, it } from 'vitest';
import {
  bootLogCount,
  commandChars,
  commandEnterAt,
  dockLogEnd,
  easeOut,
  foldProgress,
  formatSeconds,
  navSlideProgress,
  progressBetween,
  spinnerFrame,
  stepIndexAt,
  windowCloseProgress,
  windowCommandChars,
  windowOpenProgress,
} from '../../src/runtime/layer-timing';

const hero = { windowEnd: 1000, buildStart: 1300, createdAt: 4000 };

describe('boot command typing', () => {
  it('types nothing before 250 ms and one character per 40 ms afterwards', () => {
    expect(commandChars(0, 12)).toBe(0);
    expect(commandChars(249, 12)).toBe(0);
    expect(commandChars(290, 12)).toBe(1);
    expect(commandChars(370, 12)).toBe(3);
  });

  it('never types past the command length', () => {
    expect(commandChars(9999, 12)).toBe(12);
  });

  it('presses enter 80 ms after the last character, at 810 ms for startSite();', () => {
    expect(commandEnterAt('startSite();'.length)).toBe(810);
  });
});

describe('boot logs', () => {
  it('shows no log before the enter, the first log at the enter and the second 100 ms later', () => {
    expect(bootLogCount(809, 810)).toBe(0);
    expect(bootLogCount(810, 810)).toBe(1);
    expect(bootLogCount(909, 810)).toBe(1);
    expect(bootLogCount(910, 810)).toBe(2);
  });

  it('never shows more than two logs', () => {
    expect(bootLogCount(60000, 810)).toBe(2);
  });
});

// PRPs/prds/stage-4-sections-effects.prd.md AC-6/AC-7 the dock keeps its log 100 ms after Enter when the window
// opens at Enter (phase 3 plan: AC-A8)
describe('dock log hold', () => {
  it('keeps the log until 100 ms after Enter when the window opens at Enter', () => {
    expect(dockLogEnd(890, 890)).toBe(990);
    expect(dockLogEnd(970, 970)).toBe(1070);
  });

  it('leaves a window that opens later than that as it was', () => {
    // The default phases open the window 100 ms after Enter, and the hero's override 270 ms after.
    expect(dockLogEnd(990, 890)).toBe(990);
    expect(dockLogEnd(1000, 730)).toBe(1000);
  });
});

describe('window and fold progress', () => {
  it('folds the boot terminal over 300 ms starting at windowEnd', () => {
    expect(foldProgress(999, hero)).toBe(0);
    expect(foldProgress(1150, hero)).toBe(0.5);
    expect(foldProgress(1300, hero)).toBe(1);
  });

  it('opens the window from windowEnd to buildStart', () => {
    expect(windowOpenProgress(1000, hero)).toBe(0);
    expect(windowOpenProgress(1150, hero)).toBe(0.5);
    expect(windowOpenProgress(1300, hero)).toBe(1);
  });

  it('closes the window over 300 ms starting at createdAt', () => {
    expect(windowCloseProgress(3999, hero)).toBe(0);
    expect(windowCloseProgress(4150, hero)).toBe(0.5);
    expect(windowCloseProgress(5000, hero)).toBe(1);
  });

  it('slides the nav in over 300 ms starting at 900 ms', () => {
    expect(navSlideProgress(899)).toBe(0);
    expect(navSlideProgress(1050)).toBe(0.5);
    expect(navSlideProgress(1200)).toBe(1);
  });

  it('treats an empty or inverted range as a step at the end', () => {
    expect(progressBetween(99, 100, 100)).toBe(0);
    expect(progressBetween(100, 100, 100)).toBe(1);
    expect(progressBetween(5, 100, 50)).toBe(0);
  });

  it('eases out from 0 to 1 and runs ahead of linear', () => {
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
  });
});

describe('window command bar', () => {
  it('types a call at 12 ms per character from the step start', () => {
    expect(windowCommandChars(1060, { call: 'abcdefghij', start: 1000 })).toBe(
      5,
    );
    expect(windowCommandChars(1000, { call: 'abcdefghij', start: 1000 })).toBe(
      0,
    );
    expect(windowCommandChars(9000, { call: 'abcdefghij', start: 1000 })).toBe(
      10,
    );
  });

  it('caps the typing time of a long call at 350 ms', () => {
    const call = 'x'.repeat(100);
    expect(windowCommandChars(1175, { call, start: 1000 })).toBe(50);
    expect(windowCommandChars(1350, { call, start: 1000 })).toBe(100);
  });

  it('shows the last step that has started and none before the first', () => {
    const steps = [{ start: 10 }, { start: 40 }, { start: 90 }];
    expect(stepIndexAt(5, steps)).toBe(-1);
    expect(stepIndexAt(10, steps)).toBe(0);
    expect(stepIndexAt(89, steps)).toBe(1);
    expect(stepIndexAt(500, steps)).toBe(2);
  });
});

describe('spinner and elapsed time', () => {
  it('advances the spinner every 80 ms and wraps after ten frames', () => {
    expect(spinnerFrame(0)).toBe(0);
    expect(spinnerFrame(79)).toBe(0);
    expect(spinnerFrame(160)).toBe(2);
    expect(spinnerFrame(800)).toBe(0);
  });

  it('formats milliseconds as seconds with two decimals by default', () => {
    expect(formatSeconds(2310)).toBe('2.31');
    expect(formatSeconds(12340, 1)).toBe('12.3');
  });
});
