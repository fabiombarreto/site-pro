import { strings } from '../strings';

export type Theme = 'midnight' | 'daylight';

export const THEME_STORAGE_KEY = 'sp-theme';

export const DEFAULT_THEME: Theme = 'midnight';

export function parseTheme(value: unknown): Theme {
  return value === 'daylight' ? 'daylight' : 'midnight';
}

export function otherTheme(theme: Theme): Theme {
  return theme === 'midnight' ? 'daylight' : 'midnight';
}

export function themeToggleLabel(current: Theme): string {
  return current === 'midnight'
    ? strings.theme.switchToDaylight
    : strings.theme.switchToMidnight;
}

export function colorSchemeFor(theme: Theme): 'dark' | 'light' {
  return theme === 'daylight' ? 'light' : 'dark';
}
