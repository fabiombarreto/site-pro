import { h } from './dom';

export type LogLevel = 'info' | 'success' | 'warn' | 'error';

const GLYPHS: Record<LogLevel, string> = {
  info: 'ℹ',
  success: '✔',
  warn: '⚠',
  error: '✖',
};

const SPINNER_FRAMES = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';

export function createLogLine(
  level: LogLevel,
  text: string,
  spinner = false,
): {
  el: HTMLDivElement;
  setText(text: string): void;
  setSpinnerFrame(frame: number): void;
} {
  const el = h('div', 'sp-log', { 'data-level': level });
  const glyph = h('span', spinner ? 'sp-log-glyph sp-spinner' : 'sp-log-glyph');
  glyph.textContent = spinner ? SPINNER_FRAMES[0] : GLYPHS[level];
  const label = h('span', 'sp-log-text');
  label.textContent = text;
  el.append(glyph, label);
  let lastText = text;
  let lastFrame = 0;
  return {
    el,
    setText(next) {
      if (next === lastText) return;
      lastText = next;
      label.textContent = next;
    },
    setSpinnerFrame(frame) {
      if (!spinner || frame === lastFrame) return;
      lastFrame = frame;
      glyph.textContent = SPINNER_FRAMES[frame % SPINNER_FRAMES.length];
    },
  };
}
