import { createSelectionBox } from '../components/build/SelectionBox';
import { createSkeleton } from '../components/build/Skeleton';
import { createTextOverlay } from '../components/build/TextOverlay';
import {
  clear,
  countChars,
  docRect,
  hide,
  labelFor,
  lineReveal,
  live,
  locate,
  measureLines,
  popClip,
  revealPolygon,
  setStyle,
  textOf,
  type MeasuredLine,
} from './effect-dom';
import {
  LINE_MS,
  SELECT_MS,
  TYPE_CHAR_MS,
  cardPhases,
  decodeGlyphs,
  decodeSettled,
  hashSeed,
  popInset,
  popProgress,
  resolveLinesAt,
  staggerChildProgress,
  typeCharsAt,
} from './effect-timing';
import type { EffectName, SectionId, SectionState, Timeline } from './types';

export interface Effects {
  onState(id: SectionId, state: SectionState): void;
  onTick(id: SectionId, t: number): void;
  destroy(): void;
}

interface Mounted {
  render(localMs: number): void;
  destroy(): void;
}

interface Ctx {
  targets: HTMLElement[];
  seed: number;
  duration: number;
  fx: HTMLElement;
}

interface Measured {
  el: HTMLElement;
  lines: MeasuredLine[];
  total: number;
  x: number;
  y: number;
}

const FADE_MS = 100;
const HIDDEN_CLIP = 'inset(0 100% 0 0)';

const ramp = (t: number, from: number, to: number) =>
  Math.min(Math.max((t - from) / (to - from), 0), 1);

const measure = (el: HTMLElement): Measured => {
  const lines = measureLines(el);
  const box = docRect(el);
  return { el, lines, total: countChars(lines), x: box.x, y: box.y };
};

function selection(ctx: Ctx) {
  const boxes = ctx.targets.map((target) => {
    const box = createSelectionBox();
    box.setPlacement(docRect(target));
    box.setLabel(labelFor(target));
    ctx.fx.append(box.el);
    return box;
  });
  return {
    update(localMs: number, fadeFrom: number, fadeTo: number) {
      const draw = ramp(localMs, 0, SELECT_MS);
      const fade = ramp(localMs, fadeFrom, fadeTo);
      for (const box of boxes) {
        box.setDraw(draw);
        box.setState(fade > 0 ? 'fading' : draw < 1 ? 'drawing' : 'active');
        box.setOpacity(1 - fade);
      }
    },
    destroy() {
      for (const box of boxes) box.el.remove();
    },
  };
}

function caretOf(m: Measured, shown: number) {
  const at = locate(m.lines, shown);
  if (!at) return null;
  const char = at.line.chars[Math.max(at.index, 0)];
  return {
    x: m.x + (shown > 0 ? char.right : char.x),
    y: m.y + at.line.textTop,
    height: at.line.textBottom - at.line.textTop,
  };
}

const poof = (el: HTMLElement, p: number, radius: string) => {
  setStyle(el, 'clip-path', popClip(popInset(p), radius));
  setStyle(el, 'opacity', String(Math.round(Math.min(1, p * 2) * 100) / 100));
};

const radiusOf = (el: Element) => getComputedStyle(el).borderRadius || '0px';

