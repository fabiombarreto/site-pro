import { h } from './dom';

export type SelectionState = 'drawing' | 'active' | 'fading';

export interface SelectionBox {
  el: HTMLDivElement;
  setPlacement(rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): void;
  setLabel(text: string): void;
  setDraw(progress: number): void;
  setState(state: SelectionState): void;
  setOpacity(value: number): void;
}

export function createSelectionBox(): SelectionBox {
  const el = h('div', 'sp-select', {
    'aria-hidden': 'true',
    'data-state': 'drawing',
  });
  for (let i = 0; i < 4; i++) el.append(h('span', 'sp-select-handle'));
  const label = h('span', 'sp-select-label');
  el.append(label);

  let lastLabel = '';
  let lastDraw = -1;
  let lastState: SelectionState = 'drawing';
  let lastOpacity = -1;

  return {
    el,
    setPlacement(rect) {
      el.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
    },
    setLabel(text) {
      if (text === lastLabel) return;
      lastLabel = text;
      label.textContent = text;
    },
    setDraw(progress) {
      if (progress === lastDraw) return;
      lastDraw = progress;
      const rest = (1 - progress) * 100;
      el.style.clipPath = `inset(0 ${rest}% ${rest}% 0)`;
    },
    setState(state) {
      if (state === lastState) return;
      lastState = state;
      el.setAttribute('data-state', state);
    },
    setOpacity(value) {
      if (value === lastOpacity) return;
      lastOpacity = value;
      el.style.opacity = String(value);
    },
  };
}
