import './Labels.css';
import { cx } from './cx';

interface StackChipProps {
  children: React.ReactNode;
  className?: string;
}

export function StackChip({
  children,
  className,
}: StackChipProps): React.JSX.Element {
  return (
    <span className={cx('sp-chip', 'mono-sm', className)}>{children}</span>
  );
}
