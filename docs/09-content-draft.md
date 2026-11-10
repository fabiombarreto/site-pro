# 09 · Content draft

> **Status:** ✅ approved · 2026-11-03 · a placeholder stands in for the photo until it arrives (2026-11-04)
> **Source:** the owner's career-ops profile (`cv.md`, `config/profile.yml`, `modes/_profile.md`, `voice-dna.md`), the owner's answers in review, and the public GitHub repositories of `fabiombarreto`.
> Structure follows [05 · Content](05-content.md).

## What the site is for

A short invitation, not a résumé: who Fabio is in a few lines, his personal projects, and where to find him (GitHub and LinkedIn). Work history and past clients live in the CV and on LinkedIn, so the site does not repeat them.

## Writing rules for site content

Site copy follows the owner's voice guide (`voice-dna.md` in career-ops):

- First person, short sentences, contractions, numbers as digits.
- **No em dashes** in content. Use commas, colons, periods or parentheses.
- None of the banned AI vocabulary (leverage, seamless, robust, scalable, innovative, and the rest of the list).
- No "this isn't X, it's Y" constructions. Say what it is.
- Specific beats impressive. Only claim numbers that exist in `cv.md`.

The build layer keeps code conventions in its commands and logs (for example `hero.title("Fabio Barreto.")`). The page copy follows the rules above.

## Left out on purpose

These exist in career-ops and **must not** appear on the site or in this public repository: phone number, email address, compensation targets, the city, relocation and visa policy, application and interview data, recruiter notes. Past employers and client projects are also left out: they are in the CV and on LinkedIn.

---

## Sections

Hero, About, Projects, Stack and Contact, plus one page per project and the 404 (D4, confirmed on 2026-11-03). There is no separate "How this site was built" page in v1: the site-pro project page tells that story.

## Profile

