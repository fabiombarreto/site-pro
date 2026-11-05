# Glossary

Terms used across the docs, the Design System and (later) the code. Sources: docs/01-concept.md, docs/02-experience.md, docs/04-animations.md, docs/05-content.md.

| Term | Definition |
|---|---|
| **Owner** | The person the site presents (Fabio Barreto). The only author of content |
| **Visitor** | Anyone viewing the site: developers first, then the open source community, organizers, recruiters and non-technical readers |
| **The page** | The final, readable site (sections, nav, footer). What stays on screen. Modern register |
| **Build layer** | Everything that exists only while the site builds itself: boot terminal, dock, build windows, selection boxes, skeletons, (v1.1) agent cursors. Overlay only, `aria-hidden`. Code register |
| **Build** | The whole show: the site rebuilding itself in front of the visitor, section by section |
| **Section** | One part of the page: Hero, About, Projects, Stack, Contact (v1). Post-v1: Experience, Articles and talks |
| **Section build** | One section's run through the lifecycle: dock command → log → window → element commands → confirmation → window fades |
| **Build script** | The declarative steps of one section (dock part + window part) that the runtime runs. The on-screen commands come from it and must match the real source |
| **Runtime** | The framework-agnostic TypeScript engine that schedules section builds, runs effects, handles triggers, controls and persistence |
| **Boot terminal** | The small terminal in the middle of the first screen that types `startSite();` and then folds into the dock |
| **Command dock** (dock) | The pill at the bottom center: types section commands, shows progress and holds Skip, speed and Replay. States: boot, typing, building, idle, done, collapsed, reduced motion (docs/02-experience.md) |
| **Build window** | An overlay framing a section's place while it builds: title bar (file name, progress), command bar (element commands), body (the section itself). Fades when the section is done |
| **Section command** | The call the dock types for a section: `startSite();` (hero), `renderAbout();`, `renderProjects();`, `renderStack();`, `renderContact();` |
| **Element command** | A call typed in a window's command bar that creates one element: `hero.title("…")`, `projects.card("relay")` |
| **Selection box** | A design-tool box with corner handles and a label (`h1`, `card`, `img 800×800`), dragged to an element's size before it appears |
| **Skeleton** | A gray placeholder block with shimmer (and dimensions for images) shown before the element's content |
| **Effect** | A named way an element or the build layer appears: `type`, `log`, `spinner`, `boot-fold`, `window-open`, `window-close`, `select`, `skeleton`, `type-text`, `decode`, `resolve-lines`, `image-resolve`, `pop`, `stagger`, `build-card` |
| **Lifecycle states** | `pending → queued → command → window → building → closing → done`, or `skipped` from any state |
| **Trigger** | The moment a section's top crosses ~75% of the viewport height; starts its section build |
| **Turbo** | Accelerated building (5–10×) of queued sections when the visitor scrolls past unbuilt ones, jumps via nav/palette or arrives by deep link |
| **Skip** | Finish the current section immediately (`Esc`, `» Skip`, click on window chrome, focus entering it, resize) |
| **Run all** | Finish every remaining section at once (`Shift + Esc`, palette) |
| **Speed** | Timing multiplier `1×`, `2×`, `∞` (instant); saved in the browser |
| **Replay** | Scroll to the top, hide every section and build the site again |
| **Play build** | The reduced-motion dock action that plays the build at 1× on request |
| **Reserved space** | Each section keeps its final height before it is built; content is laid out but invisible, with a dashed outline and the window name |
| **Banner hero** | The D20 hero: the name in giant type on two lines with a full-body cut-out photo in front, running into About |
| **Backdrop** | The continuous page background: theme color, soft accent-blue glows across section boundaries, film grain (D20) |
| **Dot grid** | The canvas pattern shown only inside build windows |
| **Midnight / Daylight** | The dark (default) and light themes |
| **Command Palette** | Fuzzy command launcher (`Ctrl/⌘ + K`): go to section, open project, run all, replay, speed, theme, open links |
| **Project page** | Internal detail page `/projects/<slug>` opened from a card (D5) |
| **Agent cursors** | v1.1 (D8): 2–4 labeled pointers building elements in parallel, desktop only |
| **Interactive dock** | v1.1 (D7): the collapsed dock opens a prompt for the site's own commands |
| **Stage** | A roadmap phase (0 Foundations … 6 Polish and launch) in docs/07-roadmap-and-decisions.md |
| **D-number** | A recorded decision (D1–D20) in docs/07-roadmap-and-decisions.md |
