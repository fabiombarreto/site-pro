// PRPs/prds/stage-2-foundation.prd.md AC-1 / AC-14 page components render to
// semantic HTML (phase 4 plan: AC-A2), AC-3 real links and buttons (AC-A4),
// AC-12 decorative icons (AC-A10)
// Static-render contracts of the small page components: actions, labels,
// headings, prose and icons.
import { createElement } from 'react';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PROJECT_STATUSES } from '../../src/content-schemas';
import { Button } from '../../src/components/page/Button';
import { Icon } from '../../src/components/page/Icon';
import type { IconName } from '../../src/components/page/Icon';
import { IconLink } from '../../src/components/page/IconLink';
import { Prose } from '../../src/components/page/Prose';
import { SectionHeading } from '../../src/components/page/SectionHeading';
import { StackGroup } from '../../src/components/page/StackGroup';
import { StatusBadge } from '../../src/components/page/StatusBadge';
import { Tag } from '../../src/components/page/Tag';
import { TextLink } from '../../src/components/page/TextLink';
import { cx } from '../../src/components/page/cx';

const button = (props: ComponentProps<typeof Button>): string =>
  renderToStaticMarkup(createElement(Button, props));

describe('cx', () => {
  it('joins truthy names with a space and drops falsy ones', () => {
    expect(cx('a', false, 'b', null, undefined, 'c')).toBe('a b c');
    expect(cx(false, undefined)).toBe('');
  });
});

describe('Icon', () => {
  const names: IconName[] = [
    'sun',
    'moon',
    'arrowUpRight',
    'arrowLeft',
    'menu',
    'x',
    'github',
    'linkedin',
  ];

  it.each(names)('renders %s as a decorative 24-unit svg', (name) => {
    const html = renderToStaticMarkup(createElement(Icon, { name }));
    expect(html).toMatch(/^<svg\b/);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('width="16"');
    expect(html).toContain('height="16"');
    expect(html).toContain('class="sp-icon"');
  });

  it('draws line glyphs as strokes and brand glyphs as fills', () => {
    const line = renderToStaticMarkup(
      createElement(Icon, { name: 'arrowLeft' }),
    );
    expect(line).toContain('stroke="currentColor"');
    expect(line).toContain('fill="none"');
    for (const name of ['github', 'linkedin'] as const) {
      const brand = renderToStaticMarkup(createElement(Icon, { name }));
      expect(brand).toContain('fill="currentColor"');
      expect(brand).not.toContain('stroke');
    }
  });

  it('honors size and an extra class', () => {
    const html = renderToStaticMarkup(
      createElement(Icon, { name: 'menu', size: 20, className: 'extra' }),
    );
    expect(html).toContain('class="sp-icon extra"');
    expect(html).toContain('width="20"');
    expect(html).toContain('height="20"');
  });
});

