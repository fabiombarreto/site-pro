// PRPs/prds/stage-2-foundation.prd.md AC-6 mobile menu without JavaScript
// (phase 4 plan: AC-A3), AC-3 real links and buttons (AC-A4), AC-8 privacy and
// no palette button (AC-A8)
// Static-render contracts of NavBar and MobileMenu.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  MOBILE_MENU_ID,
  MobileMenu,
} from '../../src/components/page/MobileMenu';
import { NavBar } from '../../src/components/page/NavBar';

const github = 'https://github.com/fabiombarreto';
const linkedin = 'https://www.linkedin.com/in/fabio-martins-barreto';
const props = { githubHref: github, linkedinHref: linkedin };

const renderNav = (extra: { active?: string } = {}): string =>
  renderToStaticMarkup(createElement(NavBar, { ...props, ...extra }));
const renderMenu = (extra: { active?: string } = {}): string =>
  renderToStaticMarkup(createElement(MobileMenu, { ...props, ...extra }));

describe('MobileMenu', () => {
  it('is a static auto popover with the id the toggle points at', () => {
    expect(MOBILE_MENU_ID).toBe('mobile-menu');
    const html = renderMenu();
    expect(html).toMatch(
      /^<div id="mobile-menu" popover="auto" class="sp-menu"/,
    );
  });

  it('wraps the four numbered section links in a named nav list', () => {
    const html = renderMenu();
    expect(html).toContain('<nav aria-label="Sections"><ul>');
    const items = html.match(/<li>.*?<\/li>/g) ?? [];
    expect(items).toEqual([
      '<li><a class="sp-menu-link" href="#about"><span class="sp-menu-num mono-xs">01</span><span class="text-xl">About</span></a></li>',
      '<li><a class="sp-menu-link" href="#projects"><span class="sp-menu-num mono-xs">02</span><span class="text-xl">Projects</span></a></li>',
      '<li><a class="sp-menu-link" href="#stack"><span class="sp-menu-num mono-xs">03</span><span class="text-xl">Stack</span></a></li>',
      '<li><a class="sp-menu-link" href="#contact"><span class="sp-menu-num mono-xs">04</span><span class="text-xl">Contact</span></a></li>',
    ]);
  });

  it('offers GitHub and LinkedIn as external secondary buttons', () => {
    const html = renderMenu();
    const foot = html.slice(html.indexOf('sp-menu-foot'));
    const anchors = foot.match(/<a [^>]*>/g) ?? [];
    expect(anchors).toHaveLength(2);
    expect(anchors[0]).toContain(`href="${github}"`);
    expect(anchors[1]).toContain(`href="${linkedin}"`);
    for (const anchor of anchors) {
      expect(anchor).toContain('sp-btn-secondary');
      expect(anchor).toContain('target="_blank"');
      expect(anchor).toContain('rel="noopener noreferrer"');
    }
    expect(foot).toContain('<span>GitHub</span>');
    expect(foot).toContain('<span>LinkedIn</span>');
  });

  it('marks only the active section with aria-current', () => {
    const html = renderMenu({ active: 'stack' });
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
    expect(html).toMatch(
      /<a class="sp-menu-link is-active" href="#stack" aria-current="true">/,
    );
    expect(renderMenu()).not.toContain('aria-current');
  });
});

describe('NavBar', () => {
  it('is a header with the brand linking to the top of the page', () => {
    const html = renderNav();
    expect(html).toMatch(/^<header class="sp-nav">/);
    expect(html).toContain(
      '<a class="sp-nav-name" href="#top">fabiombarreto</a>',
    );
  });

  it('names the inline section nav Main and links the four sections', () => {
    const html = renderNav();
    expect(html).toContain(
      '<nav class="sp-nav-links text-sm" aria-label="Main">',
    );
    const inline = html.slice(
      html.indexOf('sp-nav-links'),
      html.indexOf('sp-nav-actions'),
    );
    expect(inline.match(/<a [^>]*>[^<]*<\/a>/g)).toEqual([
      '<a class="sp-nav-link" href="#about">About</a>',
      '<a class="sp-nav-link" href="#projects">Projects</a>',
      '<a class="sp-nav-link" href="#stack">Stack</a>',
      '<a class="sp-nav-link" href="#contact">Contact</a>',
    ]);
  });

  it('marks the active link with is-active and aria-current', () => {
    const html = renderNav({ active: 'projects' });
    expect(html).toContain(
      '<a class="sp-nav-link is-active" href="#projects" aria-current="true">Projects</a>',
    );
  });

  it('opens the menu with a real button wired by lowercase popovertarget', () => {
    const html = renderNav();
    const toggle = html.match(/<button[^>]*sp-menu-toggle[^>]*>/);
    expect(toggle).not.toBeNull();
    expect(toggle![0]).toContain('type="button"');
    expect(toggle![0]).toContain('popovertarget="mobile-menu"');
    expect(toggle![0]).toContain('aria-label="Open the menu"');
    expect(html).toContain('id="mobile-menu"');
    expect(html).toContain('popover="auto"');
  });

  it('carries the theme toggle and a named GitHub icon link', () => {
    const html = renderNav();
    expect(html).toContain('data-theme-toggle');
    expect(html).toContain(
      `<a class="sp-icon-btn" href="${github}" aria-label="GitHub" title="GitHub">`,
    );
  });

  it('has no command palette button, handlers, replay or contact form', () => {
    const html = renderNav();
    expect(html).not.toContain('⌘');
    expect(html).not.toMatch(/palette|kbd|Replay/i);
    expect(html).not.toMatch(/\bon[a-z]+=/);
    expect(html).not.toMatch(/mailto:|\btel:|<form|@[a-z0-9-]+\.[a-z]{2,}/i);
  });

  it('keeps every decorative icon out of the accessibility tree', () => {
    const icons = renderNav().match(/<svg[^>]*>/g) ?? [];
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) expect(icon).toContain('aria-hidden="true"');
  });
});
