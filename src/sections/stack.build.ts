import type { CollectionEntry } from 'astro:content';
import type { BuildScript } from '../runtime/types';
import { strings } from '../strings';
import { pacedSteps } from './pacing';

type StackData = CollectionEntry<'stack'>['data'];

export function stackBuild(stack: StackData): BuildScript {
  const { steps, settle } = pacedSteps(
    [
      {
        step: {
          call: `stack.heading("${strings.sections.stack.title}")`,
          target: 'heading',
          effect: 'type-text',
          text: strings.sections.stack.title,
        },
      },
      ...stack.groups.map((group, index) => ({
        step: {
          call: `stack.group("${group.name}")`,
          target: `group-${index}`,
          effect: 'stagger' as const,
          count: group.items.length,
        },
        pitch: index === 0 ? 400 : 150,
      })),
    ],
    1350,
  );
  return {
    section: 'stack',
    file: 'stack.tsx',
    command: 'renderStack();',
    steps,
    settle,
  };
}
