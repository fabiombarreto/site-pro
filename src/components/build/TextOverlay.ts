import { h } from './dom';

export interface TextOverlay {
  el: HTMLDivElement;
  setCaret(x: number, y: number, height: number): void;
  hideCaret(): void;
  setScramble(text: string, x: number, y: number): void;
  setFont(font: {
    font: string;
    letterSpacing: string;
    lineHeight: string;
  }): void;
}

export function createTextOverlay(): TextOverlay {
  const el = h('div', 'sp-text-fx', { 'aria-hidden': 'true' });
  const caret = h('span', 'sp-caret');
  const scramble = h('span', 'sp-scramble');
  caret.style.display = 'none';
  el.append(caret, scramble);

  let caretKey = '';
  let scrambleText = '';
  let scrambleKey = '';
  let fontKey = '';

  return {
    el,
    setCaret(x, y, height) {
      const key = `${x}|${y}|${height}`;
      if (key === caretKey) return;
      caretKey = key;
      caret.style.display = '';
      caret.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      caret.style.height = `${height}px`;
    },
    hideCaret() {
      if (caretKey === 'hidden') return;
      caretKey = 'hidden';
      caret.style.display = 'none';
    },
    setScramble(text, x, y) {
      if (text !== scrambleText) {
        scrambleText = text;
        scramble.textContent = text;
      }
      const key = text === '' ? '' : `${x}|${y}`;
      if (key === scrambleKey) return;
      scrambleKey = key;
      if (text !== '')
        scramble.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    },
    setFont(font) {
      const key = `${font.font}|${font.letterSpacing}|${font.lineHeight}`;
      if (key === fontKey) return;
      fontKey = key;
      scramble.style.font = font.font;
      scramble.style.letterSpacing = font.letterSpacing;
      scramble.style.lineHeight = font.lineHeight;
    },
  };
}
