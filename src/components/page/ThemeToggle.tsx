import './ThemeToggle.css';
import { Icon } from './Icon';
import { strings } from '../../strings';

interface ThemeToggleProps {
  className?: string;
}

// The Midnight-state name from src/strings.ts; themeToggleLabel('midnight') returns the same text.
const DEFAULT_LABEL = strings.theme.switchToDaylight;

export function ThemeToggle({
  className,
}: ThemeToggleProps): React.JSX.Element {
  return (
    <button
      type="button"
      data-theme-toggle
      className={`sp-icon-btn sp-theme-toggle${className ? ` ${className}` : ''}`}
      aria-label={DEFAULT_LABEL}
      title={DEFAULT_LABEL}
    >
      <Icon name="sun" size={18} className="sp-theme-sun" />
      <Icon name="moon" size={18} className="sp-theme-moon" />
    </button>
  );
}
