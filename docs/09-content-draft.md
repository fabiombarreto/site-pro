# 09 · Content draft

> **Status:** draft for review · 2026-11-02
> **Source:** the owner's career-ops profile (`cv.md`, `config/profile.yml`, `modes/_profile.md`, `interview-prep/story-bank.md`, `voice-dna.md`) and the public GitHub repositories of `fabiombarreto`.
> Structure follows [05 · Content](05-content.md). Items marked **TBD** need an answer from the owner.

## Writing rules for site content

Site copy follows the owner's voice guide (`voice-dna.md` in career-ops):

- First person, short sentences, contractions, numbers as digits.
- **No em dashes** in content. Use commas, colons, periods or parentheses.
- None of the banned AI vocabulary (leverage, seamless, robust, scalable, innovative, and the rest of the list).
- No "this isn't X, it's Y" constructions. Say what it is.
- Specific beats impressive. Only claim numbers that exist in `cv.md` or the story bank.

The build layer keeps code conventions in its commands and logs (for example `hero.title("Hi, I'm Fabio.")`). The page copy follows the rules above.

## Left out on purpose

These exist in career-ops and **must not** appear on the site or in this public repository: phone number, compensation targets, location and visa policy, application and interview data, recruiter notes.

---

## Profile

| Field | Draft | Notes |
|---|---|---|
| `name` | Fabio Martins Barreto | Page title and structured data |
| `headline` | Hi, I'm Fabio. | The hero `<h1>`, typed during the build. **TBD:** keep it, or something else? |
| Nav label | `fabiombarreto` | GitHub handle, on the left of the nav bar |
| `role` | Senior Software Engineer | From `cv.md` |
| `subtitle` | 12+ years shipping full-stack apps with React, Python and Java. Now building AI-assisted dev workflows. | The hero intro |
| `location` | Maringá, Brazil (UTC-3) | **TBD:** show the city, or only "Brazil"? |
| `links` | GitHub `github.com/fabiombarreto` · LinkedIn `linkedin.com/in/fabio-martins-barreto` | From `config/profile.yml` |
| `email` | **TBD** | A personal address in a public site and repository attracts spam. Use it, or a dedicated one? |
| `photo` | **TBD** | There is no photo in career-ops. Needs a square photo with a plain background |
| `availability` | **TBD** | Optional line such as "Open to remote work". The site targets the dev community, so it can also be left out |

## About

Draft, about 150 words:

> I've been writing software for 12+ years. I started as the first QA hire at a company building a retail ERP, then moved into full-stack work, system architecture and leading a small team.
>
> Since 2020 I've worked as a remote contractor. The biggest project so far is a literacy-tracking platform for the city of Manaus. Teachers in 322+ public schools use it every day to follow 70,000+ students. I led the team of 4 that built it and designed its architecture.
>
> I can't leave a repeated manual step alone. If I do something twice, I start looking for a way to automate it or get rid of it. That habit is how I ended up building relay, a Claude Code plugin that takes a feature from requirements to a pull request.
>
> These days I'm bringing AI-assisted development into the teams I work with, and I'm building a benchmark to find out which of these workflows actually work.

### At a glance (`facts`)

| Value | Label | Source |
|---|---|---|
| 12+ | years shipping code | `cv.md` |
| 2020 | remote contractor since | `cv.md` |
| 322+ | public schools on a platform I led | `cv.md`, story bank |
| Now | AI-assisted development | `cv.md` |

## Projects

Six cards fill two rows of the 3-column grid. Each opens a detail page (D5).

| # | Project | Summary (≤ 140 characters) | Tags | Year | Links | Notes |
|---|---|---|---|---|---|---|
| 1 | **relay** | A Claude Code plugin that takes a feature from PRD to pull request, with a writer and a reviewer agent at every stage. | `claude-code` `ai-agents` `node` | 2026 | [repo](https://github.com/fabiombarreto/PRPs-agentic-eng) | The repo is a fork of Wirasm/prp; relay is the plugin Fabio built inside it. Say so on the card or the detail page. No user or star counts exist: cite none |
| 2 | **AI Track Record** | A local-first benchmark for AI coding agents: same task, different models and prompts, graded by tests the agent never sees. | `python` `ai-agents` `benchmarks` | 2026 | [repo](https://github.com/fabiombarreto/ai-track-record) | Status: planning, first public results planned for December 2026 |
| 3 | **Praesto Sum** | A personal assistant for one user: tasks and Google Calendar in one installable app, on Cloudflare Workers and React 19. | `typescript` `react` `cloudflare-workers` | 2026 | [repo](https://github.com/fabiombarreto/praesto-sum) | Status: in development |
| 4 | **Manaus literacy platform** | Literacy tracking for Manaus public schools: 322+ schools and 70,000+ students, built by a team of 4 that I led. | `python` `django` `react` | 2023–2024 | none (client work) | Case study. Only the scale figures are real metrics; there is no literacy-outcome number |
| 5 | **Sala do Saber** | A complete e-learning platform I built alone, from requirements and domain model to CI/CD and AWS. | `angular` `node` `aws` | 2020–2022 | none (client work) | Case study. No user counts on file |
| 6 | **site-pro** | This site: a portfolio that builds itself live, one typed command at a time. | `astro` `react` `typescript` | 2026 | repo (once pushed) | Meta project; the project page links to the "how this site was built" story |

### Detail page material

- **relay:** the workflow (interactive PRD, then plan, plan review, implementation, code review and a test run with a budgeted auto-correction loop; changes wait in an isolated worktree), the validation suite, and the optimization story: an audit of 270 review runs found that failure feedback was computed but never used, so retries started from scratch. Source: story bank, Story 3. No before/after improvement number is documented, so claim none.
- **Manaus literacy platform:** architecture ownership, requirements that changed mid-project, and the soft-delete statistics incident (story bank, Stories 1 and 6).
- **Sala do Saber:** solo, end-to-end delivery, from domain modeling to production (story bank, Story 5).

## Stack

Draft frequencies, based on the current contracts in `cv.md` (Grupo Azul: Java, Spring Boot, React, GraphQL; Super Ensino: Django, React). **TBD:** confirm or adjust each one.

| Group | Daily | Often | Sometimes |
|---|---|---|---|
| languages | java, python, typescript | sql | — |
| frontend | react | — | angular |
| backend | spring-boot, django, graphql | node | fastapi |
| data | — | postgresql | redis, rabbitmq |
| cloud | — | aws, ci-cd | — |
| ai | claude-code | — | — |

## Contact

| Item | Target |
|---|---|
| Heading | Let's talk. |
| Email | **TBD** |
| GitHub | `github.com/fabiombarreto` |
| LinkedIn | `linkedin.com/in/fabio-martins-barreto` |

## Kept for post-v1

The Experience section (D4) can be built from the `cv.md` work history: Grupo Azul, Super Ensino, Quantum Solution, iPatas, Sala do Saber, independent web work, Matera, Paraleloz, UEM and Accion, plus the Bachelor's in Computer Science (UEM) and the postgraduate diploma in progress.

## Open questions

1. **Photo:** none in career-ops. Can you send one?
2. **Email:** use your personal address publicly, or create a dedicated one?
3. **Location:** "Maringá, Brazil" or only "Brazil"?
4. **Availability line:** include "Open to remote work", or leave it out?
5. **Projects:** keep these six?
6. **Stack:** are the frequencies right?
7. **Headline:** keep "Hi, I'm Fabio.", or use something else?
