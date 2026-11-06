import './Prose.css';
import { cx } from './cx';

interface ProseProps {
  children: React.ReactNode;
  className?: string;
}

export function Prose({ children, className }: ProseProps): React.JSX.Element {
  return <div className={cx('sp-prose', 'text-md', className)}>{children}</div>;
}
