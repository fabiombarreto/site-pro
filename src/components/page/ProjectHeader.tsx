import './ProjectHeader.css';
import { Button } from './Button';
import { CoverPlaceholder } from './CoverPlaceholder';
import { Icon } from './Icon';
import { StatusBadge } from './StatusBadge';
import type { ProjectStatus } from './StatusBadge';
import { Tag } from './Tag';
import { TextLink } from './TextLink';
import { strings } from '../../strings';
import type { ImageSource } from './image-source';

interface ProjectHeaderProps {
  title: string;
  slug: string;
  summary: string;
  year: string;
  status: ProjectStatus;
  tags: readonly string[];
  repo?: string;
  cover?: ImageSource;
  backHref?: string;
}

export function ProjectHeader({
  title,
  slug,
  summary,
  year,
  status,
  tags,
  repo,
  cover,
  backHref = '/#projects',
}: ProjectHeaderProps): React.JSX.Element {
  const coverImg = cover ? (
    <img
      src={cover.src}
      width={cover.width}
      height={cover.height}
      alt=""
      loading="lazy"
      decoding="async"
    />
  ) : null;
  return (
    <header className="sp-project-header">
      <TextLink className="sp-back text-sm" href={backHref}>
        <Icon name="arrowLeft" size={14} /> {strings.projects.backToProjects}
      </TextLink>
      <h1 className="sp-project-title text-3xl">{title}</h1>
      <p className="sp-project-summary text-lg">{summary}</p>
      <div className="sp-project-meta">
        <div className="sp-project-facts">
          <span className="sp-card-year mono-xs">{year}</span>
          <StatusBadge status={status} />
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
        {repo && (
          <Button variant="secondary" href={repo} icon="github" external>
            {strings.projects.repo}
          </Button>
        )}
      </div>
      <div className="sp-project-cover">
        {cover ? (
          cover.sources && cover.sources.length > 0 ? (
            <picture>
              {cover.sources.map((source) => (
                <source
                  key={source.type}
                  type={source.type}
                  srcSet={source.srcset}
                  sizes={cover.sizes}
                />
              ))}
              {coverImg}
            </picture>
          ) : (
            coverImg
          )
        ) : (
          <CoverPlaceholder label={slug} />
        )}
      </div>
    </header>
  );
}
