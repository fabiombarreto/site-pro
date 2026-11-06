import './Actions.css';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { cx } from './cx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  icon?: IconName;
  iconEnd?: IconName;
  external?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

type ButtonProps = ButtonBaseProps & {
  href?: string;
} & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement> &
      React.ButtonHTMLAttributes<HTMLButtonElement>,
    keyof ButtonBaseProps | 'href'
  >;

export function Button({
  variant = 'primary',
  icon,
  iconEnd,
  external = false,
  href,
  disabled = false,
  children,
  className,
  ...rest
}: ButtonProps): React.JSX.Element {
  const classes = cx('sp-btn', `sp-btn-${variant}`, 'text-sm', className);
  const end = iconEnd ?? (external ? 'arrowUpRight' : undefined);
  const inner = (
    <>
      {icon && <Icon name={icon} size={16} />}
      <span>{children}</span>
      {end && <Icon name={end} size={16} className="sp-btn-end" />}
    </>
  );

  if (href && !disabled) {
    return (
      <a
        className={classes}
        href={href}
        {...(external
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : undefined)}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {inner}
    </button>
  );
}
