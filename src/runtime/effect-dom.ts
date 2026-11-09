// DOM helpers for the element effects. Read-only measurement plus the few
// writes effects may make on a page element: the data-build-fx attribute and
// the inline opacity and clip-path. Nothing here writes transform, display,
// visibility or text to a page element.

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MeasuredChar {
  ch: string;
  x: number;
  right: number;
}

export interface MeasuredLine {
  // Clip bounds: extended halfway to the neighbour lines, element-relative.
  top: number;
  bottom: number;
  left: number;
  right: number;
  // The glyph rects of the line itself, element-relative.
  textTop: number;
  textBottom: number;
  chars: MeasuredChar[];
}

const round = (value: number) => Math.round(value * 10) / 10;

export function docRect(el: HTMLElement): Box {
  const r = el.getBoundingClientRect();
  return {
    x: r.left + window.scrollX,
    y: r.top + window.scrollY,
    width: r.width,
    height: r.height,
  };
}

export function measureLines(el: HTMLElement): MeasuredLine[] {
  const box = el.getBoundingClientRect();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  const lines: MeasuredLine[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = (node as Text).data;
    for (let i = 0; i < text.length; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = range.getClientRects()[0];
      if (!rect) continue;
      if (rect.width === 0 && /\s/.test(text[i])) continue;
      const top = rect.top - box.top;
      const bottom = rect.bottom - box.top;
      const middle = (top + bottom) / 2;
      const char = {
        ch: text[i],
        x: rect.left - box.left,
        right: rect.right - box.left,
      };
      let line = lines[lines.length - 1];
      if (!line || middle < line.textTop || middle > line.textBottom) {
        line = {
          top: 0,
          bottom: 0,
          left: char.x,
          right: char.right,
          textTop: top,
          textBottom: bottom,
          chars: [],
        };
        lines.push(line);
      }
      line.textTop = Math.min(line.textTop, top);
      line.textBottom = Math.max(line.textBottom, bottom);
      line.left = Math.min(line.left, char.x);
      line.right = Math.max(line.right, char.right);
      line.chars.push(char);
    }
  }
  lines.forEach((line, i) => {
    const prev = lines[i - 1];
    const next = lines[i + 1];
    line.top = prev ? (prev.textBottom + line.textTop) / 2 : 0;
    line.bottom = next ? (line.textBottom + next.textTop) / 2 : box.height;
  });
  return lines;
}

export function countChars(lines: MeasuredLine[]): number {
  let total = 0;
  for (const line of lines) total += line.chars.length;
  return total;
}

export function textOf(lines: MeasuredLine[]): string {
  let text = '';
  for (const line of lines) for (const char of line.chars) text += char.ch;
  return text;
}

// Line and index inside it of the character number `shown - 1`.
export function locate(
  lines: MeasuredLine[],
  shown: number,
): { line: MeasuredLine; index: number; lineStart: number } | null {
  if (lines.length === 0) return null;
  let rest = Math.max(shown, 1);
  let start = 0;
  let i = 0;
  while (i < lines.length - 1 && rest > lines[i].chars.length) {
    rest -= lines[i].chars.length;
    start += lines[i].chars.length;
    i++;
  }
  const line = lines[i];
  return {
    line,
    index: Math.min(rest, line.chars.length) - 1,
    lineStart: start,
  };
}

export function revealPolygon(
  lines: MeasuredLine[],
  shown: number,
  total: number,
): string {
  const at = shown > 0 ? locate(lines, Math.min(shown, total)) : null;
  if (!at) return 'inset(0 100% 0 0)';
  const x = round(at.line.chars[at.index].right);
  const top = round(at.line.top);
  const bottom = round(at.line.bottom);
  return `polygon(0 0, 100% 0, 100% ${top}px, ${x}px ${top}px, ${x}px ${bottom}px, 0 ${bottom}px)`;
}

export function lineReveal(lines: MeasuredLine[], count: number): string {
  if (count <= 0) return 'inset(0 100% 0 0)';
  if (count >= lines.length) return 'inset(0)';
  const bottom = round(lines[count - 1].bottom);
  return `polygon(0 0, 100% 0, 100% ${bottom}px, 0 ${bottom}px)`;
}

export function popClip(inset: number, radius: string): string {
  return `inset(${round(inset)}% round ${radius})`;
}

const TAG_LABELS = new Set(['H1', 'H2', 'H3', 'P', 'UL', 'A']);

export function labelFor(el: HTMLElement): string {
  const explicit = el.getAttribute('data-build-label');
  if (explicit) return explicit;
  if (el.querySelector('article')) return 'card';
  if (el.querySelector('img') && (el.textContent ?? '').trim() === '') {
    const r = el.getBoundingClientRect();
    return `img ${Math.round(r.width)}x${Math.round(r.height)}`;
  }
  if (TAG_LABELS.has(el.tagName)) return el.tagName.toLowerCase();
  const heading = el.querySelector('h1, h2, h3');
  return heading ? heading.tagName.toLowerCase() : 'div';
}

const written = new WeakMap<HTMLElement, Map<string, string>>();

export function setStyle(
  el: HTMLElement,
  prop: 'clip-path' | 'opacity',
  value: string,
): void {
  let cache = written.get(el);
  if (!cache) {
    cache = new Map();
    written.set(el, cache);
  }
  if (cache.get(prop) === value) return;
  cache.set(prop, value);
  el.style.setProperty(prop, value);
}

export function hide(el: HTMLElement): void {
  el.setAttribute('data-build-fx', 'hidden');
}

export function live(el: HTMLElement): void {
  el.removeAttribute('data-build-fx');
}

export function clear(el: HTMLElement): void {
  el.removeAttribute('data-build-fx');
  written.delete(el);
  el.style.removeProperty('clip-path');
  el.style.removeProperty('opacity');
  el.style.removeProperty('pointer-events');
  if (el.getAttribute('style') === '') el.removeAttribute('style');
}
