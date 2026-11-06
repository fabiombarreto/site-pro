// PRPs/prds/stage-2-foundation.prd.md AC-2 nav links reach the home sections from other pages
// (phase 6 plan: AC-A7), AC-14 project pages and 404 use the shared nav
// Static-render contract of the optional homeHref prop on NavBar and MobileMenu:
// the default keeps same-page hashes, "/" turns them into links to the home sections.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MobileMenu } from '../../src/components/page/MobileMenu';
import { NavBar } from '../../src/components/page/NavBar';

const props = {
  githubHref: 'https://github.com/fabiombarreto',
  linkedinHref: 'https://www.linkedin.com/in/fabio-martins-barreto',
};

const hrefsOf = (html: string, selector: RegExp): string[] =>
  [...html.matchAll(selector)].map((m) => m[1] ?? '');

const SECTION_LINK = /<a class="sp-nav-link[^"]*" href="([^"]*)"/g;
const MENU_LINK = /<a class="sp-menu-link[^"]*" href="([^"]*)"/g;
const BRAND_LINK = /<a class="sp-nav-name" href="([^"]*)"/g;

describe('NavBar homeHref', () => {
  it('prefixes the brand and the four section links with "/" when set', () => {
    const html = renderToStaticMarkup(
      createElement(NavBar, { ...props, homeHref: '/' }),
    );
    expect(hrefsOf(html, BRAND_LINK)).toEqual(['/#top']);
    expect(hrefsOf(html, SECTION_LINK)).toEqual([
      '/#about',
      '/#projects',
      '/#stack',
      '/#contact',
    ]);
  });

  it('forwards the prefix to the mobile menu links it contains', () => {
    const html = renderToStaticMarkup(
      createElement(NavBar, { ...props, homeHref: '/' }),
    );
    expect(hrefsOf(html, MENU_LINK)).toEqual([
      '/#about',
      '/#projects',
      '/#stack',
      '/#contact',
    ]);
  });

  it('keeps bare same-page hashes by default', () => {
    const html = renderToStaticMarkup(createElement(NavBar, props));
    expect(hrefsOf(html, BRAND_LINK)).toEqual(['#top']);
    expect(hrefsOf(html, SECTION_LINK)).toEqual([
      '#about',
      '#projects',
      '#stack',
      '#contact',
    ]);
    expect(hrefsOf(html, MENU_LINK)).toEqual([
      '#about',
      '#projects',
      '#stack',
      '#contact',
    ]);
  });

  it('renders identical markup for the default and an explicit empty prefix', () => {
    expect(
      renderToStaticMarkup(createElement(NavBar, { ...props, homeHref: '' })),
    ).toBe(renderToStaticMarkup(createElement(NavBar, props)));
  });

  it('keeps the external profile links untouched by the prefix', () => {
    const html = renderToStaticMarkup(
      createElement(NavBar, { ...props, homeHref: '/' }),
    );
    expect(html).toContain(`href="${props.githubHref}"`);
    expect(html).toContain(`href="${props.linkedinHref}"`);
    expect(html).not.toContain(`/${props.githubHref}`);
  });
});

describe('MobileMenu homeHref', () => {
  it('prefixes the four numbered links with "/" when set', () => {
    const html = renderToStaticMarkup(
      createElement(MobileMenu, { ...props, homeHref: '/' }),
    );
    expect(hrefsOf(html, MENU_LINK)).toEqual([
      '/#about',
      '/#projects',
      '/#stack',
      '/#contact',
    ]);
  });

  it('keeps bare same-page hashes by default', () => {
    const html = renderToStaticMarkup(createElement(MobileMenu, props));
    expect(hrefsOf(html, MENU_LINK)).toEqual([
      '#about',
      '#projects',
      '#stack',
      '#contact',
    ]);
  });
});
