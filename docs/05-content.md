# 05 · Content

> The content itself (copy, projects, which sections are included) is decided in **Stage 1 — Design project**. This document describes the structure. **All site content is in English** (decision D1).

## v1 sections

| # | Section | Purpose | Required? |
|---|---|---|---|
| 1 | **Hero** | Who you are in 3 seconds: name, photo, title, subtitle and main links | Yes |
| 2 | **About** | A short story: what you do and what interests you | Yes |
| 3 | **Projects** | The heart of the site: featured projects, all clickable | Yes |
| 4 | **Stack** | Technologies you use and how often | Yes |
| 5 | **Contact** | How to reach you and where to follow you | Yes |
| — | **Project detail** | One page per project (a `name.md` tab) | Yes (D5) |
| — | **Experience** | Career path (jobs, milestones, talks) | Post-v1 (D4) |
| — | **Articles and talks** | Content you produce for the community | Post-v1 (D4) |
| — | **README.md** | "How this site was built": stack, credits, link to the source | Recommended (great for the dev community) |
| — | **404** | A tongue-in-cheek `ENOENT` error | Yes |

## Data model

Content lives in the repository as Markdown/JSON files validated at build time. Editing the site means editing these files. There is no CMS, backend or API.

### `profile`: general data (a single record)

| Field | Type | Example / rule |
|---|---|---|
| `name` | text | Full name, used in the `<h1>` and the banner |
| `bannerText` | text | Short version for the ASCII banner (e.g. first name), since long names do not fit in figlet |
| `role` | text | "Software Engineer" |
| `subtitle` | text | One or two lines: what you build and why |
| `photo` | image | Square, ≥ 800 px, plain background (the ASCII version looks better with good contrast) |
| `location` | text | Optional |
| `bio` | Markdown | The About section text (~120–250 words) |
| `links` | list | `{ label, url, icon }`: GitHub, LinkedIn, X/Bluesky, dev.to, YouTube… |
| `email` | text | For the copy button |
| `availability` | text | Optional: "Open to open source collaborations" |
| `cv` | file | Optional |

### `projects`: one Markdown file per project

| Field | Type | Rule |
|---|---|---|
| `slug` | text | Used in the URL and in the Explorer (`projects/name.md`) |
| `title` | text | Short |
| `summary` | text | **≤ 140 characters**, shown on the card |
| `cover` | image | 16:9, ≥ 1280 px |
| `tags` | list | 2 to 4 technologies |
| `links` | object | `repo`, `demo`, `article` (all optional) |
| `year` | number | — |
| `featured` | yes/no | Shown on the home page |
| `order` | number | Grid order |
| `status` | text | `active`, `maintained` or `archived` |
| `githubRepo` | text | Optional: `user/repo`, to fetch the star count at build time |
| body | Markdown | Detail page text: problem, solution, technical decisions, lessons learned |

### `stack`: one JSON file

| Field | Type | Rule |
|---|---|---|
| `groups[]` | list | `languages`, `frontend`, `backend`, `infra`, `tools`… |
| `groups[].items[]` | list | `{ name, frequency }`, where `frequency` is `daily`, `often` or `sometimes` |

### `experience`: one file per item (post-v1)

| Field | Type | Rule |
|---|---|---|
| `org` | text | Company, community or event |
| `role` | text | Job title or role |
| `start` / `end` | date | An empty `end` means "now" |
| `type` | text | `job`, `talk`, `oss`, `milestone`. Talks and OSS become "branches" in the graph |
| `highlights` | list | 1 to 3 short sentences |
| `tech` | list | Optional |

The commit hash shown (`a1f3c9e`) is generated from the data: decorative, but stable across builds.

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

- **English only, for now** (decision **D1**): interface, commands, logs and content.
- Interface copy is centralized in a single file, so adding another language later would be a contained change.
- Tone: first person, direct, technical without being dry, with humor only in the details (easter eggs, 404, `warn`).

## Console microcopy

| Section | Command | Logs | Completion |
|---|---|---|---|
| Hero | `startSite();` | `Initializing application...` · `Loading modules [███] 5/5` · `Rendering Hero Section...` | `✔ Hero Section created.` |
| About | `renderAbout();` | `Reading about.md...` | `✔ About Section created.` |
| Projects | `renderProjects({ featured: true });` | `Fetching projects... 6 found` · `Creating Projects Section...` | `✔ Projects Section created.` |
| Stack | `renderStack();` | `Resolving dependencies...` | `✔ Stack Section created.` |
| Experience (post-v1) | `renderExperience();` | `Reading git history...` | `✔ Experience Section created.` |
| Articles and talks (post-v1) | `renderWriting({ limit: 5 });` | `Fetching posts... 3 found` | `✔ Writing Section created.` |
| Contact | `renderContact();` | `Opening channels...` | `✔ Contact Section created.` |
| End | — | — | `✔ Build complete — 5 sections rendered in 6.84s` |
| Hint | — | `// scroll to continue ↓` | — |
| 404 | `open('/path')` | `Error: ENOENT: no such file or directory, open '/path'` | `Did you mean: /projects ?` |

Possible easter eggs: a rare `warn  Coffee level low ☕` during boot, or `info  Easter egg found 🥚` when someone clicks the red window dot.

---

## Checklist: what the site owner needs to provide

All in English.

**Needed for Stage 1 (design project)**

- [ ] Full name and the short version for the banner
- [ ] Title/role and subtitle
- [ ] Photo (square, good resolution, plain background)
- [ ] 3 to 6 projects: title, short summary, image, tags and links
- [ ] Main links (GitHub, LinkedIn, etc.) and public email
- [ ] Answers to the Stage 1 [open decisions](07-roadmap-and-decisions.md#open-decisions)

**Needed before launch**

- [ ] About section bio
- [ ] Stack list with usage frequency
- [ ] Detail page text for each project (D5)
- [ ] Domain
