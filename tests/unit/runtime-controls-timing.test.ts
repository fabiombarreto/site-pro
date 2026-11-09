// PRPs/prds/stage-3-runtime.prd.md AC-3 Scroll hint (4 s idle), AC-7 Skip keys (Esc yields to a popover),
// AC-8 Run all key (Shift + Esc), AC-12 only a width change is a resize, AC-13 speed cycle, names and storage,
// AC-5 the queued n/5 text (phase 4 plan: AC-A1, AC-A3, AC-A10)
// Pure mappings and copy; no DOM.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { persistSpeed } from '../../src/scripts/build-mode';
import {
  doneCollapsed,
  hintPulsing,
  isWidthChange,
  keyAction,
  nextSpeed,
  skipHeld,
} from '../../src/runtime/controls-timing';
import { buildStrings } from '../../src/strings';

const key = (over: Partial<Parameters<typeof keyAction>[0]> = {}) => ({
  key: 'Escape',
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  repeat: false,
  ...over,
});

describe('speed control (AC-13)', () => {
  it('cycles 1x, 2x, instant, back to 1x', () => {
    expect(nextSpeed('1')).toBe('2');
    expect(nextSpeed('2')).toBe('inf');
    expect(nextSpeed('inf')).toBe('1');
  });

  it('names the button after the current state and the one it switches to', () => {
    expect(buildStrings.speedLabel('1')).toBe('Build speed: 1×. Switch to 2×');
    expect(buildStrings.speedLabel('2')).toBe(
      'Build speed: 2×. Switch to instant',
    );
    expect(buildStrings.speedLabel('inf')).toBe(
      'Build speed: ∞ (instant). Switch to 1×',
    );
    expect(buildStrings.speedGlyph('1')).toBe('1×');
    expect(buildStrings.speedGlyph('2')).toBe('2×');
    expect(buildStrings.speedGlyph('inf')).toBe('∞');
  });
});

describe('persisting the speed (AC-13)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('saves the choice under sp-speed', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      setItem: (k: string, v: string) => store.set(k, v),
    });
    persistSpeed('2');
    expect(store.get('sp-speed')).toBe('2');
    persistSpeed('inf');
    expect(store.get('sp-speed')).toBe('inf');
  });

  it('does not throw when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(() => persistSpeed('2')).not.toThrow();
  });
});

describe('scroll hint and idle timers (AC-3, AC-17)', () => {
  it('pulses only after 4 s without a scroll', () => {
    expect(hintPulsing(0)).toBe(false);
    expect(hintPulsing(3999)).toBe(false);
    expect(hintPulsing(4000)).toBe(true);
    expect(hintPulsing(9000)).toBe(true);
  });

  it('collapses the done dock after 4 s', () => {
    expect(doneCollapsed(3999)).toBe(false);
    expect(doneCollapsed(4000)).toBe(true);
  });

  it('holds the created text for 1.5 s after a skip', () => {
    expect(skipHeld(0)).toBe(true);
    expect(skipHeld(1499)).toBe(true);
    expect(skipHeld(1500)).toBe(false);
  });
});

describe('keyboard (AC-7, AC-8)', () => {
  it('maps Esc to skip', () => {
    expect(keyAction(key(), false)).toBe('skip');
  });

  it('lets an open popover or dialog keep Esc', () => {
    expect(keyAction(key(), true)).toBeNull();
  });

  it('maps Shift + Esc to run all, even with a popover open', () => {
    expect(keyAction(key({ shiftKey: true }), false)).toBe('runAll');
    expect(keyAction(key({ shiftKey: true }), true)).toBe('runAll');
  });

  it('ignores other keys, other modifiers and key repeat', () => {
    expect(keyAction(key({ key: 'a' }), false)).toBeNull();
    expect(keyAction(key({ ctrlKey: true }), false)).toBeNull();
    expect(keyAction(key({ metaKey: true }), false)).toBeNull();
    expect(keyAction(key({ altKey: true }), false)).toBeNull();
    expect(keyAction(key({ repeat: true }), false)).toBeNull();
  });
});

describe('resize during a build (AC-12)', () => {
  it('counts a width change only', () => {
    expect(isWidthChange(1280, 1024)).toBe(true);
    expect(isWidthChange(1280, 800)).toBe(true);
    expect(isWidthChange(375, 375)).toBe(false);
  });
});

describe('dock copy (AC-5, AC-7, AC-13, AC-14, AC-17, AC-18)', () => {
  it('writes the queue status as queued n/5', () => {
    expect(buildStrings.queued(2, 5)).toBe('queued 2/5');
  });

  it('names the controls as the PRD requires', () => {
    expect(buildStrings.skipLabel).toBe("Skip this section's build");
    expect(buildStrings.replayLabel).toBe('Replay the build');
    expect(buildStrings.playLabel).toBe('Play the build animation');
    expect(buildStrings.groupLabel).toBe('Site build');
  });

  it('writes the footer summary with the same seconds as given', () => {
    expect(buildStrings.footerBuilt('9.6')).toBe('Built live in 9.6s · ');
    expect(buildStrings.replay).toBe('↻ Replay');
  });
});
