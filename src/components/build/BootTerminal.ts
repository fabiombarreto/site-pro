import { buildStrings } from '../../strings';
import { createCommandLine } from './CommandLine';
import { createLogLine } from './LogLine';
import { h } from './dom';

export interface BootTerminal {
  el: HTMLDivElement;
  setCommand(command: string, chars: number, cursor: boolean): void;
  setLogs(lines: string[]): void;
  setFold(progress: number, to: DOMRect | null): void;
  setVisible(visible: boolean): void;
}

export function createBootTerminal(): BootTerminal {
  const el = h('div', 'sp-boot', { 'aria-hidden': 'true' });
  const dots = h('div', 'sp-dots');
  for (let i = 0; i < 3; i++) dots.append(h('span', 'sp-dot'));
  const body = h('div', 'sp-boot-body');
  const promptLine = h('div', 'sp-boot-prompt');
  const prompt = h('span', 'sp-prompt');
  prompt.textContent = buildStrings.prompt;
  const command = createCommandLine();
  promptLine.append(prompt, command.el);
  const logs = h('div', 'sp-boot-logs');
  body.append(promptLine, logs);
  el.append(dots, body);

  let logKey = '';
  let lastFold = -1;
  // Untransformed box of the terminal, measured once when the fold starts.
  let from: { cx: number; cy: number; w: number; h: number } | null = null;

  return {
    el,
    setCommand: command.set,
    setLogs(lines) {
      const key = lines.join('\n');
      if (key === logKey) return;
      logKey = key;
      logs.replaceChildren(
        ...lines.map((line) => createLogLine('info', line).el),
      );
    },
    setFold(progress, to) {
      if (progress === lastFold) return;
      lastFold = progress;
      if (!from) {
        from = {
          cx: el.offsetLeft + el.offsetWidth / 2,
          cy: el.offsetTop + el.offsetHeight / 2,
          w: el.offsetWidth,
          h: el.offsetHeight,
        };
      }
      let transform = 'none';
      if (to && progress > 0) {
        const dx = to.left + to.width / 2 - from.cx;
        const dy = to.top + to.height / 2 - from.cy;
        const sx = 1 + (to.width / from.w - 1) * progress;
        const sy = 1 + (to.height / from.h - 1) * progress;
        transform = `translate(${dx * progress}px, ${dy * progress}px) scale(${sx}, ${sy})`;
      }
      el.style.transform = transform;
      el.style.opacity = String(1 - progress);
    },
    setVisible(visible) {
      el.toggleAttribute('data-hidden', !visible);
    },
  };
}
