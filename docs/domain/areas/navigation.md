# Area: Navigation and interactions

Nav bar, Command Palette, shortcuts, project pages and the 404. Sources: docs/02-experience.md (Nav bar, Interactions, Other pages), docs/03-design-system.md.

## Business rules

| # | Rule |
|---|---|
| N1 | Nav: `fabiombarreto` (top of page), About · Projects · Stack · Contact, `⌘K`, theme toggle `◐`, GitHub. Transparent at the top, translucent with blur after scrolling |
| N2 | Scroll-spy highlights the link of the visible section |
| N3 | A nav link to an unbuilt section scrolls there at once; the sections before it build in turbo, in order, then the target builds |
| N4 | `⌘K` shows as `Ctrl K` on Windows and Linux |
| N5 | Below 768 px the links move into a `☰` menu |
| N6 | Command Palette (`Ctrl/⌘ + K`, the nav button or the collapsed dock): `Go to <section>`, `Open project: <name>`, `Run all`, `Replay the build`, `Speed: 1× / 2× / instant`, `Theme: Midnight / Daylight`, `Open GitHub / LinkedIn`; fuzzy search |
| N7 | Shortcuts: `Esc` skip, `Shift + Esc` run all, `Ctrl/⌘ + K` palette, `?` shortcut list. No `Ctrl + 1…5` (browsers use them) |
| N8 | Project card click opens the internal page `/projects/<slug>` (D5) with a card → header view transition; the dock types `open("slug");` |
| N9 | Back from a project page returns to the grid at the same position |
| N10 | Cards carry a direct `repo ↗` shortcut; external links always carry `↗` |
| N11 | Card hover and focus: slight lift, accent border, small cover zoom; keyboard focus adds the focus ring |
| N12 | 404: the dock types `open("/typed-path");` and an `error.log` window shows `Error: ENOENT…`, `Did you mean /projects?` and `Go home`; the window is the final state |
| N13 | The footer keeps the build summary with Replay, `Source ↗` to the repository and the copyright line |
| N14 | Everything in the palette and shortcuts is fully usable by keyboard (Stage 5 exit) |

## Out of scope for v1

Interactive dock prompt (`help`, `ls`, `open`, `theme`, `replay`, `contact`, easter eggs), planned for v1.1 (D7).

## Open Questions

- How the 404 suggestion is computed (always `/projects`, or the closest known path) [INFERRED - VALIDATE].
- Whether the view transition falls back to a plain navigation where the View Transitions API is missing [INFERRED - VALIDATE].
- What `?` shows exactly (a dialog or a palette view) [INFERRED - VALIDATE].
