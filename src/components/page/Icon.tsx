export type IconName =
  | 'sun'
  | 'moon'
  | 'arrowUpRight'
  | 'arrowLeft'
  | 'arrowDown'
  | 'menu'
  | 'x'
  | 'github'
  | 'linkedin';

type StrokeIconName = Exclude<IconName, 'github' | 'linkedin'>;
type BrandIconName = 'github' | 'linkedin';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

const LUCIDE: Record<StrokeIconName, React.JSX.Element[]> = {
  sun: [
    <circle key="0" cx="12" cy="12" r="4" />,
    <path key="1" d="M12 2v2" />,
    <path key="2" d="M12 20v2" />,
    <path key="3" d="m4.93 4.93 1.41 1.41" />,
    <path key="4" d="m17.66 17.66 1.41 1.41" />,
    <path key="5" d="M2 12h2" />,
    <path key="6" d="M20 12h2" />,
    <path key="7" d="m6.34 17.66-1.41 1.41" />,
    <path key="8" d="m19.07 4.93-1.41 1.41" />,
  ],
  moon: [
    <path
      key="0"
      d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"
    />,
  ],
  arrowUpRight: [
    <path key="0" d="M7 7h10v10" />,
    <path key="1" d="M7 17 17 7" />,
  ],
  arrowLeft: [
    <path key="0" d="m12 19-7-7 7-7" />,
    <path key="1" d="M19 12H5" />,
  ],
  arrowDown: [
    <path key="0" d="M12 5v14" />,
    <path key="1" d="m19 12-7 7-7-7" />,
  ],
  menu: [
    <path key="0" d="M4 5h16" />,
    <path key="1" d="M4 12h16" />,
    <path key="2" d="M4 19h16" />,
  ],
  x: [<path key="0" d="M18 6 6 18" />, <path key="1" d="m6 6 12 12" />],
};

// Simple Icons single-path glyphs, filled in currentColor. Only for the GitHub and LinkedIn links.
const BRAND: Record<BrandIconName, string> = {
  github:
    'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
};

function isBrand(name: IconName): name is BrandIconName {
  return name === 'github' || name === 'linkedin';
}

export function Icon({
  name,
  size = 16,
  className,
}: IconProps): React.JSX.Element {
  if (isBrand(name)) {
    return (
      <svg
        className={className ? `sp-icon ${className}` : 'sp-icon'}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        fill="currentColor"
      >
        <path d={BRAND[name]} />
      </svg>
    );
  }
  if (isBrand(name)) {
    return (
      <svg
        className={className ? `sp-icon ${className}` : 'sp-icon'}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        fill="currentColor"
      >
        <path d={BRAND[name]} />
      </svg>
    );
  }
  return (
    <svg
      className={className ? `sp-icon ${className}` : 'sp-icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {LUCIDE[name]}
    </svg>
  );
}
