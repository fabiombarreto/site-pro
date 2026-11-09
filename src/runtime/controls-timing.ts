import type { Speed } from '../scripts/build-mode';

export const HINT_IDLE_MS = 4000;
export const DONE_COLLAPSE_MS = 4000;
export const SKIP_HOLD_MS = 1500;

export function nextSpeed(speed: Speed): Speed {
  if (speed === '1') return '2';
  if (speed === '2') return 'inf';
  return '1';
}

export function hintPulsing(idleMs: number): boolean {
  return idleMs >= HINT_IDLE_MS;
}

export function doneCollapsed(doneMs: number): boolean {
  return doneMs >= DONE_COLLAPSE_MS;
}

export function skipHeld(holdMs: number): boolean {
  return holdMs < SKIP_HOLD_MS;
}

export function queuePosition(
  activeIndex: number,
  nextQueued: boolean,
): number | null {
  return nextQueued ? activeIndex + 1 : null;
}

export function isWidthChange(
  previousWidth: number,
  nextWidth: number,
): boolean {
  return previousWidth !== nextWidth;
}

export function keyAction(
  event: {
    key: string;
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    repeat: boolean;
  },
  popoverOpen: boolean,
): 'skip' | 'runAll' | null {
  if (event.key !== 'Escape') return null;
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) {
    return null;
  }
  if (event.shiftKey) return 'runAll';
  if (popoverOpen) return null;
  return 'skip';
}
