import { keyAction } from './controls-timing';

function isPopoverOpen(): boolean {
  try {
    return document.querySelector(':popover-open, dialog[open]') !== null;
  } catch {
    // A browser without :popover-open throws a SyntaxError for the selector.
    return document.querySelector('dialog[open]') !== null;
  }
}

export function bindKeys(actions: {
  skip(): void;
  runAll(): void;
}): () => void {
  // Capture phase: an open popover is still open when this runs, before the
  // browser processes its close request. Never prevents the native Esc.
  const onKeyDown = (event: KeyboardEvent) => {
    const action = keyAction(event, isPopoverOpen());
    if (action === 'skip') actions.skip();
    else if (action === 'runAll') actions.runAll();
  };
  document.addEventListener('keydown', onKeyDown, true);
  return () => document.removeEventListener('keydown', onKeyDown, true);
}
