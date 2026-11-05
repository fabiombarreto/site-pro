# Anti-Patterns

Forbidden patterns, disabled features and intentional restrictions.
The AI must NOT implement anything listed here, even if it seems correct.
Updated by the Docs Updater after each approved implementation.

---

## Layout-shifting build animations

**What it is:** Animating `width`, `height`, `top`, `margin` or other layout properties, or inserting build-layer elements into the page flow.
**Why it's forbidden:** "The final layout never moves" is a core rule (docs/01-concept.md principle 5, docs/02-experience.md); it also protects CLS ≈ 0.
**What to do instead:** Overlays positioned from each section's box (`ResizeObserver`), animating only `transform`, `opacity` and `clip-path`.
**Areas affected:** build, visual-design

---

## Hiding pending content with `display` or `visibility`

**What it is:** Removing unbuilt sections from layout or the accessibility tree.
**Why it's forbidden:** Breaks reserved space, SEO and screen readers (docs/07-roadmap-and-decisions.md risks).
**What to do instead:** Keep content laid out; hide it visually with `opacity`/`clip-path`, and only after JS confirms the build will run.
**Areas affected:** build

---

## Generic fade-up reveals

**What it is:** Scroll-triggered fade/slide-in animations for elements.
**Why it's forbidden:** Elements are created, not faded in (docs/04-animations.md motion principle 2).
**What to do instead:** `select → skeleton → content` with the catalog effects (`type-text`, `decode`, `resolve-lines`, `image-resolve`, `pop`).
**Areas affected:** build

---

## Scroll hijacking

**What it is:** The runtime moving the page, snapping sections or locking scroll on its own.
**Why it's forbidden:** Behavior rule "Never hijack scrolling" (docs/02-experience.md).
**What to do instead:** Scroll only on a visitor request: nav or palette click, deep link, Replay.
**Areas affected:** build, navigation

---

## Re-rendering React per typed character

**What it is:** Driving typing, logs or element effects through React state updates.
**Why it's forbidden:** Wastes the critical-path budget and frame time (docs/06-architecture.md, "Why Astro + React").
**What to do instead:** The plain TypeScript runtime writes to the DOM directly and publishes state through nanostores.
**Areas affected:** build

---

## Many timers instead of one loop

**What it is:** Dozens of `setInterval`/`setTimeout` calls or scroll listeners driving the build.
**Why it's forbidden:** docs/04-animations.md "Runtime performance".
**What to do instead:** One `requestAnimationFrame` loop, `IntersectionObserver` triggers, a pausable (and, in tests, deterministic) clock.
**Areas affected:** build

---

## Mixing the two registers

**What it is:** Code-flavored text, terminal styling or the dot grid in the final page; or page styling inside the build layer.
**Why it's forbidden:** The page must read for anyone; developer flavor lives only in the build layer and small labels (docs/01-concept.md principle 2, D20).
**What to do instead:** Page components for content; build components only in the overlay.
**Areas affected:** visual-design, content

---

## Raw values instead of tokens

**What it is:** Hex colors, pixel spacing, radius or shadows hard-coded in components.
**Why it's forbidden:** Both themes and contrast guarantees depend on tokens (docs/03-design-system.md).
**What to do instead:** CSS custom properties from `src/styles/tokens.css` and the type classes.
**Areas affected:** visual-design

---

## OS or app branding in the window chrome

**What it is:** macOS traffic-light colors, OS window controls or app logos on build windows.
**Why it's forbidden:** "Inspired, not copied" (docs/01-concept.md principle 8).
**What to do instead:** The Design System's own chrome: three neutral dots, our type.
**Areas affected:** visual-design

---

## Publishing private data

**What it is:** Phone, email, compensation, city, relocation/visa policy, application or interview data, recruiter notes, past employers or client projects anywhere on the site or in the public repository (including commits, fixtures and test data).
**Why it's forbidden:** Owner's privacy rule (docs/09-content-draft.md, "Left out on purpose").
**What to do instead:** Only the approved content in docs/09-content-draft.md; location as `Brazil (UTC-3)`; commits with the GitHub noreply address.
**Areas affected:** content

---

## Invented numbers and banned copy patterns

**What it is:** Metrics not in the owner's CV (user counts, stars, improvement percentages), em dashes in content, banned AI vocabulary, "this isn't X, it's Y".
**Why it's forbidden:** The voice rules and "specific beats impressive" (docs/09-content-draft.md).
**What to do instead:** Say what it is, with numbers that exist.
**Areas affected:** content

---

## A contact form or public email

**What it is:** Any form, mailto link or email address on the site.
**Why it's forbidden:** Presentation-only scope with no backend; contact is GitHub and LinkedIn only (docs/05-content.md).
**What to do instead:** GitHub and LinkedIn links.
**Areas affected:** content, navigation

---

## Scope creep into v1

**What it is:** Shipping v1.1 or post-v1 features in v1: interactive dock (D7), agent cursors (D8), Phosphor theme, Experience, Articles and talks (D4), 3D/WebGL, an external CMS.
**Why it's forbidden:** v1 scope is closed (docs/07-roadmap-and-decisions.md).
**What to do instead:** Record the idea for v1.1 or post-v1.
**Areas affected:** all

---

## Weakening tests to get a green run

**What it is:** Deleting, skipping, commenting out or loosening assertions so a suite passes.
**Why it's forbidden:** It hides regressions; docs/context/testing.md requires tests to follow intended behavior, not the other way round.
**What to do instead:** Fix the code, or update the test to the new intended behavior and say why.
**Areas affected:** all

---

<!-- Template for future entries:

## [pattern name]

**What it is:** Brief description.
**Why it's forbidden:** The reason this was explicitly prohibited.
**What to do instead:** The approved alternative.
**Areas affected:** [list domain areas]

-->
