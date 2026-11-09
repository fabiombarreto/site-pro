import type { SectionId } from './types';

export function observeFocus(options: {
  sections: HTMLElement[];
  heroId: SectionId;
  finishThrough(id: SectionId): void;
}): () => void {
  const { sections, heroId, finishThrough } = options;
  const hero = sections.find((s) => s.id === heroId);
  const onFocusIn = (event: FocusEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const section = sections.find((s) => s.contains(target));
    if (section) {
      finishThrough(section.id as SectionId);
      return;
    }
    const state = hero?.getAttribute('data-build-state');
    if (state === 'done' || state === 'skipped') return;
    if (
      target.closest('.sp-nav') !== null ||
      target === document.getElementById('main')
    ) {
      finishThrough(heroId);
    }
  };
  document.addEventListener('focusin', onFocusIn);
  return () => document.removeEventListener('focusin', onFocusIn);
}
