import './Labels.css';
import { StackChip } from './StackChip';
import { cx } from './cx';

interface StackGroupProps {
  name: string;
  items: readonly string[];
  className?: string;
}

export function StackGroup({
  name,
  items,
  className,
}: StackGroupProps): React.JSX.Element {
  return (
    <div className={cx('sp-stack', className)}>
      <h3 className="sp-stack-name mono-xs">{name}</h3>
      <ul className="sp-stack-list">
        {items.map((item) => (
          <li key={item}>
            <StackChip>{item}</StackChip>
          </li>
        ))}
      </ul>
    </div>
  );
}
