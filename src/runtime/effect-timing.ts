import type { BuildStep, EffectName } from './types';

// Pure, DOM-free effect timing: durations, seeded randomness and the phase
// of every effect as a function of the step's local time in ms.

export const SELECT_MS = 150;
export const SKELETON_MS = 300;
export const SKELETON_BARS_MS = 200;
export const TYPE_CHAR_MS = 28;
export const DECODE_MS = 350;
export const LINE_MS = 40;
export const POP_MS = 180;
export const STAGGER_GAP_MS = 90;
export const CARD_MS = 300;
export const SCRAMBLE_FRAME_MS = 40;
export const WINDOW_CALL_MAX = 29;
// image-resolve: select (150) + skeleton (150), then the 700 ms dissolve.
export const DISSOLVE_MS = 700;
export const DISSOLVE_STEPS = 16;
// The photo rises from this non-zero opacity (a hidden image is not counted
// as the largest paint); one tunable constant.
export const PHOTO_START_OPACITY = 0.12;
// Monospace advance in em; mirrors the build-time ASCII cell aspect, which
// the runtime must not import (it pulls in sharp).
export const ASCII_ADVANCE = 0.6;
export const BAYER_4X4: readonly (readonly number[])[] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
export const SCRAMBLE_GLYPHS = '!<>-_\\/[]{}=+*^?#';

const DOCK_START_MS = 250;
const DOCK_CHAR_MS = 40;
const DOCK_JITTER_MS = 10;
const DOCK_PAUSE_MS = 100;

// End of the select and skeleton phases of image-resolve (ms).
export const RESOLVE_REVEAL_MS = 300;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function ramp(t: number, from: number, to: number): number {
  if (to <= from) return t >= to ? 1 : 0;
  return clamp((t - from) / (to - from), 0, 1);
}

export const EFFECT_DURATION_MS: Record<
  EffectName,
  (step: BuildStep) => number | string
> = {
  select: () => SELECT_MS,
  skeleton: () => SELECT_MS + SKELETON_MS,
  'type-text': (s) =>
    s.text === undefined ? 'needs text' : 150 + s.text.length * TYPE_CHAR_MS,
  decode: (s) => (s.text === undefined ? 'needs text' : SELECT_MS + DECODE_MS),
  'resolve-lines': (s) =>
    s.count === undefined
      ? 'needs count'
      : SELECT_MS + SKELETON_BARS_MS + s.count * LINE_MS,
  pop: (s) =>
    SELECT_MS + POP_MS + Math.max((s.count ?? 1) - 1, 0) * STAGGER_GAP_MS,
  stagger: (s) =>
    s.count === undefined
      ? 'needs count'
      : SELECT_MS + POP_MS + Math.max(s.count - 1, 0) * STAGGER_GAP_MS,
  'image-resolve': () => RESOLVE_REVEAL_MS + DISSOLVE_MS,
  'build-card': () => CARD_MS,
};

