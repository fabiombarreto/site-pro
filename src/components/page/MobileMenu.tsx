import './NavBar.css';
import { Button } from './Button';
import { cx } from './cx';
import { strings } from '../../strings';

export const MOBILE_MENU_ID = 'mobile-menu';

interface MobileMenuProps {
  githubHref: string;
  linkedinHref: string;
  active?: string;
  homeHref?: string;
  className?: string;
}

export function MobileMenu({
  githubHref,
  linkedinHref,
  active,
  homeHref = '',
  className,
}: MobileMenuProps): React.JSX.Element {
  return (
    <div
      id={MOBILE_MENU_ID}
      popover="auto"
      className={cx('sp-menu', className)}
    >
      <nav aria-label={strings.nav.menuAriaLabel}>
        <ul>
          {strings.nav.links.map((link) => (
            <li key={link.id}>
              <a
                className={cx(
                  'sp-menu-link',
                  active === link.id && 'is-active',
                )}
                href={`${homeHref}#${link.id}`}
                aria-current={active === link.id ? 'true' : undefined}
              >
                <span className="sp-menu-num mono-xs">{link.index}</span>
                <span className="text-xl">{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sp-menu-foot">
        <Button variant="secondary" href={githubHref} icon="github" external>
          {strings.buttons.github}
        </Button>
        <Button
          variant="secondary"
          href={linkedinHref}
          icon="linkedin"
          external
        >
          {strings.buttons.linkedin}
        </Button>
      </div>
    </div>
  );
}
