// PRPs/prds/stage-3-runtime.prd.md AC-2 Sections start in order, one at a time (order and trigger parts)
// PRPs/prds/stage-3-runtime.prd.md AC-5 Speed 1x / 2x / infinity, AC-13 infinity, AC-16 hidden tab pauses
// (phase 1 plan: AC-A2, AC-A4, AC-A8)
// The scheduler is driven only through its public API with a manual clock.
import { describe, expect, it } from 'vitest';
import type { Speed } from '../../src/scripts/build-mode';
import { createManualClock, type Clock } from '../../src/runtime/clock';
import { compileScript } from '../../src/runtime/compiler';
import {
  createScheduler,
  type SchedulerHost,
} from '../../src/runtime/scheduler';
import type { SectionId, SectionState } from '../../src/runtime/types';

const IDS: SectionId[] = ['top', 'about', 'projects', 'stack', 'contact'];
const ACTIVE: SectionState[] = ['command', 'window', 'building', 'closing'];

const timelines = IDS.map((section) =>
  compileScript({
    section,
    file: `${section}.tsx`,
    command: 'run();',
    steps: [{ call: `${section}.x`, target: 'x', effect: 'pop' }],
  }),
);
const DURATION = timelines[0]?.duration ?? 0;

function setup(speed: Speed = '1') {
  const manual = createManualClock();
  let live = 0;
  let maxLive = 0;
  const clock: Clock = {
    now: manual.now,
    onFrame(cb) {
      live += 1;
      maxLive = Math.max(maxLive, live);
      const off = manual.onFrame(cb);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        live -= 1;
        off();
      };
    },
  };
  const events: [SectionId, SectionState][] = [];
  const states = new Map<SectionId, SectionState>(
    IDS.map((id) => [id, 'pending']),
  );
  const progress: number[] = [];
  let maxActive = 0;
  let idle = 0;
  let allDone = 0;
  let hidden = false;
  const host: SchedulerHost = {
    onState(id, state) {
      events.push([id, state]);
      states.set(id, state);
      maxActive = Math.max(
        maxActive,
        [...states.values()].filter((s) => ACTIVE.includes(s)).length,
      );
    },
    onProgress(_section, fraction) {
      progress.push(fraction);
    },
    onIdle() {
      idle += 1;
    },
    onAllDone() {
      allDone += 1;
    },
    isHidden: () => hidden,
  };
  const scheduler = createScheduler({ clock, timelines, speed, host });
  return {
    scheduler,
    manual,
    events,
    states,
    progress,
    setHidden: (v: boolean) => {
      hidden = v;
    },
    get maxActive() {
      return maxActive;
    },
    get maxLive() {
      return maxLive;
    },
    get live() {
      return live;
    },
    get idle() {
      return idle;
    },
    get allDone() {
      return allDone;
    },
  };
}

describe('order and one active section', () => {
  it('queues every earlier pending section when a later one triggers and runs them in document order', () => {
    const s = setup();
    s.scheduler.trigger('projects');
    expect(s.states.get('top')).not.toBe('pending');
    expect(s.states.get('about')).toBe('queued');
    expect(s.states.get('projects')).toBe('queued');
    expect(s.states.get('stack')).toBe('pending');
    s.manual.advance(DURATION * 4);
    const started = s.events
      .filter(([, state]) => ACTIVE.includes(state))
      .map(([id]) => id)
      .filter((id, i, all) => all.indexOf(id) === i);
    expect(started).toEqual(['top', 'about', 'projects']);
    expect(s.states.get('stack')).toBe('pending');
    expect(s.states.get('contact')).toBe('pending');
  });

  it('never has two sections active at once', () => {
    const s = setup();
    s.scheduler.trigger('contact');
    s.manual.advance(DURATION * 6);
    expect(s.maxActive).toBe(1);
    expect(IDS.every((id) => s.states.get(id) === 'done')).toBe(true);
  });

  it('starts the next queued section in the frame where the previous one finishes', () => {
    const s = setup();
    s.scheduler.trigger('about');
    s.manual.advance(DURATION * 3);
    const doneAt = s.events.findIndex(
      ([id, st]) => id === 'top' && st === 'done',
    );
    expect(doneAt).toBeGreaterThanOrEqual(0);
    expect(s.events[doneAt + 1]).toEqual(['about', 'command']);
  });

  it('starts nothing until a section is triggered', () => {
    const s = setup();
    s.manual.advance(10000);
    expect(s.events).toEqual([]);
    expect(s.live).toBe(0);
  });

  it('walks a section through command, window, building, closing and done', () => {
    const s = setup();
    s.scheduler.trigger('top');
    s.manual.advance(DURATION + 100);
    const phases = s.events
      .filter(([id]) => id === 'top')
      .map(([, state]) => state)
      .filter((state, i, all) => all.indexOf(state) === i);
    expect(phases).toEqual([
      'queued',
      'command',
      'window',
      'building',
      'closing',
      'done',
    ]);
  });

  it('never replays a section that is already built', () => {
    const s = setup();
    s.scheduler.trigger('top');
    s.manual.advance(DURATION + 100);
    const before = s.events.length;
    s.scheduler.trigger('top');
    s.manual.advance(DURATION);
    expect(s.events.length).toBe(before);
    expect(s.states.get('top')).toBe('done');
  });
});

