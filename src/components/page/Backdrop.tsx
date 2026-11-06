import './Backdrop.css';

export interface Glow {
  x: string;
  y: string;
  size: number;
  tone: 1 | 2;
}

export const DEFAULT_GLOWS: readonly Glow[] = [
  { x: '18%', y: '6%', size: 900, tone: 1 },
  { x: '82%', y: '21%', size: 820, tone: 2 },
  { x: '12%', y: '37%', size: 760, tone: 1 },
  { x: '88%', y: '64%', size: 860, tone: 2 },
  { x: '28%', y: '84%', size: 900, tone: 1 },
];

interface BackdropProps {
  glows?: readonly Glow[];
  grain?: boolean;
  className?: string;
}

export function Backdrop({
  glows = [],
  grain = true,
  className,
}: BackdropProps): React.JSX.Element {
  const classes = ['sp-backdrop', grain ? 'has-grain' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} aria-hidden="true">
      {glows.map((glow, index) => (
        <span
          key={index}
          className={glow.tone === 2 ? 'sp-glow is-2' : 'sp-glow'}
          style={
            {
              left: glow.x,
              top: glow.y,
              '--glow-size': glow.size,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
