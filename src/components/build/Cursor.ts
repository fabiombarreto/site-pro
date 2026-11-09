import { h } from './dom';

export function createCursor(): HTMLSpanElement {
  const el = h('span', 'sp-cursor');
  el.textContent = '█';
  return el;
}
