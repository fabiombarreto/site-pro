# 07 · Roadmap and decisions

## Stages

| Stage | Deliverable | Done when |
|---|---|---|
| **0 · Foundations** (now) | Documentation, stack and working tools; root `README.md`; Git repository initialized | Docs approved and Stage 0 decisions answered |
| **1 · Design project** | Content, color and features defined; Design System; desktop/tablet/mobile screens; animated prototype of the boot and the scroll, all in Claude Design (see [08](08-tools.md#design-tool)) | The look **and the rhythm** are approved and Stage 1 decisions are answered |
| **Milestone · `CLAUDE.md`** | Generated with the relay plugin's `context-builder` command | Documentation and planning are complete, before Stage 2 |
| **2 · Foundation** | Astro + React + TypeScript project, tokens and themes, responsive IDE chrome, static sections with placeholder content, CI and preview deployments | A navigable static site, without animation, meeting the accessibility targets |
| **3 · Runtime** | Scheduler, typing, logs, triggers, skip, speed, replay, turbo, deep links, reduced motion, persistence | Every scenario in [02 · Behavior rules](02-experience.md#behavior-rules) covered by an E2E test |
| **4 · Sections and effects** | Hero (banner, ASCII → photo), Projects, About, Stack, Experience, Articles, Contact, with the real content | Every section with the effects from [04](04-animations.md), within the 2.5 s budget |
| **5 · IDE extras** | Command Palette, Explorer scroll-spy, theme switching, project tabs, 404, easter eggs | Shortcuts and palette fully usable by keyboard |
| **6 · Polish and launch** | Accessibility audit, performance, SEO, OG images, analytics, cross-browser testing, domain | Targets from [01](01-concept.md#how-we-will-know-it-worked) met, site live and a "how I built this site" post |
| **v1.1** | Interactive terminal, minimap, resizable Explorer, multi-cursor (if approved) | — |

**Launch (v1)** = Stages 2 to 4 + controls (skip/speed) + mobile + the Command Palette and project tabs from Stage 5 + Stage 6. The rest of Stage 5 can move to v1.1 if we want to launch sooner.

> Production code starts only in Stage 2, once documentation and design are approved. Stage 1 prototypes live in the design tool and are disposable.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| The animation gets tiresome or delays access to content | A ≤ 2.5 s budget per section, skip always available, speed control, instant revisits, and measuring "Skip" usage to recalibrate |
| SEO hurt by "hidden" content | SSG with complete HTML; the animation only hides things visually, and only after JS confirms it will run |
| Screen readers reading noise (ASCII, logs) | `aria-hidden` on every decorative element, with a real text equivalent |
| ASCII art breaking on narrow screens | Per-breakpoint variants (compact banner), CSS frames that adapt to the width, visual tests |
| High LCP because the hero waits for the animation | Hero boot designed for ≤ 1.8 s; hero photo loaded with priority |
| React adding weight to the first load | React components render to static HTML; only a few islands hydrate, after idle, off the critical path |
| Misaligned border characters in some font or system | Self-hosted JetBrains Mono (the same font everywhere) and test screenshots on Windows, macOS, iOS and Android |
| Looking like a VS Code copy | Our own theme, icons and identity; no third-party brands |
| Scope creep, "just one more effect" | v1 scope closed above; new ideas go to v1.1 |
| Claude Design changing or leaving *research preview* | The design system and decisions are documented in `docs/`; Figma (with its MCP) is the fallback |

---

## Open decisions

Each decision comes with a recommendation. Agreeing or disagreeing is enough.

### Stage 0 · Foundations: documentation, stack and tools

| # | Decision | Options | Recommendation | Status |
|---|---|---|---|---|
| **D1** | Language | PT-BR · EN · bilingual | — | ✅ **English only**, for the site and every project artifact (docs, code, commits) |
| **D2** | Stack | Astro · Next.js · SvelteKit · other | — | ✅ **Astro + React + TypeScript** |
| **D9** | Hosting | Cloudflare Pages · Vercel · Netlify · GitHub Pages | — | ✅ **Cloudflare Pages** |
| **D11** | Design tool | Claude Design · Figma · Penpot | — | ✅ **Claude Design** (Figma as a fallback) |
| **D13** | Repository visibility | Public · private | — | ✅ **Public** |
| **D14** | Task management | GitHub Issues + Projects · other · none | **GitHub Issues** when the work calls for it | ⏸ Suggestion, decide when needed |
| **D16** | License (public repository) | MIT · Apache-2.0 · other | — | ✅ **MIT for the code**; personal content (text, photo, images) all rights reserved |

### Stage 1 · Design project: content, color and features

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **D3** | Default theme and accent color | Midnight + blue `#2563eb` · a personal color · follow the system theme | **Midnight + blue**, always dark by default (it is the site's identity), with Classic available in the status bar. A personal color, if any, becomes `--accent` |
| **D4** | v1 sections | The 7 in [05](05-content.md#v1-sections) | **Hero, About, Projects, Stack, Contact** guaranteed; **Experience** and **Articles and talks** depending on the content |
| **D5** | Project card click | Internal page (new `.md` tab) · direct external link | **Internal page**: better for telling the project's story, for SEO and for the IDE metaphor. Cards also carry direct repo and demo shortcuts |
| **D6** | Revisits | Full animation always · at 2× · instant | **Instant within the same session; full on new visits** |
| **D7** | Interactive terminal at the end | v1 · v1.1 | **v1.1**: a great differentiator, but it must not delay the launch |
| **D8** | Multi-cursor ("agents"), a tribute to the reel | Include · test in the prototype · drop | **Test in the prototype**, in the hero only, and decide after seeing it |
| **D12** | Hero photo | ASCII → real photo · permanent ASCII (photo on hover) | **ASCII → real photo**: terminal impact without hiding the owner's face |

### Stage 6 · Launch

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **D10** | Analytics | Cloudflare Web Analytics · Plausible · Umami · none | **Cloudflare Web Analytics** (free and cookieless), mainly to tune the animation pace |
| **D15** | Domain | — | To be defined |
