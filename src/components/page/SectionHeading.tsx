import './SectionHeading.css';
import { cx } from './cx';

interface SectionHeadingProps {
  title: string;
  id?: string;
  eyebrow?: { index: string; name: string };
  lead?: string;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

export function SectionHeading({
  title,
  id,
  eyebrow,
  lead,
  as: Heading = 'h2',
  className,
}: SectionHeadingProps): React.JSX.Element {
  return (
    <div className={cx('sp-heading', className)}>
      {eyebrow && (
        <p className="sp-eyebrow mono-xs">
          <span className="sp-eyebrow-num">{eyebrow.index}</span>
          {' / '}
          {eyebrow.name}
        </p>
      )}
      <Heading className="sp-heading-title text-3xl" id={id}>
        {title}
      </Heading>
      {lead && <p className="sp-heading-lead text-lg">{lead}</p>}
    </div>
  );
}
