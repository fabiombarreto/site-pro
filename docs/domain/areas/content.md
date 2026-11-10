# Area: Content

What the site says and how content is modeled. Sources: docs/05-content.md (model), docs/09-content-draft.md (approved copy).

## Business rules

| # | Rule |
|---|---|
| C1 | v1 sections: **Hero, About, Projects, Stack, Contact**, plus one page per project and the 404 (D4). No separate "How this site was built" page: the site-pro project page tells that story |
| C2 | Content lives in the repository as Markdown/JSON validated at build time. No CMS, backend or API |
| C3 | **Only personal projects** appear; client work and past employers stay in the CV and on LinkedIn |
| C4 | Privacy: never publish phone, email, compensation targets, city, relocation/visa policy, application or interview data, recruiter notes. Location is country and time zone only: `Brazil (UTC-3)` |
| C5 | No public email, availability line or "at a glance" box; contact is GitHub and LinkedIn only |
| C6 | `profile.bio` (About) is **under 100 words**; the approved text has 54 |
| C7 | `projects.summary` is **≤ 140 characters**; `tags` 2 to 4; `cover` 16:9, ≥ 1280 px |
| C8 | `projects.status` is one of `active`, `in development`, `planning`, `maintained`, `archived` |
| C9 | `profile.headline` is the page `<h1>` and is typed as `hero.title("…")` |
| C10 | `profile.photo`: full body, standing, 9:16, ≥ 1200 × 2133 px, cut out or on a plain background, good contrast (it feeds the ASCII effect) |
| C11 | `stack.groups[].items[]` are names in display order; no usage frequency |
| C12 | Only claim numbers that exist in the owner's CV; relay cites no user or star counts and no before/after improvement number |
| C13 | Voice: first person, short sentences, contractions, digits, no em dashes, no banned AI vocabulary, no "this isn't X, it's Y" |
| C14 | Page copy is plain English for anyone; code-flavored text only in the build layer and small labels |
| C15 | relay's card or page must say the repository is a fork of Wirasm/prp and relay is the plugin built inside it |
| C16 | Personal content (text, photo, images) is all rights reserved; the code is MIT (D16) |
| C17 | Committed images carry no EXIF, XMP or GPS metadata (a photo's GPS would reveal the city, C4); `pnpm check:privacy` fails otherwise (Stage 4 PRD) |
| C18 | `profile.photo` and `projects.cover` are image files in `src/assets` referenced as Astro images; swapping one changes no code, and the responsive, ASCII and blurred versions are regenerated at build time (Stage 4 PRD) |

## Approved content (docs/09-content-draft.md)

- Headline `Fabio Barreto.`; role `Senior Software Engineer`; nav label `fabiombarreto`.
- Projects (2 × 2): relay (active), AI Track Record (planning), Praesto Sum (in development), site-pro (in development).
- Stack groups: languages, frontend, backend, data, cloud, ai.
- Contact: `Let's talk.` with GitHub, LinkedIn and `Brazil (UTC-3)`.

## Pending before launch

Real full-body photo, project covers, project page text for each project, domain (D15). Placeholders: `photo-placeholder-body.svg` (900 × 1600) and dot-grid covers from the Design System. Stage 4 ships with the placeholders; the project page text is drafted in docs/09-content-draft.md for the owner's approval.

## Open Questions

- Whether `featured` filtering is used in v1 when there are only four projects [INFERRED - VALIDATE].
- Whether the optional `cv` file is linked anywhere on the site [INFERRED - VALIDATE: no section shows it today].
- Whether GitHub star counts (`githubRepo`) are displayed at all, given C12.
