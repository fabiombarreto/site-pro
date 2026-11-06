import './ThemeToggle.css';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { cx } from './cx';

interface IconLinkProps extends Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'className' | 'children'
> {
  href: string;
  icon: IconName;
  label: string;
  className?: string;
}

export function IconLink({
  href,
  icon,
  label,
  className,
  ...rest
}: IconLinkProps): React.JSX.Element {
  return (
    <a
      className={cx('sp-icon-btn', className)}
      href={href}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} size={18} />
    </a>
  );
}
