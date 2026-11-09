import type { Speed } from '../scripts/build-mode';

export interface Controls {
  skip(): void;
  runAll(): void;
  setSpeed(speed: Speed): void;
  cycleSpeed(): void;
  replay(): void;
  play(): void;
}

let controls: Controls | null = null;

export function getControls(): Controls | null {
  return controls;
}

export function setControls(next: Controls | null): void {
  controls = next;
}

export {
  currentSection,
  progress,
  queue,
  speed,
  status,
} from '../stores/build';
