import './Actions.css';
import { Icon } from './Icon';
import { cx } from './cx';

interface TextLinkProps extends Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'className' | 'children'
> {
  href: string;
  external?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function TextLink({
  href,
  external = false,
  children,
  className,
  ...rest
}: TextLinkProps): React.JSX.Element {
  return (
    <a
      className={cx('sp-link', className)}
      href={href}
      {...(external
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : undefined)}
      {...rest}
    >
      {children}
      {external && (
        <Icon name="arrowUpRight" size={14} className="sp-link-ext" />
      )}
    </a>
  );
}
