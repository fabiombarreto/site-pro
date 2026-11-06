import './Labels.css';
import { cx } from './cx';

interface TagProps {
  children: React.ReactNode;
  className?: string;
}

export function Tag({ children, className }: TagProps): React.JSX.Element {
  return <span className={cx('sp-tag', 'mono-xs', className)}>{children}</span>;
}
