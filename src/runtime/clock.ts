export interface Clock {
  now(): number;
  onFrame(cb: (now: number) => void): () => void;
}

export const realClock: Clock = {
  now: () => performance.now(),
  onFrame(cb) {
    let handle = 0;
    let active = true;
    const tick = (now: number) => {
      if (!active) return;
      handle = requestAnimationFrame(tick);
      cb(now);
    };
    handle = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(handle);
    };
  },
};

export interface ManualClock extends Clock {
  advance(ms: number, step?: number): void;
}

export function createManualClock(start = 0): ManualClock {
  let current = start;
  const listeners = new Set<(now: number) => void>();
  return {
    now: () => current,
    onFrame(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    advance(ms, step = 16) {
      let remaining = ms;
      while (remaining > 0) {
        const chunk = Math.min(step, remaining);
        current += chunk;
        remaining -= chunk;
        for (const cb of [...listeners]) cb(current);
      }
    },
  };
}
