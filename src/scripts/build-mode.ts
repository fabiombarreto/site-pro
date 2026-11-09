export const SPEED_STORAGE_KEY = 'sp-speed';
export const WATCHDOG_MS = 3000;

export type Speed = '1' | '2' | 'inf';
export type BuildMode = 'instant' | 'pending';

// The inline head script in src/layouts/Base.astro mirrors these two helpers.
export function parseSpeed(raw: string | null | undefined): Speed {
  return raw === '2' || raw === 'inf' ? raw : '1';
}

export function resolveMode(reducedMotion: boolean, speed: Speed): BuildMode {
  return reducedMotion || speed === 'inf' ? 'instant' : 'pending';
}

export function persistSpeed(next: Speed): void {
  try {
    localStorage.setItem(SPEED_STORAGE_KEY, next);
  } catch {
    // Storage may be blocked; the in-page speed still changes.
  }
}
