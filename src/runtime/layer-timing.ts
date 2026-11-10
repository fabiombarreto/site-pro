import type { Timeline } from './types';

export const COMMAND_START_MS = 250;
export const COMMAND_CHAR_MS = 40;
export const COMMAND_ENTER_MS = 80;
export const WINDOW_CHAR_MS = 12;
export const WINDOW_CHAR_CAP_MS = 350;
export const BOOT_LOG_GAP_MS = 100;
export const BOOT_NAV_AT_MS = 900;
export const NAV_SLIDE_MS = 300;
export const FOLD_MS = 300;
export const WINDOW_CLOSE_MS = 300;
export const SPINNER_FRAME_MS = 80;
export const DOCK_LOG_HOLD_MS = 100;
export const WINDOW_OPEN_MS = 280;

type WindowTimes = Pick<Timeline, 'windowEnd' | 'buildStart' | 'createdAt'>;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function progressBetween(t: number, from: number, to: number): number {
  if (to <= from) return t >= to ? 1 : 0;
  return clamp((t - from) / (to - from), 0, 1);
}

export function easeOut(p: number): number {
  return 1 - (1 - p) ** 3;
}

export function commandChars(t: number, length: number): number {
  return clamp(Math.floor((t - COMMAND_START_MS) / COMMAND_CHAR_MS), 0, length);
}

export function commandEnterAt(length: number): number {
  return COMMAND_START_MS + length * COMMAND_CHAR_MS + COMMAND_ENTER_MS;
}

export function dockLogEnd(windowEnd: number, enterAt: number): number {
  return Math.max(windowEnd, enterAt + DOCK_LOG_HOLD_MS);
}

export function bootLogCount(t: number, enterAt: number): number {
  if (t < enterAt) return 0;
  return Math.min(2, 1 + Math.floor((t - enterAt) / BOOT_LOG_GAP_MS));
}

export function stepIndexAt(t: number, steps: { start: number }[]): number {
  let index = -1;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].start <= t) index = i;
  }
  return index;
}

export function windowCommandChars(
  t: number,
  step: { call: string; start: number },
): number {
  const duration = Math.min(
    step.call.length * WINDOW_CHAR_MS,
    WINDOW_CHAR_CAP_MS,
  );
  return Math.floor(
    step.call.length * progressBetween(t, step.start, step.start + duration),
  );
}

export function windowOpenProgress(t: number, tl: WindowTimes): number {
  return progressBetween(t, tl.windowEnd, tl.buildStart);
}

export function foldProgress(t: number, tl: WindowTimes): number {
  return progressBetween(t, tl.windowEnd, tl.windowEnd + FOLD_MS);
}

export function windowCloseProgress(t: number, tl: WindowTimes): number {
  return progressBetween(t, tl.createdAt, tl.createdAt + WINDOW_CLOSE_MS);
}

export function navSlideProgress(t: number): number {
  return progressBetween(t, BOOT_NAV_AT_MS, BOOT_NAV_AT_MS + NAV_SLIDE_MS);
}

export function spinnerFrame(loopMs: number, frames = 10): number {
  return Math.floor(loopMs / SPINNER_FRAME_MS) % frames;
}

export function formatSeconds(ms: number, digits = 2): string {
  return (ms / 1000).toFixed(digits);
}
