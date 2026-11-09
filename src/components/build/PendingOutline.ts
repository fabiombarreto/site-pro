import { h } from './dom';

export interface PendingOutline {
  el: HTMLDivElement;
  setPlacement(rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): void;
  setVisible(visible: boolean): void;
}

export function createPendingOutline(file: string): PendingOutline {
  const el = h('div', 'sp-outline', { 'aria-hidden': 'true' });
  const box = h('div', 'sp-outline-box');
  const label = h('span', 'sp-outline-label');
  label.textContent = file;
  box.append(label);
  el.append(box);
  return {
    el,
    setPlacement(rect) {
      el.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
    },
    setVisible(visible) {
      el.toggleAttribute('data-hidden', !visible);
    },
  };
}