const RUNNERS: Record<EffectName, (ctx: Ctx) => Mounted> = {
  select(ctx) {
    const sel = selection(ctx);
    return {
      render: (l) => sel.update(l, SELECT_MS - FADE_MS, SELECT_MS),
      destroy: sel.destroy,
    };
  },

  skeleton(ctx) {
    const sel = selection(ctx);
    const skel = createSkeleton(ctx.targets.map(docRect));
    skel.setOpacity(0);
    ctx.fx.append(skel.el);
    let shown = false;
    return {
      render(l) {
        sel.update(l, ctx.duration - FADE_MS, ctx.duration);
        skel.setOpacity(l < SELECT_MS ? 0 : 1 - ramp(l, 350, 450));
        if (l >= 350 && !shown) {
          shown = true;
          for (const t of ctx.targets) live(t);
        }
      },
      destroy() {
        sel.destroy();
        skel.el.remove();
      },
    };
  },

  'type-text'(ctx) {
    const sel = selection(ctx);
    const text = createTextOverlay();
    ctx.fx.append(text.el);
    const items = ctx.targets.map(measure);
    const n = Math.max(
      1,
      Math.round((ctx.duration - SELECT_MS) / TYPE_CHAR_MS),
    );
    let started = false;
    return {
      render(l) {
        sel.update(l, ctx.duration - FADE_MS, ctx.duration);
        if (l < SELECT_MS) return;
        const fraction = typeCharsAt(l, n) / n;
        for (const m of items) {
          const shown = Math.floor(fraction * m.total);
          setStyle(m.el, 'clip-path', revealPolygon(m.lines, shown, m.total));
          if (!started) live(m.el);
        }
        started = true;
        const first = items[0];
        const caret = first
          ? caretOf(first, Math.floor(fraction * first.total))
          : null;
        if (caret) text.setCaret(caret.x, caret.y, caret.height);
      },
      destroy() {
        sel.destroy();
        text.el.remove();
      },
    };
  },

  decode(ctx) {
    const sel = selection(ctx);
    const text = createTextOverlay();
    ctx.fx.append(text.el);
    const items = ctx.targets.map(measure);
    const first = items[0];
    if (first && first.lines[0]) {
      const cs = getComputedStyle(first.el);
      const line = first.lines[0];
      text.setFont({
        font: cs.font,
        letterSpacing: cs.letterSpacing,
        lineHeight: `${line.textBottom - line.textTop}px`,
      });
    }
    const full = first ? textOf(first.lines) : '';
    let started = false;
    return {
      render(l) {
        sel.update(l, ctx.duration - FADE_MS, ctx.duration);
        if (l < SELECT_MS) return;
        for (const m of items) {
          const settled = decodeSettled(l, m.total);
          setStyle(m.el, 'clip-path', revealPolygon(m.lines, settled, m.total));
          if (!started) live(m.el);
        }
        started = true;
        if (!first) return;
        const settled = decodeSettled(l, first.total);
        if (settled >= first.total) {
          text.setScramble('', 0, 0);
          return;
        }
        const at = locate(first.lines, settled + 1);
        if (!at) return;
        const glyphs = decodeGlyphs(full, l, ctx.seed);
        const lineEnd = at.lineStart + at.line.chars.length;
        text.setScramble(
          glyphs.slice(settled, lineEnd),
          first.x + at.line.chars[at.index].x,
          first.y + at.line.textTop,
        );
      },
      destroy() {
        sel.destroy();
        text.el.remove();
      },
    };
  },

  'resolve-lines'(ctx) {
    const sel = selection(ctx);
    const items = ctx.targets.map(measure);
    const rects = items.flatMap((m) =>
      m.lines.map((line) => ({
        x: m.x + line.left,
        y: m.y + line.textTop,
        width: line.right - line.left,
        height: line.textBottom - line.textTop,
      })),
    );
    const skel = createSkeleton(rects);
    skel.setOpacity(0);
    ctx.fx.append(skel.el);
    const count = Math.max(1, Math.round((ctx.duration - 350) / LINE_MS));
    const total = rects.length;
    let started = false;
    return {
      render(l) {
        sel.update(l, ctx.duration - FADE_MS, ctx.duration);
        skel.setOpacity(l < SELECT_MS ? 0 : ramp(l, SELECT_MS, 350));
        if (l < 350) return;
        const mapped = Math.floor((total * resolveLinesAt(l, count)) / count);
        let offset = 0;
        for (const m of items) {
          const shown = Math.min(Math.max(mapped - offset, 0), m.lines.length);
          setStyle(m.el, 'clip-path', lineReveal(m.lines, shown));
          if (!started) live(m.el);
          offset += m.lines.length;
        }
        started = true;
        skel.setVisibleBlocks(mapped);
      },
      destroy() {
        sel.destroy();
        skel.el.remove();
      },
    };
  },

  pop(ctx) {
    const sel = selection(ctx);
    const parts = ctx.targets.flatMap((t) => {
      const kids = [...t.children] as HTMLElement[];
      return (kids.length > 0 ? kids : [t]).map((el) => ({
        el,
        radius: radiusOf(el),
      }));
    });
    let started = false;
    return {
      render(l) {
        sel.update(l, ctx.duration - FADE_MS, ctx.duration);
        if (l < SELECT_MS) return;
        const p = popProgress(l);
        for (const part of parts) poof(part.el, p, part.radius);
        if (!started) {
          started = true;
          for (const t of ctx.targets) live(t);
        }
      },
      destroy() {
        sel.destroy();
        for (const part of parts) clear(part.el);
      },
    };
  },

  stagger(ctx) {
    const sel = selection(ctx);
    const chips = ctx.targets.flatMap((t) =>
      ([...t.querySelectorAll('li')] as HTMLElement[]).map((el, index) => ({
        el,
        index,
        radius: radiusOf(el.firstElementChild ?? el),
      })),
    );
    let started = false;
    return {
      render(l) {
        sel.update(l, ctx.duration - FADE_MS, ctx.duration);
        if (l < SELECT_MS) return;
        for (const chip of chips) {
          poof(chip.el, staggerChildProgress(l, chip.index), chip.radius);
        }
        if (!started) {
          started = true;
          for (const t of ctx.targets) live(t);
        }
      },
      destroy() {
        sel.destroy();
        for (const chip of chips) clear(chip.el);
      },
    };
  },

  'build-card'(ctx) {
    const sel = selection(ctx);
    const skel = createSkeleton(ctx.targets.map(docRect));
    skel.setOpacity(0);
    const text = createTextOverlay();
    ctx.fx.append(skel.el, text.el);
    const cells = ctx.targets.map((cell) => {
      const q = (s: string) => [...cell.querySelectorAll<HTMLElement>(s)];
      const titles = q('.sp-card-title, .sp-card-year').map(measure);
      const summary = q('.sp-card-summary').map(measure);
      const tags = [...q('.sp-card-tags > *'), ...q('.sp-card-foot')].map(
        (el) => ({ el, radius: radiusOf(el) }),
      );
      return { cell, titles, summary, tags };
    });
    let covered = false;
    return {
      render(l) {
        const phase = cardPhases(l);
        sel.update(l, 300, 450);
        skel.setOpacity(phase.skeleton ? 1 : 0);
        if (!phase.cover) return;
        if (!covered) {
          covered = true;
          for (const c of cells) {
            for (const m of [...c.titles, ...c.summary]) {
              setStyle(m.el, 'clip-path', HIDDEN_CLIP);
            }
            for (const part of c.tags) poof(part.el, 0, part.radius);
            live(c.cell);
          }
        }
        for (const c of cells) {
          for (const m of c.titles) {
            const shown = Math.floor(phase.title * m.total);
            setStyle(m.el, 'clip-path', revealPolygon(m.lines, shown, m.total));
          }
          for (const m of c.summary) {
            const shown = Math.floor(phase.summary * m.lines.length);
            setStyle(m.el, 'clip-path', lineReveal(m.lines, shown));
          }
          for (const part of c.tags) poof(part.el, phase.tags, part.radius);
        }
        const title = cells[0]?.titles[0];
        const caret =
          title && phase.title < 1
            ? caretOf(title, Math.floor(phase.title * title.total))
            : null;
        if (caret) text.setCaret(caret.x, caret.y, caret.height);
        else text.hideCaret();
      },
      destroy() {
        sel.destroy();
        skel.el.remove();
        text.el.remove();
        for (const c of cells) {
          for (const m of [...c.titles, ...c.summary]) clear(m.el);
          for (const part of c.tags) clear(part.el);
        }
      },
    };
  },
};

