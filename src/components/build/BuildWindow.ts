import { easeOut } from '../../runtime/layer-timing';
import { createCommandLine } from './CommandLine';
import { h } from './dom';

export type WindowState = 'opening' | 'building' | 'closing';

export interface BuildWindow {
  el: HTMLDivElement;
  setPlacement(rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): void;
  setCommand(call: string, chars: number, cursor: boolean): void;
  setOpen(progress: number, origin: { x: number; y: number }): void;
  setClosing(progress: number): void;
  setState(state: WindowState): void;
}

export function createBuildWindow(
  file: string,
  section: string,
  onSkip?: () => void,
): BuildWindow {
  const el = h('div', 'sp-window', {
    'aria-hidden': 'true',
    'data-section': section,
    'data-file': file,
    'data-state': 'opening',
  });
  const frame = h('div', 'sp-window-frame');
  const body = h('div', 'sp-window-body');
  const chrome = h('div', 'sp-window-chrome');
  const bar = h('div', 'sp-window-bar');
  const dots = h('div', 'sp-dots');
  for (let i = 0; i < 3; i++) dots.append(h('span', 'sp-dot'));
  const name = h('span', 'sp-window-file');
  name.textContent = file;
  bar.append(dots, name);
  const cmd = h('div', 'sp-window-cmd');
  const line = createCommandLine();
  cmd.append(line.el);
  if (onSkip) {
    bar.addEventListener('click', onSkip);
    cmd.addEventListener('click', onSkip);
  }
  chrome.append(bar, cmd);
  frame.append(body, chrome);
  el.append(frame);

  let state: WindowState = 'opening';
  let lastOpen = -1;
  let lastClosing = -1;

  return {
    el,
    setPlacement(rect) {
      // top/left, not a transform: sticky offsets ignore an ancestor's transform.
      el.style.left = `${rect.x}px`;
      el.style.top = `${rect.y}px`;
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
    },
    setCommand: line.set,
    setOpen(progress, origin) {
      if (progress === lastOpen) return;
      lastOpen = progress;
      const eased = easeOut(progress);
      frame.style.transformOrigin = `${origin.x}px ${origin.y}px`;
      frame.style.transform = `scale(${0.96 + 0.04 * eased})`;
      frame.style.opacity = String(eased);
    },
    setClosing(progress) {
      if (progress === lastClosing) return;
      lastClosing = progress;
      frame.style.opacity = String(1 - progress);
    },
    setState(next) {
      if (next === state) return;
      state = next;
      el.setAttribute('data-state', next);
    },
  };
}
