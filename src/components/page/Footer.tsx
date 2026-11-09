import './Footer.css';
import { TextLink } from './TextLink';
import { cx } from './cx';
import { strings } from '../../strings';

interface FooterProps {
  sourceHref: string;
  owner: string;
  buildSlot?: boolean;
  className?: string;
}

export function Footer({
  sourceHref,
  owner,
  buildSlot = false,
  className,
}: FooterProps): React.JSX.Element {
  return (
    <footer className={cx('sp-footer', 'text-sm', className)}>
      <div className="sp-footer-inner">
        <p className="sp-footer-meta">
          <TextLink href={sourceHref} external>
            {strings.footer.source}
          </TextLink>
          <span>{`© ${strings.footer.year} ${owner}`}</span>
        </p>
        {buildSlot && (
          <p className="sp-footer-build text-sm" data-footer-build="" />
        )}
      </div>
    </footer>
  );
}
