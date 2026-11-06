import './ProjectCard.css';
import { CoverPlaceholder } from './CoverPlaceholder';
import { StatusBadge } from './StatusBadge';
import type { ProjectStatus } from './StatusBadge';
import { Tag } from './Tag';
import { TextLink } from './TextLink';
import { cx } from './cx';
import { strings } from '../../strings';

interface ProjectCardProps {
  title: string;
  slug: string;
  year: string;
  summary: string;
  tags: readonly string[];
  status: ProjectStatus;
  repo?: string;
  cover?: string;
  className?: string;
}

export function ProjectCard({
  title,
  slug,
  year,
  summary,
  tags,
  status,
  repo,
  cover,
  className,
}: ProjectCardProps): React.JSX.Element {
  return (
    <article className={cx('sp-card', 'is-link', className)}>
      <div className="sp-card-cover">
        {cover ? <img src={cover} alt="" /> : <CoverPlaceholder label={slug} />}
      </div>
      <div className="sp-card-body">
        <div className="sp-card-head">
          <h3 className="sp-card-title text-xl">
            <a className="sp-card-link" href={`/projects/${slug}`}>
              {title}
            </a>
          </h3>
          <span className="sp-card-year mono-xs">{year}</span>
        </div>
        <p className="sp-card-summary text-md">{summary}</p>
        <div className="sp-card-tags">
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
        <div className="sp-card-foot">
          <StatusBadge status={status} />
          {repo && (
            <TextLink className="sp-card-repo text-sm" href={repo} external>
              {strings.projects.repoShortcut}
            </TextLink>
          )}
        </div>
      </div>
    </article>
  );
}