describe('Button', () => {
  it('renders an anchor with the variant and text classes when given an href', () => {
    const html = button({
      href: '/work',
      variant: 'secondary',
      children: 'See my work',
    });
    expect(html).toMatch(
      /^<a class="sp-btn sp-btn-secondary text-sm" href="\/work">/,
    );
    expect(html).toContain('<span>See my work</span>');
    expect(html).not.toContain('target=');
  });

  it('defaults to the primary variant', () => {
    expect(button({ href: '/x', children: 'Go' })).toContain(
      'class="sp-btn sp-btn-primary text-sm"',
    );
  });

  it('opens external links safely in a new tab with a trailing arrow', () => {
    const html = button({
      href: 'https://github.com/fabiombarreto',
      external: true,
      icon: 'github',
      children: 'GitHub',
    });
    expect(html).toContain('href="https://github.com/fabiombarreto"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html.match(/<svg/g)).toHaveLength(2);
    expect(html).toContain('class="sp-icon sp-btn-end"');
  });

  it('renders a real button of type button without an href', () => {
    const html = button({ children: 'Do it' });
    expect(html).toMatch(/^<button type="button" class="sp-btn /);
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('disabled');
  });

  it('falls back to a disabled button when disabled, even with an href', () => {
    const html = button({ href: '/x', disabled: true, children: 'Nope' });
    expect(html).toMatch(/^<button\b/);
    expect(html).toContain('disabled=""');
    expect(html).not.toContain('href=');
  });

  it('places an explicit end icon without needing external', () => {
    const html = button({
      href: '/x',
      iconEnd: 'arrowLeft',
      children: 'Back',
    });
    expect(html.match(/<svg/g)).toHaveLength(1);
    expect(html).toContain('sp-btn-end');
  });
});

describe('TextLink', () => {
  it('renders a plain anchor with no icon for internal links', () => {
    const html = renderToStaticMarkup(
      createElement(TextLink, { href: '/about', children: 'About' }),
    );
    expect(html).toBe('<a class="sp-link" href="/about">About</a>');
  });

  it('marks external links with a new tab, safe rel and an arrow', () => {
    const html = renderToStaticMarkup(
      createElement(TextLink, {
        href: 'https://example.org',
        external: true,
        className: 'extra',
        children: 'Source',
      }),
    );
    expect(html).toContain('class="sp-link extra"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('class="sp-icon sp-link-ext"');
    expect(html).toContain('width="14"');
  });
});

describe('IconLink', () => {
  it('is a link named by its label with a decorative icon', () => {
    const html = renderToStaticMarkup(
      createElement(IconLink, {
        href: 'https://github.com/fabiombarreto',
        icon: 'github',
        label: 'GitHub',
      }),
    );
    expect(html).toMatch(
      /^<a class="sp-icon-btn" href="https:\/\/github\.com\/fabiombarreto"/,
    );
    expect(html).toContain('aria-label="GitHub"');
    expect(html).toContain('title="GitHub"');
    expect(html.match(/<svg[^>]*>/g)).toHaveLength(1);
    expect(html).toContain('width="18"');
    expect(html).toContain('aria-hidden="true"');
  });
});

describe('Tag, StatusBadge and StackGroup', () => {
  it('renders a Tag as a mono span', () => {
    expect(
      renderToStaticMarkup(createElement(Tag, { children: 'astro' })),
    ).toBe('<span class="sp-tag mono-xs">astro</span>');
  });

  it.each(PROJECT_STATUSES)(
    'shows the status word "%s" with a decorative dot',
    (status) => {
      const key = status.replace(' ', '-');
      const html = renderToStaticMarkup(createElement(StatusBadge, { status }));
      expect(html).toBe(
        `<span class="sp-status sp-status-${key} mono-xs"><i class="sp-status-dot" aria-hidden="true"></i>${status}</span>`,
      );
    },
  );

  it('renders a stack group as a heading and a list of chips in order', () => {
    const html = renderToStaticMarkup(
      createElement(StackGroup, {
        name: 'frontend',
        items: ['react', 'angular'],
      }),
    );
    expect(html).toBe(
      '<div class="sp-stack"><h3 class="sp-stack-name mono-xs">frontend</h3>' +
        '<ul class="sp-stack-list">' +
        '<li><span class="sp-chip mono-sm">react</span></li>' +
        '<li><span class="sp-chip mono-sm">angular</span></li>' +
        '</ul></div>',
    );
  });
});

describe('SectionHeading', () => {
  it('renders eyebrow, h2 title with id, and lead', () => {
    const html = renderToStaticMarkup(
      createElement(SectionHeading, {
        title: 'Selected work',
        id: 'projects-title',
        eyebrow: { index: '02', name: 'projects' },
        lead: 'Things I built and what I learned.',
      }),
    );
    expect(html).toContain(
      '<p class="sp-eyebrow mono-xs"><span class="sp-eyebrow-num">02</span> / projects</p>',
    );
    expect(html).toContain(
      '<h2 class="sp-heading-title text-3xl" id="projects-title">Selected work</h2>',
    );
    expect(html).toContain(
      '<p class="sp-heading-lead text-lg">Things I built and what I learned.</p>',
    );
  });

  it('omits the eyebrow and lead when not given', () => {
    const html = renderToStaticMarkup(
      createElement(SectionHeading, { title: 'About me' }),
    );
    expect(html).not.toContain('sp-eyebrow');
    expect(html).not.toContain('sp-heading-lead');
    expect(html).toContain('>About me</h2>');
  });

  it('renders the heading level chosen by as', () => {
    for (const level of ['h1', 'h3'] as const) {
      const html = renderToStaticMarkup(
        createElement(SectionHeading, { title: 'T', as: level }),
      );
      expect(html).toContain(
        `<${level} class="sp-heading-title text-3xl">T</${level}>`,
      );
      expect(html).not.toContain('<h2');
    }
  });
});

describe('Prose', () => {
  it('wraps its children in the prose container', () => {
    const html = renderToStaticMarkup(
      createElement(Prose, {
        className: 'extra',
        children: createElement('p', null, 'Hello'),
      }),
    );
    expect(html).toBe('<div class="sp-prose text-md extra"><p>Hello</p></div>');
  });
});
