import { EFFECT_DURATION_MS } from '../runtime/effect-timing';
import type { BuildStep } from '../runtime/types';

export interface PacedEntry {
  step: BuildStep;
  // Distance from the start of the previous step to the start of this one.
  pitch?: number;
}

export function pacedSteps(
  entries: PacedEntry[],
  createdRel: number,
  minSettle = 60,
): { steps: BuildStep[]; settle: number } {
  const steps: BuildStep[] = [];
  let offset = 0;
  let previousEnd = 0;
  for (const [i, { step, pitch = 0 }] of entries.entries()) {
    const length = EFFECT_DURATION_MS[step.effect](step);
    if (typeof length === 'string') {
      throw new Error(`paced step "${step.call}": ${length}`);
    }
    const start = i === 0 ? 0 : offset + pitch;
    const delta = start - previousEnd;
    const copy: BuildStep = { ...step };
    if (i > 0) {
      if (delta > 0) copy.gap = delta;
      else if (delta < 0) copy.overlap = -delta;
    }
    steps.push(copy);
    offset = start;
    previousEnd = start + length;
  }
  return { steps, settle: Math.max(minSettle, createdRel - previousEnd) };
}
