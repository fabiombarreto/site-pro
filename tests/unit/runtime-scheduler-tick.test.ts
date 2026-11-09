// PRPs/prds/stage-3-runtime.prd.md AC-1 / AC-2 the build surfaces follow the section clock (phase 2 plan: AC-A1, AC-A2)
// The scheduler hands each active section's clock to an optional host hook; driven only through
// the public API with a manual clock.
import { describe, expect, it } from 'vitest';
import { createManualClock } from '../../src/runtime/clock';
import { createScheduler } from '../../src/runtime/scheduler';
import type { SectionId, Timeline } from '../../src/runtime/types';

const mk = (section: SectionId, duration: number): Timeline => ({
  v: 1,
  section,
  file: `${section}.x`,
  command: 'c();',
  commandEnd: 100,
  windowEnd: 200,
  buildStart: 300,
  steps: [{ call: 'a', target: 't', effect: 'pop', start: 300, end: 600 }],
  createdAt: 900,
  duration,
});

function run(hidden = false) {
  const clock = createManualClock();
  const ticks: [SectionId, number, number][] = [];
  const done: SectionId[] = [];
  const scheduler = createScheduler({
    clock,
    timelines: [mk('top', 1400), mk('about', 1400)],
    speed: '1',
    host: {
      onState: (id, state) => {
        if (state === 'done') done.push(id);
      },
      onProgress() {},
      onIdle() {},
      onAllDone() {},
      isHidden: () => hidden,
      onTick: (id, t, dt) => ticks.push([id, t, dt]),
    },
  });
  return { clock, scheduler, ticks, done };
}

describe('section clock hook', () => {
  it('starts a section at t = 0 with a zero frame delta', () => {
    const { scheduler, ticks } = run();
    scheduler.trigger('top');
    expect(ticks[0]).toEqual(['top', 0, 0]);
  });

  it('keeps ticking a running section with a rising clock and a frame delta of at most 50 ms', () => {
    const { clock, scheduler, ticks, done } = run();
    scheduler.trigger('top');
    clock.advance(2000);
    expect(ticks.length).toBeGreaterThan(10);
    expect(ticks.every(([id]) => id === 'top')).toBe(true);
    expect(ticks.every(([, , dt]) => dt <= 50)).toBe(true);
    ticks.forEach(([, t], i) => {
      if (i > 0) expect(t).toBeGreaterThanOrEqual(ticks[i - 1]?.[1] ?? 0);
    });
    expect(done).toEqual(['top']);
  });

  it('never ticks at or after the end of the section', () => {
    const { clock, scheduler, ticks } = run();
    scheduler.trigger('top');
    clock.advance(2000);
    expect(ticks.every(([, t]) => t < 1400)).toBe(true);
  });

  it('sends no tick beyond the start while the tab is hidden', () => {
    const { clock, scheduler, ticks } = run(true);
    scheduler.trigger('top');
    clock.advance(2000);
    expect(ticks.filter(([, t]) => t > 0)).toEqual([]);
  });
});