export function hashSeed(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

export function estimateLines(text: string, charsPerLine: number): number {
  let lines = 0;
  for (const paragraph of text.split('\n\n')) {
    lines += Math.max(1, Math.ceil(paragraph.length / charsPerLine));
  }
  return lines;
}

const dockSchedules = new Map<string, number[]>();

function dockSchedule(command: string): number[] {
  const cached = dockSchedules.get(command);
  if (cached) return cached;
  const length = command.length;
  const rng = createRng(hashSeed(command));
  const cumulative: number[] = [];
  let sum = 0;
  for (let k = 0; k < length; k++) {
    let delay = DOCK_CHAR_MS + (rng() * 2 * DOCK_JITTER_MS - DOCK_JITTER_MS);
    if (k > 0 && (command[k - 1] === '(' || command[k - 1] === ',')) {
      delay += DOCK_PAUSE_MS;
    }
    sum += delay;
    cumulative.push(sum);
  }
  const scale = sum > 0 ? (length * DOCK_CHAR_MS) / sum : 1;
  const times = cumulative.map((c) => DOCK_START_MS + scale * c);
  if (length > 0) times[length - 1] = DOCK_START_MS + length * DOCK_CHAR_MS;
  dockSchedules.set(command, times);
  return times;
}

export function typedChars(t: number, command: string): number {
  const times = dockSchedule(command);
  let count = 0;
  while (count < times.length && times[count] <= t) count++;
  return count;
}

export function truncateCall(call: string, max = WINDOW_CALL_MAX): string {
  if (call.length <= max) return call;
  const open = call.indexOf('(');
  if (open !== -1 && call[open + 1] === '"') {
    const head = call.slice(0, open + 2);
    const tail = call.endsWith('")') ? '")' : ')';
    const keep = max - head.length - 1 - tail.length;
    if (keep >= 0) {
      const body = call.slice(head.length, call.length - tail.length);
      return `${head}${body.slice(0, keep)}…${tail}`;
    }
  }
  return `${call.slice(0, max - 1)}…`;
}

export function typeCharsAt(localMs: number, length: number): number {
  return clamp(Math.floor((localMs - SELECT_MS) / TYPE_CHAR_MS), 0, length);
}

export function decodeSettled(localMs: number, length: number): number {
  return Math.floor(length * ramp(localMs, SELECT_MS, SELECT_MS + DECODE_MS));
}

export function decodeGlyphs(
  text: string,
  localMs: number,
  seed: number,
): string {
  const settled = decodeSettled(localMs, text.length);
  const rng = createRng(seed + Math.floor(localMs / SCRAMBLE_FRAME_MS) * 7919);
  let out = '';
  for (let i = 0; i < text.length; i++) {
    if (i < settled || text[i] === ' ') out += text[i];
    else out += SCRAMBLE_GLYPHS[Math.floor(rng() * SCRAMBLE_GLYPHS.length)];
  }
  return out;
}

export function resolveLinesAt(localMs: number, count: number): number {
  return clamp(
    Math.floor((localMs - SELECT_MS - SKELETON_BARS_MS) / LINE_MS),
    0,
    count,
  );
}

export function popProgress(localMs: number): number {
  return ramp(localMs, SELECT_MS, SELECT_MS + POP_MS);
}

export function popInset(p: number): number {
  if (p < 0.7) return 10 - 14 * (p / 0.7);
  return -4 * (1 - (p - 0.7) / 0.3);
}

export function staggerChildProgress(localMs: number, index: number): number {
  return popProgress(localMs - index * STAGGER_GAP_MS);
}

export function cardPhases(localMs: number): {
  select: number;
  skeleton: boolean;
  cover: number;
  coverStarted: boolean;
  title: number;
  summary: number;
  tags: number;
} {
  return {
    select: ramp(localMs, 0, 150),
    skeleton: localMs >= 150 && localMs < 190,
    cover: ramp(localMs, 190, 270),
    coverStarted: localMs >= 190,
    title: ramp(localMs, 190, 270),
    summary: ramp(localMs, 210, 285),
    tags: ramp(localMs, 240, 300),
  };
}

export function dissolveProgress(localMs: number): number {
  return ramp(localMs, RESOLVE_REVEAL_MS, RESOLVE_REVEAL_MS + DISSOLVE_MS);
}

export function dissolveStep(localMs: number): number {
  return Math.floor(DISSOLVE_STEPS * dissolveProgress(localMs));
}

export function photoOpacity(localMs: number): number {
  const value =
    PHOTO_START_OPACITY + (1 - PHOTO_START_OPACITY) * dissolveProgress(localMs);
  return Math.round(value * 100) / 100;
}

export function ditherAscii(ascii: string, step: number): string {
  if (step <= 0) return ascii;
  let out = '';
  let x = 0;
  let y = 0;
  for (const ch of ascii) {
    if (ch === '\n') {
      out += ch;
      x = 0;
      y++;
      continue;
    }
    out += BAYER_4X4[y % 4][x % 4] < step ? ' ' : ch;
    x++;
  }
  return out;
}

export function asciiGeometry(
  ascii: string,
  box: { width: number; height: number },
): { cols: number; rows: number; fontSize: number; lineHeight: number } {
  if (ascii.length === 0)
    return { cols: 0, rows: 0, fontSize: 0, lineHeight: 0 };
  const lines = ascii.split('\n');
  const cols = Math.max(...lines.map((line) => line.length));
  const rows = lines.length;
  if (cols === 0) return { cols: 0, rows, fontSize: 0, lineHeight: 0 };
  return {
    cols,
    rows,
    fontSize: box.width / (cols * ASCII_ADVANCE),
    lineHeight: box.height / rows,
  };
}
