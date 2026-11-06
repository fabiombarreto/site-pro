import './ProjectCard.css';

interface CoverPlaceholderProps {
  label: string;
}

export function CoverPlaceholder({
  label,
}: CoverPlaceholderProps): React.JSX.Element {
  return (
    <div className="sp-cover-ph" aria-hidden="true">
      <span className="mono-sm">{label}</span>
    </div>
  );
}
