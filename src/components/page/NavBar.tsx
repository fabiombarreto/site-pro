import './NavBar.css';
import { Icon } from './Icon';
import { IconLink } from './IconLink';
import { MOBILE_MENU_ID, MobileMenu } from './MobileMenu';
import { ThemeToggle } from './ThemeToggle';
import { cx } from './cx';
import { strings } from '../../strings';

// Lowercase on purpose: React's server renderer would emit the camelCase popoverTarget property name.
const POPOVER_TARGET = { popovertarget: MOBILE_MENU_ID };

interface NavBarProps {
  githubHref: string;
  linkedinHref: string;
  active?: string;
  homeHref?: string;
  className?: string;
}

export function NavBar({
  githubHref,
  linkedinHref,
  active,
  homeHref = '',
  className,
}: NavBarProps): React.JSX.Element {
  return (
    <header className={cx('sp-nav', className)}>
      <div className="sp-nav-inner">
        <a className="sp-nav-name" href={`${homeHref}#top`}>
          {strings.nav.brand}
        </a>
        <nav
          className="sp-nav-links text-sm"
          aria-label={strings.nav.ariaLabel}
        >
          {strings.nav.links.map((link) => (
            <a
              key={link.id}
              className={cx('sp-nav-link', active === link.id && 'is-active')}
              href={`${homeHref}#${link.id}`}
              aria-current={active === link.id ? 'true' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="sp-nav-actions">
          <ThemeToggle />
          <IconLink
            href={githubHref}
            icon="github"
            label={strings.buttons.github}
          />
          <button
            type="button"
            {...POPOVER_TARGET}
            className="sp-icon-btn sp-menu-toggle"
            aria-label={strings.nav.openMenu}
          >
            <Icon name="menu" size={20} />
          </button>
        </div>
      </div>
      <MobileMenu
        githubHref={githubHref}
        linkedinHref={linkedinHref}
        active={active}
        homeHref={homeHref}
      />
    </header>
  );
}
