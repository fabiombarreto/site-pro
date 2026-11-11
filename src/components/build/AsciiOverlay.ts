import { h } from './dom';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Geometry {
  fontSize: number;
  lineHeight: number;
}

export interface AsciiOverlay {
  el: HTMLPreElement;
  setPlacement(rect: Rect, geometry: Geometry): void;
  setText(text: string): void;
  setOpacity(value: number): void;
}

export function createAsciiOverlay(): AsciiOverlay {
  const el = h('pre', 'sp-ascii', { 'aria-hidden': 'true' });
  let lastText: string | null = null;
  let lastOpacity = -1;

  return {
    el,
    setPlacement(rect, geometry) {
      el.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
      el.style.fontSize = `${geometry.fontSize}px`;
      el.style.lineHeight = `${geometry.lineHeight}px`;
    },
    setText(text) {
      if (text === lastText) return;
      lastText = text;
      el.textContent = text;
    },
    setOpacity(value) {
      if (value === lastOpacity) return;
      lastOpacity = value;
      el.style.opacity = String(value);
    },
  };
}
