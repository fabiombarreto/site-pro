import { atom } from 'nanostores';
import type { SectionId } from '../runtime/types';
import type { Speed } from '../scripts/build-mode';

export type BuildStatus = 'idle' | 'building' | 'done' | 'instant' | 'failed';

export const currentSection = atom<SectionId | null>(null);
export const progress = atom<number>(0);
export const status = atom<BuildStatus>('idle');
export const speed = atom<Speed>('1');
export const queue = atom<{ position: number; total: number } | null>(null);
