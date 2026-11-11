---
title: site-pro
summary: 'This site: a portfolio that builds itself live, one typed command at a time.'
tags:
  - astro
  - react
  - typescript
links:
  repo: https://github.com/fabiombarreto/site-pro
year: '2026'
featured: true
order: 4
status: in development
---

## The idea

This site builds itself while you watch. A typed command opens a build window, the window creates the section one element at a time, then steps aside and leaves a normal, readable page.

## How it works

- Astro renders the whole page to HTML at build time, with React components rendered to static HTML. Without JavaScript you get the finished page.
- A small runtime in plain TypeScript plays the build. Each section has a build script, compiled at build time into a timeline, and one animation loop plays it.
- The build happens on a layer above the page, so the page never moves. Screen readers skip that layer, and reduced motion turns it off.
- You're always in control: Esc skips a section, and the dock at the bottom has Skip, speed and Replay.

## How I built it

I designed it in Claude Design and wrote every decision down before any code. Each stage then went through relay, my Claude Code plugin, from PRD to pull request, with tests for every behavior rule.

The code is on GitHub under the MIT license.
