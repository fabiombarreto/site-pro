import { createCursor } from './Cursor';
import { h } from './dom';
import { tokenize } from './tokenize';

export function createCommandLine(): {
  el: HTMLSpanElement;
  set(command: string, chars: number, cursor: boolean): void;
} {
  const el = h('span', 'sp-cmdline');
  let lastCommand: string | null = null;
  let lastChars = -1;
  let lastCursor: boolean | null = null;
  return {
    el,
    set(command, chars, cursor) {
      if (
        command === lastCommand &&
        chars === lastChars &&
        cursor === lastCursor
      ) {
        return;
      }
      lastCommand = command;
      lastChars = chars;
      lastCursor = cursor;
      const nodes: Node[] = [];
      let remaining = Math.max(chars, 0);
      for (const token of tokenize(command)) {
        if (remaining <= 0) break;
        const span = h('span', `sp-tok-${token.kind}`);
        span.textContent = token.text.slice(0, remaining);
        remaining -= token.text.length;
        nodes.push(span);
      }
      if (cursor) nodes.push(createCursor());
      el.replaceChildren(...nodes);
    },
  };
}
