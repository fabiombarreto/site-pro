import type { Speed } from '../../scripts/build-mode';
import { buildStrings } from '../../strings';
import { createCommandLine } from './CommandLine';
import { createCursor } from './Cursor';
import { createLogLine } from './LogLine';
import { h } from './dom';

export type DockState =
  | 'hidden'
  | 'typing'
  | 'building'
  | 'created'
  | 'idle'
  | 'done'
  | 'reduced'
  | 'collapsed';

export type DockAction = 'skip' | 'speed' | 'replay' | 'play' | 'expand';

export interface CommandDock {
  el: HTMLDivElement;
  setState(state: DockState): void;
  setCommand(command: string, chars: number, cursor: boolean): void;
  setLog(text: string | null): void;
  setBuilding(name: string, spinnerFrame: number): void;
  setCreated(text: string): void;
  setIdle(done: number, total: number, withHint?: boolean): void;
  setDone(text: string): void;
  setSpeed(speed: Speed): void;
  setQueued(text: string): void;
  setPulse(on: boolean): void;
  setOpacity(value: number): void;
  getRect(): DOMRect;
}

const VISIBLE: Record<DockState, DockAction[]> = {
  hidden: [],
  typing: ['skip', 'speed'],
  building: ['skip', 'speed'],
  created: ['speed'],
  idle: ['speed'],
  done: ['replay'],
  reduced: ['play'],
  collapsed: ['expand'],
};

export function createCommandDock(options: {
  speed: Speed;
  onAction(action: DockAction): void;
}): CommandDock {
  const el = h('div', 'sp-dock', {
    role: 'group',
    'aria-label': buildStrings.groupLabel,
    'data-state': 'hidden',
  });
  const log = h('div', 'sp-dock-log', { 'aria-hidden': 'true' });
  const pill = h('div', 'sp-dock-pill');
  const status = h('div', 'sp-dock-status', { 'aria-hidden': 'true' });
  const hint = h('span', 'sp-dock-hint', { 'aria-hidden': 'true' });
  const controls = h('div', 'sp-dock-controls');

  const makeButton = (
    action: DockAction,
    label: string,
    name: string,
    extra = '',
  ) => {
    const button = h('button', `sp-dock-btn${extra}`, {
      type: 'button',
      'data-dock-action': action,
      'aria-label': name,
    });
    button.textContent = label;
    button.addEventListener('click', () => options.onAction(action));
    button.hidden = true;
    controls.append(button);
    return button;
  };
  const buttons: Record<DockAction, HTMLButtonElement> = {
    skip: makeButton('skip', buildStrings.skip, buildStrings.skipLabel),
    speed: makeButton(
      'speed',
      buildStrings.speedGlyph(options.speed),
      buildStrings.speedLabel(options.speed),
    ),
    replay: makeButton('replay', buildStrings.replay, buildStrings.replayLabel),
    play: makeButton('play', buildStrings.play, buildStrings.playLabel),
    expand: makeButton(
      'expand',
      buildStrings.collapsedGlyph,
      buildStrings.expandLabel,
      ' sp-dock-fab',
    ),
  };
  pill.append(status, hint, controls);
  el.append(log, pill);

  const logLine = createLogLine('info', '');
  const command = createCommandLine();
  const spinner = createLogLine('info', '', true);
  const text = h('span', 'sp-dock-text');
  const idle = h('span', 'sp-dock-text');
  const prompt = (): HTMLSpanElement => {
    const span = h('span', 'sp-prompt');
    span.textContent = buildStrings.prompt;
    return span;
  };

  let state: DockState = 'hidden';
  let mode = '';
  let lastLog: string | null = null;
  let lastOpacity = '';
  let idleKey = '';
  let lastPulse = false;
  let lastGlyph = buildStrings.speedGlyph(options.speed);
  let lastLabel = buildStrings.speedLabel(options.speed);

  const show = (next: string, nodes: Node[], hintText = '') => {
    if (mode !== next) {
      mode = next;
      status.replaceChildren(...nodes);
    }
    if (hint.textContent !== hintText) hint.textContent = hintText;
  };

  const syncButtons = (next: DockState) => {
    const visible = VISIBLE[next];
    for (const [action, button] of Object.entries(buttons)) {
      button.hidden = !visible.includes(action as DockAction);
    }
    const active = document.activeElement;
    if (
      active instanceof HTMLButtonElement &&
      active.hidden &&
      el.contains(active)
    ) {
      Object.values(buttons)
        .find((b) => !b.hidden)
        ?.focus();
    }
  };

  return {
    el,
    setState(next) {
      if (next === state) return;
      state = next;
      el.setAttribute('data-state', next);
      if (next === 'reduced') {
        text.textContent = buildStrings.reducedReady;
        mode = 'reduced';
        status.replaceChildren(text, createCursor());
        hint.textContent = '';
      } else if (next === 'collapsed') {
        mode = 'collapsed';
        status.replaceChildren();
        hint.textContent = '';
      }
      syncButtons(next);
    },
    setCommand(value, chars, cursor) {
      show('command', [prompt(), command.el]);
      command.set(value, chars, cursor);
    },
    setLog(value) {
      if (value === lastLog) return;
      lastLog = value;
      if (value === null) {
        log.replaceChildren();
      } else {
        logLine.setText(value);
        log.replaceChildren(logLine.el);
      }
    },
    setBuilding(name, frame) {
      show('building', [spinner.el]);
      spinner.setText(buildStrings.building(name));
      spinner.setSpinnerFrame(frame);
    },
    setCreated(value) {
      show('text', [text]);
      if (text.textContent !== value) text.textContent = value;
    },
    setIdle(done, total, withHint = true) {
      const key = `${done}/${total}/${withHint}`;
      if (mode !== 'idle' || key !== idleKey) {
        idleKey = key;
        idle.textContent = buildStrings.idleCount(done, total);
        mode = '';
        show(
          'idle',
          [idle, prompt(), createCursor()],
          withHint ? buildStrings.scrollHint : '',
        );
      }
    },
    setDone(value) {
      show('text', [text]);
      if (text.textContent !== value) text.textContent = value;
    },
    setSpeed(next) {
      const glyph = buildStrings.speedGlyph(next);
      const label = buildStrings.speedLabel(next);
      if (glyph !== lastGlyph) {
        lastGlyph = glyph;
        buttons.speed.textContent = glyph;
      }
      if (label !== lastLabel) {
        lastLabel = label;
        buttons.speed.setAttribute('aria-label', label);
      }
    },
    setQueued(value) {
      show('text', [text]);
      if (text.textContent !== value) text.textContent = value;
    },
    setPulse(on) {
      if (on === lastPulse) return;
      lastPulse = on;
      if (on) hint.setAttribute('data-pulse', '');
      else hint.removeAttribute('data-pulse');
    },
    setOpacity(value) {
      const next = String(value);
      if (next === lastOpacity) return;
      lastOpacity = next;
      el.style.opacity = next;
    },
    getRect() {
      return el.getBoundingClientRect();
    },
  };
}
