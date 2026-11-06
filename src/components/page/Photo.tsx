import './Photo.css';
import { cx } from './cx';

interface PhotoProps {
  src: string;
  alt?: string;
  height?: number;
  glow?: boolean;
  className?: string;
}

export function Photo({
  src,
  alt = '',
  height,
  glow = false,
  className,
}: PhotoProps): React.JSX.Element {
  const classes = cx(
    'sp-photo',
    'is-cutout',
    'is-built',
    glow && 'has-glow',
    className,
  );
  const style =
    height === undefined
      ? undefined
      : ({ '--photo-h': `${height}px` } as React.CSSProperties);
  return (
    <div className={classes} style={style}>
      <img
        className="sp-photo-img"
        src={src}
        alt={alt}
        width={900}
        height={1600}
      />
    </div>
  );
}