interface StepState {
  start: number;
  end: number;
  effect: EffectName;
  call: string;
  targets: HTMLElement[];
  mounted: Mounted | null;
  finished: boolean;
}

interface SectionRun {
  steps: StepState[];
}

export function createEffects(options: {
  sections: HTMLElement[];
  timelines: Timeline[];
  root: HTMLElement;
}): Effects {
  const { sections, timelines, root } = options;
  const fx = document.createElement('div');
  fx.className = 'sp-build-fx';
  fx.setAttribute('data-build-fx-layer', '');
  fx.setAttribute('aria-hidden', 'true');
  root.insertBefore(fx, root.firstChild);

  const sectionOf = new Map<SectionId, HTMLElement>();
  const timelineOf = new Map<SectionId, Timeline>();
  timelines.forEach((tl, i) => {
    sectionOf.set(tl.section, sections[i]);
    timelineOf.set(tl.section, tl);
  });
  const runs = new Map<SectionId, SectionRun>();
  const closed = new Set<SectionId>();

  const targetsIn = (section: HTMLElement) => [
    ...section.querySelectorAll<HTMLElement>('[data-build-target]'),
  ];

  const finishStep = (step: StepState) => {
    if (step.finished) return;
    step.finished = true;
    step.mounted?.destroy();
    step.mounted = null;
    for (const t of step.targets) clear(t);
  };

  const finishSection = (id: SectionId) => {
    const run = runs.get(id);
    if (run) for (const step of run.steps) finishStep(step);
    runs.delete(id);
    closed.add(id);
    const section = sectionOf.get(id);
    if (section) for (const t of targetsIn(section)) clear(t);
  };

  const init = (id: SectionId): SectionRun | null => {
    const section = sectionOf.get(id);
    const timeline = timelineOf.get(id);
    if (!section || !timeline) return null;
    finishSection(id);
    closed.delete(id);
    const all = targetsIn(section);
    for (const t of all) hide(t);
    const run: SectionRun = {
      steps: timeline.steps.map((step) => {
        const targets = all.filter(
          (t) => t.getAttribute('data-build-target') === step.target,
        );
        if (targets.length === 0) {
          throw new Error(
            `build target "${step.target}" is missing in #${section.id}`,
          );
        }
        return {
          start: step.start,
          end: step.end,
          effect: step.effect,
          call: step.call,
          targets,
          mounted: null,
          finished: false,
        };
      }),
    };
    runs.set(id, run);
    return run;
  };

  return {
    onState(id, state) {
      if (state === 'command') init(id);
      else if (state === 'closing' || state === 'done' || state === 'skipped') {
        finishSection(id);
      }
    },
    onTick(id, t) {
      if (closed.has(id)) return;
      const run = runs.get(id) ?? init(id);
      const timeline = timelineOf.get(id);
      if (!run || !timeline) return;
      for (const step of run.steps) {
        if (step.finished || t < step.start) continue;
        if (t >= step.end) {
          finishStep(step);
          continue;
        }
        step.mounted ??= RUNNERS[step.effect]({
          targets: step.targets,
          seed: hashSeed(`${timeline.section}:${step.call}`),
          duration: step.end - step.start,
          fx,
        });
        step.mounted.render(t - step.start);
      }
    },
    destroy() {
      for (const id of [...runs.keys()]) finishSection(id);
      for (const section of sections) {
        for (const t of targetsIn(section)) clear(t);
      }
      fx.remove();
    },
  };
}
