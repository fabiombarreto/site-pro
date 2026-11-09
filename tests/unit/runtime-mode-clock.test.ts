// PRPs/prds/stage-3-runtime.prd.md AC-1 Page ready without the build, AC-5 Speed values,
// AC-13 Infinity speed, AC-14 Reduced motion (phase 1 plan: AC-A5, AC-A8)
// The mode resolution shared by the head script and the runtime, and the injectable clock.
import { describe, expect, it } from 'vitest';
import {
  SPEED_STORAGE_KEY,
  WATCHDOG_MS,
  parseSpeed,
  resolveMode,
} from '../../src/scripts/build-mode';
import { createManualClock } from '../../src/runtime/clock';

describe('speed parsing', () => {
  it('stores the speed under sp-speed', () => {
    expect(SPEED_STORAGE_KEY).toBe('sp-speed');
  });

  it.each(['1', '2', 'inf'] as const)('accepts %s', (value) => {
    expect(parseSpeed(value)).toBe(value);
  });

  it.each([null, undefined, '', '3', 'fast', 'INF', '0', '1x'])(
    'falls back to 1x for %s',
    (value) => {
      expect(parseSpeed(value)).toBe('1');
    },
  );
});

describe('mode resolution', () => {
  it('builds (pending) with no reduced motion and a finite speed', () => {
    expect(resolveMode(false, '1')).toBe('pending');
    expect(resolveMode(false, '2')).toBe('pending');
  });

  it('renders the final page at once (instant) under reduced motion at any speed', () => {
    expect(resolveMode(true, '1')).toBe('instant');
    expect(resolveMode(true, '2')).toBe('instant');
    expect(resolveMode(true, 'inf')).toBe('instant');
  });

  it('renders the final page at once for a saved infinity speed', () => {
    expect(resolveMode(false, 'inf')).toBe('instant');
  });

  it('keeps the failsafe watchdog at 3 s', () => {
    expect(WATCHDOG_MS).toBe(3000);
  });
});

describe('manual clock', () => {
  it('starts at the given time and moves only when advanced', () => {
    const clock = createManualClock(100);
    expect(clock.now()).toBe(100);
    clock.advance(50);
    expect(clock.now()).toBe(150);
  });

  it('calls frame listeners after each step with the new time', () => {
    const clock = createManualClock();
    const seen: number[] = [];
    clock.onFrame((now) => seen.push(now));
    clock.advance(40, 16);
    expect(seen).toEqual([16, 32, 40]);
  });

  it('stops calling a listener once it is cancelled', () => {
    const clock = createManualClock();
    let calls = 0;
    const cancel = clock.onFrame(() => {
      calls += 1;
    });
    clock.advance(32, 16);
    cancel();
    clock.advance(32, 16);
    expect(calls).toBe(2);
  });
});