| Field | Content | Notes |
|---|---|---|
| `name` | Fabio Martins Barreto | Page title and structured data |
| `headline` | Fabio Barreto. | The hero `<h1>`, typed during the build as `hero.title("Fabio Barreto.")` |
| Nav label | `fabiombarreto` | GitHub handle, on the left of the nav bar |
| `role` | Senior Software Engineer | From `cv.md` |
| `subtitle` | 12+ years shipping full-stack apps with React, Python and Java. Now building AI-assisted dev workflows. | The hero intro |
| `location` | Brazil (UTC-3) | Shown in Contact. Country and time zone only |
| `links` | GitHub `github.com/fabiombarreto` · LinkedIn `linkedin.com/in/fabio-martins-barreto` | In the hero, About and Contact |
| `photo` | **Placeholder for now** | `photo-placeholder-body.svg` in the [Design System](https://claude.ai/artifact/CvbHWjN6GHJoYxCTCmk91o) (Placeholders): a neutral full-body silhouette, cut out on a transparent background, 900 × 1600. It has the real photo's framing, so the screens, the prototype and the ASCII effect are built and tuned with it. The owner will send the real photo before launch: full body, standing, 9:16, at least 1200 × 2133 px, cut out or on a plain background, with good contrast (D20). Swapping it changes no layout. The earlier square placeholder (`photo-placeholder.svg`) stays in the Design System for square uses |
| `email` | none | Contact happens through GitHub and LinkedIn |
| `availability` | none | — |

## About

54 words, followed by GitHub and LinkedIn buttons. There is no "at a glance" facts box.

> I'm a full-stack software engineer, and I've been studying programming and software development since 2008.
>
> Right now I'm building my own projects and exploring what AI can do in real applications, while I work on a postgraduate program in Software Engineering with AI.
>
> Take a look at my projects below, or find me on GitHub and LinkedIn.

## Projects

Only personal projects. Four cards in a **2 × 2 grid** (one column on mobile); each opens a detail page (D5).

| # | Project | Summary (≤ 140 characters) | Tags | Year | Status | Links | Notes |
|---|---|---|---|---|---|---|---|
| 1 | **relay** | A Claude Code plugin that takes a feature from PRD to pull request, with a writer and a reviewer agent at every stage. | `claude-code` `ai-agents` `node` | 2026 | active | [repo](https://github.com/fabiombarreto/PRPs-agentic-eng) | The repo is a fork of Wirasm/prp; relay is the plugin Fabio built inside it. Say so on the card or the detail page. No user or star counts exist: cite none |
| 2 | **AI Track Record** | A local-first benchmark for AI coding agents: same task, different models and prompts, graded by tests the agent never sees. | `python` `ai-agents` `benchmarks` | 2026 | planning | [repo](https://github.com/fabiombarreto/ai-track-record) | First public results planned for December 2026 |
| 3 | **Praesto Sum** | A personal assistant for one user: tasks and Google Calendar in one installable app, on Cloudflare Workers and React 19. | `typescript` `react` `cloudflare-workers` | 2026 | in development | [repo](https://github.com/fabiombarreto/praesto-sum) | — |
| 4 | **site-pro** | This site: a portfolio that builds itself live, one typed command at a time. | `astro` `react` `typescript` | 2026 | in development | [repo](https://github.com/fabiombarreto/site-pro) | Meta project. Its page tells how the site was built |

### Detail page material

- **relay:** the workflow (interactive PRD, then plan, plan review, implementation, code review and a test run with a budgeted auto-correction loop; changes wait in an isolated worktree), the validation suite, and the optimization story: an audit of 270 review runs found that failure feedback was computed but never used, so retries started from scratch. No before/after improvement number is documented, so claim none.
- **AI Track Record:** the question it answers (which AI coding workflows actually work), the method (the same task across models and prompt versions, graded by hidden tests, measuring cost, time and quality) and the plan for the first public results.
- **Praesto Sum:** why one user, why Cloudflare Workers, and installing it as an app.
- **site-pro:** how the site builds itself: the build runtime, build windows, the design system, the stack and the decisions in these docs, with a link to the repository.

## Project pages (draft, awaiting approval)

> **Status:** draft · 2026-11-10 · written from the detail page material above and the writing rules, for the owner's approval (Stage 4 PRD). Once approved, each block is copied as is into the body of `src/content/projects/<slug>.md`, and the page title, summary, tags and links stay in the front matter.
> **Needs the owner:** lines in `[brackets]` hold facts the material does not give; the "What I learned" line for relay and the opening line for AI Track Record put words in the owner's mouth and need a yes or a rewrite. No number appears beyond those in the material (270 review runs, December 2026, React 19).

### relay

```markdown
The repository is a fork of Wirasm/prp. relay is the plugin I built inside it.

## The problem

Getting an AI agent from an idea to a pull request takes more than one prompt. It needs a spec to work from, a plan someone checked, and a clear signal that the work is done.

## How it works

relay is a Claude Code plugin that takes a feature through the same stages every time:

1. An interactive PRD, written with me in a short Q&A.
2. A plan, then a plan review.
3. The implementation, then a code review.
4. A test run with an auto-correction loop that has a budget.

Every stage has a writer agent and a reviewer agent, and nothing moves on until the reviewer approves. Changes wait in an isolated worktree until I merge them. A validation suite checks the plugin itself.

This site is built with relay, one stage at a time.

## What I learned

I audited 270 review runs. The failure feedback was computed on every run but never used, so each retry started from scratch. Now I check that the next step actually reads what the last one produced.
```

### AI Track Record

```markdown
## The question

Which AI coding workflows actually work? I want an answer I can measure and rerun.

## The method

AI Track Record is a local-first benchmark. It gives the same task to different models and prompt versions, and tests the agent never sees grade the result. Every run records its cost, time and quality.

## Status

It's in planning. I plan to publish the first results in December 2026.
```

### Praesto Sum

```markdown
## What it is

Praesto Sum is a personal assistant for one user. It puts tasks and Google Calendar in one app you install.

## Why one user

[Owner to write: why it's built for one user.]

## Why Cloudflare Workers

[Owner to write: why it runs on Cloudflare Workers.]

## Installing it

[Owner to write: how it installs as an app, and on which devices.]

It's built with TypeScript and React 19, runs on Cloudflare Workers and is still in development.
```

### site-pro

```markdown
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
```

## Stack

A grouped list of technologies, without a frequency meter.

| Group | Technologies |
|---|---|
| languages | java, python, typescript, sql |
| frontend | react, angular |
| backend | spring-boot, django, graphql, node, fastapi |
| data | postgresql, redis, rabbitmq |
| cloud | aws, ci-cd |
| ai | claude-code |

## Contact

| Item | Content |
|---|---|
| Heading | Let's talk. |
| Lead | Questions, ideas or a project in mind? Find me here. |
| Links | GitHub `github.com/fabiombarreto` · LinkedIn `linkedin.com/in/fabio-martins-barreto` |
| Location | Brazil (UTC-3) |
| Email | none |

## Pending

1. **Photo:** the owner will send a full-body photo before launch. The full-body placeholder is used until then.
2. **Project covers:** one per project. They carry the page's continuity from Projects on (D20); the dot-grid placeholders are used until then.
