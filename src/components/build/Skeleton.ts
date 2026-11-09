import { h } from './dom';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Skeleton {
  el: HTMLDivElement;
  setOpacity(value: number): void;
  setVisibleBlocks(from: number): void;
}

export function createSkeleton(rects: Rect[]): Skeleton {
  const el = h('div', 'sp-skel', { 'aria-hidden': 'true' });
  const blocks = rects.map((rect) => {
    const block = h('span', 'sp-skel-block');
    block.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
    block.style.width = `${rect.width}px`;
    block.style.height = `${rect.height}px`;
    el.append(block);
    return block;
  });

  let lastOpacity = -1;
  let lastFrom = 0;

  return {
    el,
    setOpacity(value) {
      if (value === lastOpacity) return;
      lastOpacity = value;
      el.style.opacity = String(value);
    },
    setVisibleBlocks(from) {
      if (from === lastFrom) return;
      for (
        let i = Math.min(from, lastFrom);
        i < Math.max(from, lastFrom);
        i++
      ) {
        const block = blocks[i];
        if (block) block.style.opacity = i < from ? '0' : '';
      }
      lastFrom = from;
    },
  };
}
