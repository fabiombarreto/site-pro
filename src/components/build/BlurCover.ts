import { h } from './dom';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BlurCover {
  el: HTMLDivElement;
  setPlacement(rect: Rect): void;
  setOpacity(value: number): void;
}

export function createBlurCover(src: string): BlurCover {
  const el = h('div', 'sp-blur-cover', { 'aria-hidden': 'true' });
  const img = h('img', undefined, {
    alt: '',
    'aria-hidden': 'true',
    decoding: 'async',
  });
  img.src = src;
  el.append(img);
  let lastOpacity = -1;

  return {
    el,
    setPlacement(rect) {
      el.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
    },
    setOpacity(value) {
      if (value === lastOpacity) return;
      lastOpacity = value;
      el.style.opacity = String(value);
    },
  };
}
