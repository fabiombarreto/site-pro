import type { Speed } from '../scripts/build-mode';
import type { Clock } from './clock';
import type { SectionId, SectionState, Timeline } from './types';

export const TURBO_FACTOR = 5;
export const MAX_FRAME_MS = 50;

export interface SchedulerHost {
  onState(id: SectionId, state: SectionState): void;
  onProgress(section: SectionId | null, fraction: number): void;
  onIdle(): void;
  onAllDone(): void;
  isHidden(): boolean;
  onTick?(id: SectionId, t: number, dt: number): void;
  onQueue?(position: number | null, total: number): void;
}

export interface SchedulerOptions {
  clock: Clock;
  timelines: Timeline[];
  speed: Speed;
  host: SchedulerHost;
}

export interface Scheduler {
  trigger(id: SectionId): void;
  finish(id: SectionId): void;
  setSpeed(speed: Speed): void;
  skip(): void;
  runAll(): void;
  finishThrough(id: SectionId): void;
  destroy(): void;
}

interface Entry {
  timeline: Timeline;
  state: SectionState;
  t: number;
}

function stateAt(timeline: Timeline, t: number): SectionState {
  if (t >= timeline.duration) return 'done';
  if (t >= timeline.createdAt) return 'closing';
  if (t >= timeline.buildStart) return 'building';
  // The short hold between the window opening (windowEnd) and the build start
  // is also reported as "window".
  if (t >= timeline.commandEnd) return 'window';
  return 'command';
}

export function createScheduler(options: SchedulerOptions): Scheduler {
  const { clock, host } = options;
  const entries: Entry[] = options.timelines.map((timeline) => ({
    timeline,
    state: 'pending',
    t: 0,
  }));
  let speed: Speed = options.speed;
  let active = -1;
  let unsubscribe: (() => void) | null = null;
  let lastNow = 0;
  let lastPublished = '';
  let allDoneFired = false;
  let lastQueue = 'null';

  const indexOf = (id: SectionId) =>
    entries.findIndex((e) => e.timeline.section === id);

  const setState = (entry: Entry, state: SectionState) => {
    if (entry.state === state) return;
    entry.state = state;
    host.onState(entry.timeline.section, state);
  };

  const publish = (section: SectionId | null, fraction: number) => {
    const rounded = Math.round(fraction * 100) / 100;
    const key = `${section ?? ''}:${rounded}`;
    if (key === lastPublished) return;
    lastPublished = key;
    host.onProgress(section, rounded);
  };

  const isFinished = (e: Entry) => e.state === 'done' || e.state === 'skipped';

  const stop = () => {
    unsubscribe?.();
    unsubscribe = null;
  };

  const checkAllDone = () => {
    if (!allDoneFired && entries.every(isFinished)) {
      allDoneFired = true;
      host.onAllDone();
    }
  };

  const publishQueue = () => {
    const position =
      active >= 0 && entries[active + 1]?.state === 'queued'
        ? active + 1
        : null;
    if (String(position) === lastQueue) return;
    lastQueue = String(position);
    host.onQueue?.(position, entries.length);
  };

  const startNext = () => {
    const next = entries.findIndex((e) => e.state === 'queued');
    if (next === -1) {
      active = -1;
      stop();
      publish(null, 0);
      host.onIdle();
      checkAllDone();
      publishQueue();
      return;
    }
    active = next;
    const entry = entries[next];
    entry.t = 0;
    setState(entry, stateAt(entry.timeline, 0));
    publish(entry.timeline.section, 0);
    host.onTick?.(entry.timeline.section, 0, 0);
    if (!unsubscribe) {
      lastNow = clock.now();
      unsubscribe = clock.onFrame(onFrame);
    }
    publishQueue();
  };

  const complete = (entry: Entry) => {
    setState(entry, 'done');
    if (entries[active] === entry) startNext();
    else checkAllDone();
  };

  function onFrame(now: number): void {
    if (host.isHidden()) {
      // Time spent hidden is never accumulated: re-measure from the next
      // visible frame.
      lastNow = now;
      return;
    }
    const dt = Math.min(Math.max(now - lastNow, 0), MAX_FRAME_MS);
    lastNow = now;
    if (active === -1) return;
    const entry = entries[active];
    const turbo = entries[active + 1]?.state === 'queued';
    const factor = (speed === '2' ? 2 : 1) * (turbo ? TURBO_FACTOR : 1);
    entry.t += dt * factor;
    if (entry.t >= entry.timeline.duration) {
      publish(entry.timeline.section, 1);
      complete(entry);
      return;
    }
    setState(entry, stateAt(entry.timeline, entry.t));
    publish(entry.timeline.section, entry.t / entry.timeline.duration);
    host.onTick?.(entry.timeline.section, entry.t, dt);
  }

  const finishUpTo = (index: number, final: 'done' | 'skipped' = 'done') => {
    for (let i = 0; i <= index; i++) {
      const entry = entries[i];
      if (!isFinished(entry)) {
        const wasActive = i === active;
        setState(entry, final);
        if (wasActive) active = -1;
      }
    }
    if (active === -1) startNext();
    else checkAllDone();
    publishQueue();
  };

  return {
    trigger(id) {
      const index = indexOf(id);
      if (index === -1) return;
      if (speed === 'inf') {
        finishUpTo(index);
        return;
      }
      for (let i = 0; i <= index; i++) {
        if (entries[i].state === 'pending') setState(entries[i], 'queued');
      }
      if (active === -1) startNext();
      publishQueue();
    },
    finish(id) {
      const index = indexOf(id);
      if (index === -1 || isFinished(entries[index])) return;
      const wasActive = index === active;
      setState(entries[index], 'done');
      if (wasActive) {
        active = -1;
        startNext();
      } else {
        checkAllDone();
      }
      publishQueue();
    },
    setSpeed(next) {
      speed = next;
      if (next !== 'inf') {
        publishQueue();
        return;
      }
      let last = active;
      entries.forEach((e, i) => {
        if (e.state === 'queued') last = Math.max(last, i);
      });
      if (last >= 0) finishUpTo(last);
      publishQueue();
    },
    skip() {
      if (active === -1) return;
      const entry = entries[active];
      setState(entry, 'skipped');
      active = -1;
      startNext();
      publishQueue();
    },
    runAll() {
      if (entries.every(isFinished)) return;
      finishUpTo(entries.length - 1, 'skipped');
      publishQueue();
    },
    finishThrough(id) {
      const index = indexOf(id);
      if (index === -1) return;
      if (entries.slice(0, index + 1).every(isFinished)) return;
      finishUpTo(index, 'skipped');
      publishQueue();
    },
    destroy() {
      stop();
      active = -1;
    },
  };
}
