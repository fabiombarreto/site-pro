import './Labels.css';
import type { Project } from '../../content-schemas';
import { cx } from './cx';

export type ProjectStatus = Project['status'];

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function StatusBadge({
  status,
  className,
}: StatusBadgeProps): React.JSX.Element {
  const key = status.replace(' ', '-');
  return (
    <span className={cx('sp-status', `sp-status-${key}`, 'mono-xs', className)}>
      <i className="sp-status-dot" aria-hidden="true" />
      {status}
    </span>
  );
}
