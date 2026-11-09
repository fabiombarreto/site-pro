import { buildStrings } from '../../strings';
import { h } from './dom';

export interface FooterBuild {
  setSummary(seconds: string | null): void;
  clear(): void;
}

export function createFooterBuild(
  slot: HTMLElement,
  onReplay: () => void,
): FooterBuild {
  return {
    setSummary(seconds) {
      const nodes: Node[] = [];
      if (seconds !== null) {
        nodes.push(document.createTextNode(buildStrings.footerBuilt(seconds)));
      }
      const button = h('button', 'sp-footer-replay', {
        type: 'button',
        'aria-label': buildStrings.replayLabel,
      });
      button.textContent = buildStrings.replay;
      button.addEventListener('click', onReplay);
      nodes.push(button);
      slot.replaceChildren(...nodes);
    },
    clear() {
      slot.replaceChildren();
    },
  };
}
