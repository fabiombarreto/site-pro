import {
  COMMAND_CHAR_MS,
  COMMAND_ENTER_MS,
  COMMAND_START_MS,
} from './layer-timing';
import { EFFECT_DURATION_MS } from './effect-timing';
import {
  EFFECTS,
  type BuildScript,
  type BuildStep,
  type Timeline,
  type TimelineStep,
} from './types';

export { EFFECT_DURATION_MS } from './effect-timing';

const WINDOW_OPEN_MS = 100;
const WINDOW_HOLD_MS = 280;
const DEFAULT_SETTLE_MS = 300;
const CLOSING_MS = 500;

function fail(script: BuildScript, i: number, call: string, problem: string) {
  return new Error(
    `build script "${script.section}" step ${i} (${call}): ${problem}`,
  );
}

function durationOf(script: BuildScript, step: BuildStep, i: number): number {
  if (!(EFFECTS as readonly string[]).includes(step.effect)) {
    throw fail(script, i, step.call, `unknown effect "${step.effect}"`);
  }
  if (step.target.trim() === '') {
    throw fail(script, i, step.call, 'empty target');
  }
  if (/[<>]/.test(step.call)) {
    throw fail(script, i, step.call, 'call must not contain < or >');
  }
  const result = EFFECT_DURATION_MS[step.effect](step);
  if (typeof result === 'string') throw fail(script, i, step.call, result);
  return result;
}

export function compileScript(script: BuildScript): Timeline {
  if (script.steps.length === 0) {
    throw new Error(`build script "${script.section}": no steps`);
  }
  if (/[<>]/.test(script.command)) {
    throw new Error(
      `build script "${script.section}": command must not contain < or >`,
    );
  }
  if (script.log !== undefined && /[<>]/.test(script.log)) {
    throw new Error(
      `build script "${script.section}": log must not contain < or >`,
    );
  }
  const commandEnd =
    script.timing?.commandEnd ??
    COMMAND_START_MS +
      script.command.length * COMMAND_CHAR_MS +
      COMMAND_ENTER_MS;
  const windowEnd = script.timing?.windowEnd ?? commandEnd + WINDOW_OPEN_MS;
  const buildStart = script.timing?.buildStart ?? windowEnd + WINDOW_HOLD_MS;

  const steps: TimelineStep[] = [];
  let previousEnd = buildStart;
  script.steps.forEach((step, i) => {
    const length = durationOf(script, step, i);
    const start =
      i === 0
        ? buildStart + (step.gap ?? 0)
        : previousEnd + (step.gap ?? 0) - (step.overlap ?? 0);
    const end = start + length;
    steps.push({
      call: step.call,
      target: step.target,
      effect: step.effect,
      start,
      end,
    });
    previousEnd = end;
  });

  const createdAt = previousEnd + (script.settle ?? DEFAULT_SETTLE_MS);
  return {
    v: 1,
    section: script.section,
    file: script.file,
    command: script.command,
    ...(script.log === undefined ? {} : { log: script.log }),
    commandEnd,
    windowEnd,
    buildStart,
    steps,
    createdAt,
    duration: createdAt + CLOSING_MS,
  };
}

export function serializeTimeline(timeline: Timeline): string {
  return JSON.stringify(timeline);
}
