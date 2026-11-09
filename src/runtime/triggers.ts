import type { SectionId } from './types';

export function observeSections(
  sections: HTMLElement[],
  onTrigger: (id: SectionId) => void,
): () => void {
  const fired = new Set<Element>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (fired.has(entry.target)) continue;
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          fired.add(entry.target);
          observer.unobserve(entry.target);
          onTrigger(entry.target.id as SectionId);
        }
      }
    },
    { rootMargin: '0px 0px -25% 0px', threshold: 0 },
  );
  for (const section of sections) observer.observe(section);
  return () => observer.disconnect();
}
