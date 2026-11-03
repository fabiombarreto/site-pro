# 09 · Content draft

> **Status:** ✅ approved · 2026-11-03 · only the photo is pending
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
| `photo` | **Pending** | The owner will send one: square, at least 800 px, plain background and good contrast (it makes the ASCII version read well). A placeholder until then |
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

1. **Photo:** the owner will send one.
