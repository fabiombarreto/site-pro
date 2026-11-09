import { isWidthChange } from './controls-timing';

export function observeWidth(onChange: () => void): () => void {
  let previous = window.innerWidth;
  const onResize = () => {
    const next = window.innerWidth;
    if (!isWidthChange(previous, next)) return;
    previous = next;
    onChange();
  };
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}
