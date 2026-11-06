import {
  THEME_STORAGE_KEY,
  colorSchemeFor,
  otherTheme,
  parseTheme,
  themeToggleLabel,
} from './theme';

const root = document.documentElement;
const toggles = document.querySelectorAll<HTMLElement>('[data-theme-toggle]');

function syncLabels(): void {
  const label = themeToggleLabel(parseTheme(root.dataset.theme));
  toggles.forEach((toggle) => {
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
  });
}

toggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const next = otherTheme(parseTheme(root.dataset.theme));
    root.dataset.theme = next;
    root.style.colorScheme = colorSchemeFor(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage may be blocked; the in-page theme still changes.
    }
    syncLabels();
  });
});

syncLabels();
root.setAttribute('data-js', '');
