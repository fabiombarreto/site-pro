import { createBootTerminal } from '../components/build/BootTerminal';
import { createBuildWindow } from '../components/build/BuildWindow';
import { createCommandDock } from '../components/build/CommandDock';
import type { DockAction } from '../components/build/CommandDock';
import { createFooterBuild } from '../components/build/FooterBuild';
import { createPendingOutline } from '../components/build/PendingOutline';
import type { Speed } from '../scripts/build-mode';
import { buildStrings } from '../strings';
import type { Clock } from './clock';
import { doneCollapsed, hintPulsing, skipHeld } from './controls-timing';
import {
  BOOT_NAV_AT_MS,
  bootLogCount,
  commandEnterAt,
  foldProgress,
  formatSeconds,
  navSlideProgress,
  spinnerFrame,
  stepIndexAt,
  windowCloseProgress,
  windowCommandChars,
  windowOpenProgress,
} from './layer-timing';
import { truncateCall, typedChars } from './effect-timing';
import type { SectionId, SectionState, Timeline } from './types';

export interface BuildLayer {
  readonly root: HTMLElement;
  onState(id: SectionId, state: SectionState): void;
  onTick(id: SectionId, t: number, dt: number): void;
  onAllDone(): void;
  setSpeed(speed: Speed): void;
  setQueue(position: number | null, total: number): void;
  destroy(): void;
}

export interface LayerOptions {
  sections: HTMLElement[];
  timelines: Timeline[];
  clock: Clock;
  speed: Speed;
  actions: {
    skip(): void;
    cycleSpeed(): void;
    replay(): void;
    play(): void;
  };
  ready?: 'reduced' | 'instant';
}

type Ui = 'none' | 'hint' | 'hold' | 'collapse';

const RUNNING: SectionState[] = ['command', 'window', 'building', 'closing'];

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Win = ReturnType<typeof createBuildWindow>;
type Outline = ReturnType<typeof createPendingOutline>;
type Boot = ReturnType<typeof createBootTerminal>;

interface Slot {
  timeline: Timeline;
  section: HTMLElement;
  outline: Outline | null;
  win: Win | null;
  origin: { x: number; y: number };
  state: SectionState;
  elapsed: number;
  counted: boolean;
}

