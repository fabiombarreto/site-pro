import './Footer.css';
import { TextLink } from './TextLink';
import { cx } from './cx';
import { strings } from '../../strings';

interface FooterProps {
  sourceHref: string;
  owner: string;
  className?: string;
}

export function Footer({
  sourceHref,
  owner,
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
      </div>
    </footer>
  );
}
