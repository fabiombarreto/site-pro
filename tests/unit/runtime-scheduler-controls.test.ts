// PRPs/prds/stage-3-runtime.prd.md AC-7 Skip (the next section still waits), AC-8 Run all, AC-10 focus rule
// (finish a section and every one before it), AC-5 queued n/5 while turbo catches up, AC-13 infinity still
// finishes sections (phase 4 plan: AC-A1, AC-A2, AC-A6, AC-A8)
// The scheduler is driven only through its public API with a manual clock.
import { describe, expect, it } from 'vitest';
import { createManualClock } from '../../src/runtime/clock';
import { compileScript } from '../../src/runtime/compiler';
import { createScheduler } from '../../src/runtime/scheduler';
import type { SectionId, SectionState } from '../../src/runtime/types';

const IDS: SectionId[] = ['top', 'about', 'projects', 'stack', 'contact'];
const FINAL: SectionState[] = ['done', 'skipped'];

const timelines = IDS.map((section) =>
  compileScript({
    section,
    file: `${section}.tsx`,
    command: 'run();',
    steps: [{ call: `${section}.x`, target: 'x', effect: 'pop' }],
  }),
);

function setup() {
  const clock = createManualClock();
  const states = new Map<SectionId, SectionState>(
    IDS.map((id) => [id, 'pending']),
  );
  const log = { events: 0, idle: 0, allDone: 0, queue: [] as string[] };
  const scheduler = createScheduler({
    clock,
    timelines,
    speed: '1',
    host: {
      onState(id, state) {
        states.set(id, state);
        log.events += 1;
      },
      onProgress() {},
      onIdle() {
        log.idle += 1;
      },
      onAllDone() {
        log.allDone += 1;
      },
      isHidden: () => false,
      onQueue(position, total) {
        log.queue.push(`${position}/${total}`);
      },
    },
  });
  return { clock, states, log, scheduler };
}

describe('skip', () => {
  it('finishes only the active section as skipped and leaves the next one waiting', () => {
    const { clock, states, scheduler } = setup();
    scheduler.trigger('top');
    clock.advance(100);
    scheduler.skip();
    expect(states.get('top')).toBe('skipped');
    expect(states.get('about')).toBe('pending');
  });

  it('does nothing when no section is building', () => {
    const { states, log, scheduler } = setup();
    scheduler.skip();
    expect(log.events).toBe(0);
    expect(IDS.every((id) => states.get(id) === 'pending')).toBe(true);
  });

  it('does not fire the idle or all-done events twice on a repeated skip', () => {
    const { clock, log, scheduler } = setup();
    scheduler.trigger('contact');
    clock.advance(20);
    for (let i = 0; i < IDS.length; i++) scheduler.skip();
    expect(log.allDone).toBe(1);
    const idle = log.idle;
    scheduler.skip();
    expect(log.allDone).toBe(1);
    expect(log.idle).toBe(idle);
  });
});

describe('run all', () => {
  it('finishes every remaining section, started or not', () => {
    const { clock, states, log, scheduler } = setup();
    scheduler.trigger('top');
    clock.advance(100);
    scheduler.runAll();
    expect(
      IDS.every((id) => FINAL.includes(states.get(id) as SectionState)),
    ).toBe(true);
    expect(log.allDone).toBe(1);
  });

  it('changes nothing the second time', () => {
    const { clock, log, scheduler } = setup();
    scheduler.trigger('top');
    clock.advance(100);
    scheduler.runAll();
    const events = log.events;
    scheduler.runAll();
    expect(log.events).toBe(events);
    expect(log.allDone).toBe(1);
  });
});

describe('finish through (keyboard focus rule)', () => {
  it('finishes the named section and every one before it, and no later one', () => {
    const { states, scheduler } = setup();
    scheduler.finishThrough('projects');
    expect(states.get('top')).toBe('skipped');
    expect(states.get('about')).toBe('skipped');
    expect(states.get('projects')).toBe('skipped');
    expect(states.get('stack')).toBe('pending');
    expect(states.get('contact')).toBe('pending');
  });

  it('changes nothing for a section that is already built', () => {
    const { log, scheduler } = setup();
    scheduler.finishThrough('about');
    const events = log.events;
    scheduler.finishThrough('about');
    scheduler.finishThrough('top');
    expect(log.events).toBe(events);
  });
});

describe('queue status for turbo (AC-5)', () => {
  it('reports no queue while one section builds alone', () => {
    const { clock, log, scheduler } = setup();
    scheduler.trigger('top');
    clock.advance(100);
    expect(log.queue).toEqual([]);
  });

  it('walks the position of the section being caught up and ends with null', () => {
    const { clock, log, scheduler } = setup();
    scheduler.trigger('top');
    clock.advance(100);
    scheduler.trigger('projects');
    expect(log.queue.at(-1)).toBe('1/5');
    scheduler.skip();
    expect(log.queue.at(-1)).toBe('2/5');
    scheduler.skip();
    expect(log.queue.at(-1)).toBe('null/5');
  });
});

describe('infinity speed keeps finishing sections (AC-13)', () => {
  it('finishes the current section and every triggered one instantly', () => {
    const { clock, states, scheduler } = setup();
    scheduler.trigger('about');
    clock.advance(100);
    scheduler.setSpeed('inf');
    expect(states.get('top')).toBe('done');
    expect(states.get('about')).toBe('done');
  });
});