export function createBuildLayer(options: LayerOptions): BuildLayer {
  const { sections, timelines, actions } = options;
  const root = document.createElement('div');
  root.className = 'sp-build-layer';
  root.setAttribute('data-build-layer', '');
  const page = document.querySelector('.sp-page');
  if (page) page.after(root);
  else document.body.append(root);

  const html = document.documentElement;
  const nav = document.querySelector<HTMLElement>('.sp-nav');
  let lastDoneText = '';
  const dock = createCommandDock({
    speed: options.speed,
    onAction(action: DockAction) {
      if (action === 'skip') actions.skip();
      else if (action === 'speed') actions.cycleSpeed();
      else if (action === 'replay') actions.replay();
      else if (action === 'play') actions.play();
      else reopen();
    },
  });
  root.append(dock.el);
  const footerSlot = document.querySelector<HTMLElement>('[data-footer-build]');
  const footer = footerSlot
    ? createFooterBuild(footerSlot, actions.replay)
    : null;

  if (options.ready) {
    dock.setOpacity(1);
    if (options.ready === 'reduced') {
      dock.setState('reduced');
    } else {
      dock.setState('idle');
      dock.setIdle(timelines.length, timelines.length, false);
    }
    footer?.setSummary(null);
    return {
      root,
      onState() {},
      onTick() {},
      onAllDone() {},
      setSpeed: dock.setSpeed,
      setQueue() {},
      destroy() {
        footer?.clear();
        root.remove();
      },
    };
  }

  const slots = new Map<SectionId, Slot>();
  timelines.forEach((timeline, i) => {
    const slot: Slot = {
      timeline,
      section: sections[i],
      outline: null,
      win: null,
      origin: { x: 0, y: 0 },
      state: 'pending',
      elapsed: 0,
      counted: false,
    };
    if (i > 0) {
      slot.outline = createPendingOutline(timeline.file);
      root.append(slot.outline.el);
    }
    slots.set(timeline.section, slot);
  });

  const heroId = timelines[0]?.section;
  let boot: Boot | null = null;
  let bootDone = false;
  let foldRect: DOMRect | null = null;
  let loopMs = 0;
  let doneCount = 0;
  let navState: 'hidden' | 'sliding' | 'in' = 'hidden';
  let navProgress = -1;
  let destroyed = false;
  let queueText: string | null = null;
  let startedId: SectionId | null = null;
  let uiMode: Ui = 'none';
  let uiMs = 0;
  let lastUiNow = 0;
  let cancelUi: (() => void) | null = null;

  function reopen() {
    dock.setState('done');
    dock.setDone(lastDoneText);
    armUi('collapse');
  }

  function onUiFrame(now: number) {
    const dt = Math.min(Math.max(now - lastUiNow, 0), 50);
    lastUiNow = now;
    if (document.visibilityState === 'hidden') return;
    uiMs += dt;
    if (uiMode === 'hint') {
      dock.setPulse(hintPulsing(uiMs));
    } else if (uiMode === 'hold') {
      if (!skipHeld(uiMs)) {
        dock.setState('idle');
        dock.setIdle(doneCount, timelines.length);
        armUi('hint');
      }
    } else if (uiMode === 'collapse') {
      if (doneCollapsed(uiMs)) {
        dock.setState('collapsed');
        armUi('none');
      }
    }
  }

  function armUi(mode: Ui) {
    uiMode = mode;
    uiMs = 0;
    dock.setPulse(false);
    if (mode === 'none') {
      cancelUi?.();
      cancelUi = null;
    } else if (!cancelUi) {
      lastUiNow = options.clock.now();
      cancelUi = options.clock.onFrame(onUiFrame);
    }
  }

  const onScroll = () => {
    if (uiMode !== 'hint') return;
    uiMs = 0;
    dock.setPulse(false);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  const boxOf = (el: HTMLElement): Box => {
    const r = el.getBoundingClientRect();
    return {
      x: r.left + window.scrollX,
      y: r.top + window.scrollY,
      width: r.width,
      height: r.height,
    };
  };

  const placeAll = () => {
    for (const slot of slots.values()) {
      if (!slot.outline && !slot.win) continue;
      const box = boxOf(slot.section);
      slot.outline?.setPlacement(box);
      slot.win?.setPlacement(box);
    }
  };

  const observer = new ResizeObserver(() => {
    if (!destroyed) placeAll();
  });
  const main = document.querySelector('main');
  if (main) observer.observe(main);
  for (const section of sections) observer.observe(section);
  void document.fonts?.ready.then(() => {
    if (!destroyed) placeAll();
  });
  placeAll();

  const ensureWindow = (slot: Slot): Win => {
    if (slot.win) return slot.win;
    const win = createBuildWindow(
      slot.timeline.file,
      slot.timeline.section,
      actions.skip,
    );
    slot.win = win;
    root.append(win.el);
    const box = boxOf(slot.section);
    win.setPlacement(box);
    const d = dock.getRect();
    const r = slot.section.getBoundingClientRect();
    slot.origin = {
      x: d.left + d.width / 2 - r.left,
      y: d.top + d.height / 2 - r.top,
    };
    win.setOpen(0, slot.origin);
    return win;
  };

  const removeBoot = () => {
    if (boot) boot.el.remove();
    boot = null;
    bootDone = true;
  };

  const setNav = (progress: number) => {
    if (!nav || navState === 'in') return;
    if (progress >= 1) {
      nav.style.removeProperty('transform');
      nav.style.removeProperty('opacity');
      html.setAttribute('data-build-nav', 'in');
      navState = 'in';
      return;
    }
    if (progress === navProgress) return;
    navProgress = progress;
    navState = 'sliding';
    html.setAttribute('data-build-nav', 'sliding');
    nav.style.transform = `translateY(${-(1 - progress) * 100}%)`;
    nav.style.opacity = String(progress);
  };

  const fileName = (file: string) => file.replace(/\.[^.]+$/, '');

  const finishSlot = (slot: Slot, wasRunning: boolean, skipped: boolean) => {
    slot.win?.el.remove();
    slot.win = null;
    slot.outline?.el.remove();
    slot.outline = null;
    if (slot.timeline.section === heroId) removeBoot();
    setNav(1);
    if (!slot.counted) {
      slot.counted = true;
      doneCount++;
    }
    dock.setLog(null);
    dock.setOpacity(1);
    if (wasRunning && skipped) {
      dock.setState('created');
      dock.setCreated(
        buildStrings.created(
          buildStrings.sectionLabels[slot.timeline.section],
          formatSeconds(slot.elapsed),
        ),
      );
      armUi('hold');
      return;
    }
    dock.setState('idle');
    dock.setIdle(doneCount, timelines.length);
    armUi('hint');
  };

  return {
    root,
    onState(id, state) {
      if (destroyed) return;
      const slot = slots.get(id);
      if (!slot) return;
      const previous = slot.state;
      slot.state = state;
      slot.outline?.setVisible(state === 'pending' || state === 'queued');
      if (state === 'command') {
        startedId = id;
        armUi('none');
      }
      if (state === 'command' && id === heroId && !boot && !bootDone) {
        boot = createBootTerminal();
        root.append(boot.el);
      }
      if (state === 'command' && id !== heroId) dock.setState('typing');
      if (state === 'window' || state === 'building' || state === 'closing') {
        const win = ensureWindow(slot);
        win.setState(state === 'window' ? 'opening' : state);
      }
      if (state === 'closing' && previous !== 'closing') {
        dock.setState('created');
        dock.setLog(null);
        dock.setCreated(
          buildStrings.created(
            buildStrings.sectionLabels[id],
            formatSeconds(slot.elapsed),
          ),
        );
      }
      if (state === 'done' || state === 'skipped') {
        finishSlot(slot, RUNNING.includes(previous), state === 'skipped');
      }
    },
    onTick(id, t, dt) {
      if (destroyed) return;
      const slot = slots.get(id);
      if (!slot) return;
      slot.elapsed += dt;
      loopMs += dt;
      const tl = slot.timeline;
      const length = tl.command.length;
      const enterAt = commandEnterAt(length);

      if (id === heroId) {
        if (t >= BOOT_NAV_AT_MS) setNav(navSlideProgress(t));
        if (boot) {
          boot.setCommand(tl.command, typedChars(t, tl.command), true);
          boot.setLogs(
            [
              buildStrings.initializing,
              buildStrings.openingFile(tl.file),
            ].slice(0, bootLogCount(t, enterAt)),
          );
          const fold = foldProgress(t, tl);
          if (fold > 0) {
            if (!foldRect) foldRect = dock.getRect();
            boot.setFold(fold, foldRect);
            dock.setState('building');
            if (queueText !== null) dock.setQueued(queueText);
            else dock.setBuilding(fileName(tl.file), spinnerFrame(loopMs));
            dock.setOpacity(fold);
            if (fold >= 1) removeBoot();
          }
        } else if (t >= tl.windowEnd && slot.state !== 'closing') {
          if (queueText !== null) dock.setQueued(queueText);
          else dock.setBuilding(fileName(tl.file), spinnerFrame(loopMs));
        }
      } else if (slot.state !== 'closing') {
        if (queueText !== null) {
          dock.setState('building');
          dock.setLog(null);
          dock.setQueued(queueText);
        } else if (t < tl.windowEnd) {
          dock.setState('typing');
          dock.setCommand(tl.command, typedChars(t, tl.command), true);
          dock.setLog(t >= enterAt ? buildStrings.readingFile(tl.file) : null);
        } else {
          dock.setState('building');
          dock.setLog(null);
          dock.setBuilding(fileName(tl.file), spinnerFrame(loopMs));
        }
      }

      const win = slot.win;
      if (!win) return;
      if (slot.state === 'closing') {
        win.setClosing(windowCloseProgress(t, tl));
        return;
      }
      win.setOpen(windowOpenProgress(t, tl), slot.origin);
      if (slot.state === 'building') {
        const index = stepIndexAt(t, tl.steps);
        if (index < 0) win.setCommand('', 0, false);
        else {
          const step = tl.steps[index];
          const display = truncateCall(step.call);
          win.setCommand(
            display,
            windowCommandChars(t, { call: display, start: step.start }),
            true,
          );
        }
      }
    },
    onAllDone() {
      if (destroyed) return;
      let total = 0;
      for (const slot of slots.values()) total += slot.elapsed;
      const seconds = formatSeconds(total, 1);
      lastDoneText = buildStrings.complete(timelines.length, seconds);
      dock.setState('done');
      dock.setDone(lastDoneText);
      armUi('collapse');
      footer?.setSummary(seconds);
    },
    setSpeed(next) {
      dock.setSpeed(next);
    },
    setQueue(position, total) {
      queueText =
        position === null ? null : buildStrings.queued(position, total);
      // Render at once so the dock never shows one frame of stale typing; the
      // hero's dock stays hidden until its boot folds into it.
      if (
        queueText !== null &&
        startedId !== null &&
        startedId !== heroId &&
        slots.get(startedId)?.state !== 'closing'
      ) {
        dock.setState('building');
        dock.setLog(null);
        dock.setQueued(queueText);
      }
    },
    destroy() {
      destroyed = true;
      cancelUi?.();
      cancelUi = null;
      window.removeEventListener('scroll', onScroll);
      footer?.clear();
      observer.disconnect();
      root.remove();
      if (nav) {
        nav.style.removeProperty('transform');
        nav.style.removeProperty('opacity');
      }
      html.removeAttribute('data-build-nav');
    },
  };
}
