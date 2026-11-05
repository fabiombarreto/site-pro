# Main flows

Plain-language visitor flows. Full scripts and wireframes: docs/02-experience.md.

## 1. First visit (JavaScript on, motion allowed)

1. An empty first screen shows a small terminal; `startSite();` is typed and two log lines appear. The nav slides in.
2. The terminal folds into the dock at the bottom; the `hero.tsx` window opens and creates the name, role, photo, intro and buttons in about 3 seconds.
3. The window's chrome fades; the hero stays as a normal page. The dock waits: `✓ 1/5 sections ❯ █ scroll ↓`.
4. Each time the visitor scrolls a new section into view, the dock types its command and a window builds it (About, Projects, Stack, Contact), each usable within 2.5 seconds.
5. After Contact: `✔ Build complete: 5 sections in 9.6s ↻ Replay`; after ~4 s the dock collapses into a small `❯_` button. The footer keeps `Built live in 9.6s · ↻ Replay`.

## 2. Impatient visitor

- Presses `Esc` or `» Skip`: the current section finishes at once.
- Presses `Shift + Esc` or `Run all`: every remaining section finishes at once.
- Sets the speed to `2×` or `∞`; `∞` is remembered on later visits.
- Scrolls fast: skipped sections are queued and built in turbo until the build catches up.

## 3. Jump to a section

Clicking a nav link, choosing `Go to <section>` in the palette or arriving via `/#projects` builds everything before the target in turbo and scrolls there. The page never scrolls on its own otherwise.

## 4. Open a project

Clicking a card: the dock types `open("slug");`, the card grows into the project page header (view transition) and `/projects/<slug>` shows cover, summary, metadata, story and links. Back returns to the grid at the same position. The card's `repo ↗` shortcut goes straight to GitHub.

## 5. Get in touch

The visitor follows the GitHub or LinkedIn links in the hero, About, Contact or the mobile menu. There is no email and no form.

## 6. Keyboard and screen reader visitor

- "Skip to content" link; visible focus everywhere.
- Focus entering an unbuilt section finishes it instantly.
- The build layer is hidden from assistive technology; pending content stays in the accessibility tree, so the page reads normally.

## 7. Reduced motion or no JavaScript

- Reduced motion: no terminal, windows or typing; everything is ready. The dock shows `✔ Ready · motion reduced ▶ Play build`.
- No JavaScript: the whole site renders statically in its final state, with no dock or window.

## 8. Revisit

Every visit plays the full build again, reloads included (D6), unless the visitor saved the `∞` speed.

## 9. Lost visitor (404)

The dock types `open("/typed-path");` and a small `error.log` window shows `Error: ENOENT…`, `Did you mean /projects?` and a `Go home` button. Here the window is the final state.

## 10. Owner updates content

The owner edits Markdown/JSON in `src/content/` (profile, projects, stack), opens a pull request, checks the preview deployment and merges; Cloudflare Pages publishes. There is no CMS [INFERRED - VALIDATE: exact flow depends on the Stage 2 CI setup].