describe('speed', () => {
  it('finishes a section at 1x after its timeline duration', () => {
    const s = setup('1');
    s.scheduler.trigger('top');
    s.manual.advance(DURATION - 120);
    expect(s.states.get('top')).not.toBe('done');
    s.manual.advance(240);
    expect(s.states.get('top')).toBe('done');
  });

  it('finishes a section in half the time at 2x', () => {
    const s = setup('2');
    s.scheduler.trigger('top');
    s.manual.advance(DURATION / 2 - 120);
    expect(s.states.get('top')).not.toBe('done');
    s.manual.advance(240);
    expect(s.states.get('top')).toBe('done');
  });

  it('runs a section at 5x while the next section in order is already queued, and the last queued one at 1x', () => {
    const s = setup('1');
    s.scheduler.trigger('projects');
    // top and about are turbo (1/5 each); projects has no queued successor.
    const expected = (2 * DURATION) / 5 + DURATION;
    s.manual.advance(expected - 150);
    expect(s.states.get('projects')).not.toBe('done');
    s.manual.advance(300);
    expect(s.states.get('projects')).toBe('done');
    expect(s.states.get('top')).toBe('done');
    expect(s.states.get('about')).toBe('done');
  });

  it('finishes the triggered sections at once at speed infinity and reports all done after the last', () => {
    const s = setup('inf');
    s.scheduler.trigger('projects');
    expect(s.states.get('top')).toBe('done');
    expect(s.states.get('about')).toBe('done');
    expect(s.states.get('projects')).toBe('done');
    expect(s.states.get('stack')).toBe('pending');
    expect(s.allDone).toBe(0);
    s.scheduler.trigger('contact');
    expect(IDS.every((id) => s.states.get(id) === 'done')).toBe(true);
    expect(s.allDone).toBe(1);
    expect(s.live).toBe(0);
  });

  it('finishes the running and queued sections when speed changes to infinity mid-build', () => {
    const s = setup('1');
    s.scheduler.trigger('about');
    s.manual.advance(200);
    s.scheduler.setSpeed('inf');
    expect(s.states.get('top')).toBe('done');
    expect(s.states.get('about')).toBe('done');
    expect(s.states.get('projects')).toBe('pending');
  });
});

describe('pause while the tab is hidden', () => {
  it('does not advance while hidden and resumes from the step it was on', () => {
    const s = setup('1');
    s.scheduler.trigger('top');
    s.manual.advance(600);
    const stateBefore = s.states.get('top');
    const progressBefore = s.progress[s.progress.length - 1];
    s.setHidden(true);
    s.manual.advance(20000);
    expect(s.states.get('top')).toBe(stateBefore);
    expect(s.progress[s.progress.length - 1]).toBe(progressBefore);

    s.setHidden(false);
    // About 600 ms were already played: finishing needs the remaining time,
    // not the 20 s spent hidden.
    s.manual.advance(DURATION - 600 - 150);
    expect(s.states.get('top')).not.toBe('done');
    s.manual.advance(300);
    expect(s.states.get('top')).toBe('done');
  });
});

describe('one loop and published progress', () => {
  it('holds at most one frame subscription and releases it when idle', () => {
    const s = setup();
    s.scheduler.trigger('contact');
    s.manual.advance(DURATION * 6);
    expect(s.maxLive).toBe(1);
    expect(s.live).toBe(0);
    expect(s.idle).toBeGreaterThanOrEqual(1);
  });

  it('publishes progress rounded to 0.01, only on change, ending at 1', () => {
    const s = setup();
    s.scheduler.trigger('top');
    s.manual.advance(DURATION + 100);
    const topRun = s.progress;
    for (const v of topRun) expect(Math.round(v * 100) / 100).toBe(v);
    topRun.slice(1).forEach((v, i) => expect(v).not.toBe(topRun[i]));
    expect(Math.max(...topRun)).toBe(1);
  });

  it('reports all done exactly once when every section is built', () => {
    const s = setup();
    s.scheduler.trigger('contact');
    s.manual.advance(DURATION * 6);
    s.scheduler.trigger('contact');
    s.manual.advance(DURATION);
    expect(s.allDone).toBe(1);
  });
});
