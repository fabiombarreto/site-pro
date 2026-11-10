import './Photo.css';
import { cx } from './cx';
import type { ImageSource } from './image-source';

interface PhotoProps {
  image: ImageSource;
  priority?: boolean;
  alt?: string;
  height?: number;
  glow?: boolean;
  className?: string;
}

export function Photo({
  image,
  priority = false,
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
  const img = (
    <img
      className="sp-photo-img"
      src={image.src}
      alt={alt}
      width={image.width}
      height={image.height}
      loading={priority ? 'eager' : 'lazy'}
      {...(priority ? { fetchpriority: 'high' } : {})}
    />
  );
  return (
    <div className={classes} style={style}>
      {image.sources && image.sources.length > 0 ? (
        <picture>
          {image.sources.map((source) => (
            <source
              key={source.type}
              type={source.type}
              srcSet={source.srcset}
              sizes={image.sizes}
            />
          ))}
          {img}
        </picture>
      ) : (
        img
      )}
    </div>
  );
}
