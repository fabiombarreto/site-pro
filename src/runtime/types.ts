export const EFFECTS = [
  'select',
  'skeleton',
  'type-text',
  'decode',
  'resolve-lines',
  'pop',
  'stagger',
  'build-card',
] as const;

export type EffectName = (typeof EFFECTS)[number];

export type SectionId = 'top' | 'about' | 'projects' | 'stack' | 'contact';

export type SectionState =
  | 'pending'
  | 'queued'
  | 'command'
  | 'window'
  | 'building'
  | 'closing'
  | 'done'
  | 'skipped';

export interface BuildStep {
  call: string;
  target: string;
  effect: EffectName;
  text?: string;
  count?: number;
  gap?: number;
  overlap?: number;
}

export interface TimelineStep {
  call: string;
  target: string;
  effect: EffectName;
  start: number;
  end: number;
}

export interface Timeline {
  v: 1;
  section: SectionId;
  file: string;
  command: string;
  commandEnd: number;
  windowEnd: number;
  buildStart: number;
  steps: TimelineStep[];
  createdAt: number;
  duration: number;
}

export interface BuildScript {
  section: SectionId;
  file: string;
  command: string;
  steps: BuildStep[];
  settle?: number;
  timing?: Partial<Pick<Timeline, 'commandEnd' | 'windowEnd' | 'buildStart'>>;
}
