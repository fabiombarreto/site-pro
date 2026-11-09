import { parseSpeed, persistSpeed } from '../scripts/build-mode';
import type { Speed } from '../scripts/build-mode';
import {
  currentSection,
  progress,
  queue,
  speed,
  status,
} from '../stores/build';
import { setControls } from './api';
import type { Controls } from './api';
import { realClock } from './clock';
import type { Clock } from './clock';
import { nextSpeed } from './controls-timing';
import { createEffects } from './effects';
import { observeFocus } from './focus-rule';
import { bindKeys } from './keys';
import { createBuildLayer } from './layer';
import type { BuildLayer } from './layer';
import { observeWidth } from './resize';
import { createScheduler } from './scheduler';
import type { Scheduler } from './scheduler';
import { observeSections } from './triggers';
import type { SectionId, Timeline } from './types';

const IDS: SectionId[] = ['top', 'about', 'projects', 'stack', 'contact'];

const root = document.documentElement;
const sections: HTMLElement[] = [];
const cancels = new Set<() => void>();
let timelines: Timeline[] = [];
let layer: BuildLayer | null = null;
let effects: ReturnType<typeof createEffects> | null = null;
let scheduler: Scheduler | null = null;
let stopObserver: (() => void) | null = null;
let unbindFocus: (() => void) | null = null;
let unbindWidth: (() => void) | null = null;
let unbindKeys: (() => void) | null = null;
let ready = false;

function endShow(): void {
  for (const cancel of [...cancels]) cancel();
  cancels.clear();
  scheduler?.destroy();
  stopObserver?.();
  unbindFocus?.();
  unbindWidth?.();
  effects?.destroy();
  layer?.destroy();
  scheduler = null;
  stopObserver = null;
  unbindFocus = null;
  unbindWidth = null;
  effects = null;
  layer = null;
}

function reveal(): void {
  unbindKeys?.();
  unbindKeys = null;
  endShow();
  for (const s of sections) s.setAttribute('data-build-state', 'done');
  root.removeAttribute('data-build-mode');
  status.set('failed');
}

function guard<A extends unknown[]>(fn: (...args: A) => void) {
  return (...args: A): void => {
    try {
      fn(...args);
    } catch (error) {
      reveal();
      console.error(error);
    }
  };
}

const clock: Clock = {
  now: realClock.now,
  onFrame(cb) {
    const stop = realClock.onFrame(guard(cb));
    const cancel = () => {
      cancels.delete(cancel);
      stop();
    };
    cancels.add(cancel);
    return cancel;
  },
};

const controls: Controls = {
  skip: () => scheduler?.skip(),
  runAll: () => scheduler?.runAll(),
  setSpeed(next) {
    speed.set(next);
    persistSpeed(next);
    scheduler?.setSpeed(next);
  },
  cycleSpeed() {
    controls.setSpeed(nextSpeed(speed.get()));
  },
  replay() {
    replayShow();
  },
  play() {
    replayShow();
  },
};

function replayShow(): void {
  const current = speed.get();
  // Replay and Play build always play at normal speed from the boot.
  const startSpeed: Speed = ready || current === 'inf' ? '1' : current;
  if (startSpeed !== current) persistSpeed(startSpeed);
  beginShow(startSpeed, { scrollTop: true });
}

const actions = {
  skip: guard(() => controls.skip()),
  cycleSpeed: guard(() => controls.cycleSpeed()),
  replay: guard(() => controls.replay()),
  play: guard(() => controls.play()),
};

function beginShow(startSpeed: Speed, options: { scrollTop: boolean }): void {
  endShow();
  ready = false;
  for (const s of sections) s.setAttribute('data-build-state', 'pending');
  root.setAttribute('data-build-mode', 'pending');
  status.set('idle');
  progress.set(0);
  currentSection.set(null);
  queue.set(null);
  speed.set(startSpeed);
  // base.css sets no scroll-behavior, so this jump is instant.
  if (options.scrollTop) window.scrollTo(0, 0);

  const showLayer = createBuildLayer({
    sections,
    timelines,
    clock,
    speed: startSpeed,
    actions,
  });
  layer = showLayer;
  const showEffects = createEffects({
    sections,
    timelines,
    root: showLayer.root,
  });
  effects = showEffects;
  const byId = new Map(sections.map((s) => [s.id, s]));
  const showScheduler = createScheduler({
    clock,
    timelines,
    speed: startSpeed,
    host: {
      onState: guard((id, state) => {
        showEffects.onState(id, state);
        byId.get(id)?.setAttribute('data-build-state', state);
        showLayer.onState(id, state);
        if (state !== 'pending' && status.get() !== 'building') {
          status.set('building');
        }
      }),
      onProgress: guard((section, fraction) => {
        currentSection.set(section);
        progress.set(fraction);
      }),
      onIdle: guard(() => status.set('idle')),
      onAllDone: guard(() => {
        showLayer.onAllDone();
        status.set('done');
        root.removeAttribute('data-build-mode');
      }),
      onTick: guard((id, t, dt) => {
        showEffects.onTick(id, t);
        showLayer.onTick(id, t, dt);
      }),
      onQueue: guard((position, total) => {
        queue.set(position === null ? null : { position, total });
        showLayer.setQueue(position, total);
      }),
      isHidden: () => document.visibilityState === 'hidden',
    },
  });
  scheduler = showScheduler;
  stopObserver = observeSections(sections, guard(showScheduler.trigger));
  unbindFocus = observeFocus({
    sections,
    heroId: 'top',
    finishThrough: guard(showScheduler.finishThrough),
  });
  unbindWidth = observeWidth(guard(showScheduler.skip));
  root.setAttribute('data-build-started', '');
}

function start(): void {
  for (const id of IDS) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`section #${id} is missing`);
    sections.push(el);
  }
  timelines = sections.map(
    (s) => JSON.parse(s.dataset.build ?? '') as Timeline,
  );
  const startSpeed = parseSpeed(root.dataset.buildSpeed);
  speed.set(startSpeed);
  for (const s of sections) s.setAttribute('data-build-state', 'pending');

  currentSection.subscribe((v) => {
    if (v === null) root.removeAttribute('data-build-section');
    else root.setAttribute('data-build-section', v);
  });
  progress.subscribe((v) =>
    root.setAttribute('data-build-progress', String(v)),
  );
  status.subscribe((v) => root.setAttribute('data-build-status', v));
  speed.subscribe((v) => {
    root.setAttribute('data-build-speed', v);
    layer?.setSpeed(v);
  });
  queue.subscribe((v) => {
    if (v === null) root.removeAttribute('data-build-queue');
    else root.setAttribute('data-build-queue', `${v.position}/${v.total}`);
  });

  setControls(controls);
  unbindKeys = bindKeys({
    skip: guard(() => controls.skip()),
    runAll: guard(() => controls.runAll()),
  });

  if (root.dataset.buildMode === 'instant') {
    for (const s of sections) s.setAttribute('data-build-state', 'done');
    status.set('instant');
    status.set('done');
    // data-build-mode stays "instant": the pending CSS never matches it, and
    // AC-A5 has <html> carry the resolved mode.
    root.setAttribute('data-build-started', '');
    ready = true;
    layer = createBuildLayer({
      sections,
      timelines,
      clock,
      speed: startSpeed,
      actions,
      ready: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'reduced'
        : 'instant',
    });
    return;
  }

  beginShow(startSpeed, { scrollTop: false });
}

guard(start)();
