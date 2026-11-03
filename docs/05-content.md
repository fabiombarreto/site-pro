# 05 · Content

> The content itself (copy, projects, which sections are included) is decided in **Stage 1 — Design project**. This document describes the structure; the actual content is drafted in [09 · Content draft](09-content-draft.md). **All site content is in English** (decision D1).

## v1 sections

| # | Section | Purpose | Required? |
|---|---|---|---|
| 1 | **Hero** | Who you are in 3 seconds: name, photo, role, intro and main links | Yes |
| 2 | **About** | A short story, plus a few facts at a glance | Yes |
| 3 | **Projects** | The heart of the site: featured projects, all clickable | Yes |
| 4 | **Stack** | Technologies you use and how often | Yes |
| 5 | **Contact** | How to reach you and where to follow you | Yes |
| — | **Project page** | One page per project (`/projects/<slug>`) | Yes (D5) |
| — | **Experience** | Career path (jobs, milestones, talks) | Post-v1 (D4) |
| — | **Articles and talks** | Content you produce for the community | Post-v1 (D4) |
| — | **How this site was built** | Stack, the build runtime, credits and a link to the source | Recommended (great for the dev community) |
| — | **404** | A tongue-in-cheek `ENOENT` error, shown in a build window | Yes |

## Data model

Content lives in the repository as Markdown/JSON files validated at build time. Editing the site means editing these files. There is no CMS, backend or API.

### `profile`: general data (a single record)

| Field | Type | Example / rule |
|---|---|---|
| `name` | text | Full name, used in the page title and structured data |
| `headline` | text | The hero headline, typed during the build (e.g. "Hi, I'm Fabio."). It is the page's `<h1>` |
| `role` | text | "Software Engineer" |
| `subtitle` | text | The hero intro: one or two sentences on what you build |
| `photo` | image | Square, ≥ 800 px, plain background (the ASCII version used during the build looks better with good contrast) |
| `location` | text | Optional |
| `bio` | Markdown | The About section text (~120–250 words) |
| `facts` | list | 3 or 4 `{ value, label }` pairs for the About "at a glance" box (e.g. `12+` · "years shipping code") |
| `links` | list | `{ label, url, icon }`: GitHub, LinkedIn, X/Bluesky, dev.to, YouTube… |
| `email` | text | For the copy button |
| `availability` | text | Optional: "Open to open source collaborations" |
| `cv` | file | Optional |

### `projects`: one Markdown file per project

| Field | Type | Rule |
|---|---|---|
| `slug` | text | Used in the URL (`/projects/slug`) and in the build commands (`projects.card("slug")`) |
| `title` | text | Short |
| `summary` | text | **≤ 140 characters**, shown on the card |
| `cover` | image | 16:9, ≥ 1280 px |
| `tags` | list | 2 to 4 technologies |
| `links` | object | `repo`, `demo`, `article` (all optional) |
| `year` | text | `2026` or a range such as `2020–2022` |
| `featured` | yes/no | Shown on the home page |
| `order` | number | Grid order |
| `status` | text | `active`, `in development`, `planning`, `maintained`, `archived` or `case study` |
| `githubRepo` | text | Optional: `user/repo`, to fetch the star count at build time |
| body | Markdown | Project page text: problem, solution, technical decisions, lessons learned |

### `stack`: one JSON file

| Field | Type | Rule |
|---|---|---|
| `groups[]` | list | `languages`, `frontend`, `backend`, `data`, `cloud`, `ai`… |
| `groups[].items[]` | list | `{ name, frequency }`, where `frequency` is `daily`, `often` or `sometimes` |

### `experience`: one file per item (post-v1)

| Field | Type | Rule |
|---|---|---|
| `org` | text | Company, community or event |
| `role` | text | Job title or role |
| `start` / `end` | date | An empty `end` means "now" |
| `type` | text | `job`, `talk`, `oss`, `milestone` |
| `highlights` | list | 1 to 3 short sentences |
| `tech` | list | Optional |

### `writing`: one file per item (post-v1)

| Field | Type | Rule |
|---|---|---|
| `title` | text | — |
| `type` | text | `article`, `talk`, `podcast`, `video` |
| `venue` | text | Platform or event |
| `date` | date | — |
| `url` | link | — |
| `lang` | text | Language of the piece itself (`en`, `pt`…), shown in the listing. The site is in English, but a piece may not be |

## Language and tone

- **English only, for now** (decision **D1**): page copy, commands, logs and content.
- Interface copy is centralized in a single file, so adding another language later would be a contained change.
- **Page copy is plain English for anyone.** Code-flavored text lives only in the build layer (commands and logs) and in small labels.
- Tone: first person, direct, technical without being dry, with humor only in the details (easter eggs, 404, `warn`).

## Build microcopy

| Section | Dock command | Dock log | Window | Window commands | Completion |
|---|---|---|---|---|---|
| Hero | `startSite();` | `Initializing application...` · `Opening hero.tsx...` | `hero.tsx` | `hero.title("…")` · `hero.role("…")` · `hero.photo("…")` · `hero.intro("…")` · `hero.links([…])` | `✔ Hero Section created.` |
| About | `renderAbout();` | `Reading about.md...` | `about.md` | `about.heading("…")` · `about.text(4)` · `about.facts(4)` | `✔ About Section created.` |
| Projects | `renderProjects();` | `Fetching projects... 6 found` | `projects.tsx` | `projects.heading("…")` · `projects.card("slug")` | `✔ Projects Section created.` |
| Stack | `renderStack();` | `Resolving dependencies...` | `stack.json` | `stack.heading("…")` · `stack.legend()` · `stack.group("languages")` | `✔ Stack Section created.` |
| Contact | `renderContact();` | `Opening channels...` | `contact.tsx` | `contact.heading("…")` · `contact.email()` · `contact.links([…])` | `✔ Contact Section created.` |
| Experience (post-v1) | `renderExperience();` | `Reading git history...` | `experience.log` | `experience.entry("…")` | `✔ Experience Section created.` |
| Articles and talks (post-v1) | `renderWriting();` | `Fetching posts... 3 found` | `writing.md` | `writing.item("…")` | `✔ Writing Section created.` |
| Project page | `open("slug");` | — | — | — | — |
| End | — | — | — | — | `✔ Build complete: 5 sections in 9.6s` |
| Hint | — | — | — | — | `scroll ↓` (in the idle dock) |
| 404 | `open("/path");` | — | `error.log` | — | `Error: ENOENT: no such file or directory, open '/path'` · `Did you mean /projects?` |

Every completion line also shows the build time, such as `(2.31s)`.

Possible easter eggs: a rare `warn  Coffee level low` during the boot, or `warn  Window closed. Building anyway...` when someone clicks the first dot of a build window.

---

## Checklist: what the site owner needs to provide

All in English.

**Needed for Stage 1 (design project)**

- [ ] Full name and the hero headline
- [ ] Role and intro
- [ ] Photo (square, good resolution, plain background)
- [ ] 3 to 6 projects: title, short summary, cover image, tags and links
- [ ] Main links (GitHub, LinkedIn, etc.) and public email
- [ ] Answers to the Stage 1 [open decisions](07-roadmap-and-decisions.md#open-decisions)

**Needed before launch**

- [ ] About section bio and facts
- [ ] Stack list with usage frequency
- [ ] Project page text for each project (D5)
- [ ] Domain
