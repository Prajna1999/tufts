@AGENTS.md

# CLAUDE.md — Tufte-grade data visualization for this Next.js app

This file tells Claude Code how to build charts in this project. The goal is
**information-dense, honest, non-bland** visualizations grounded in Edward
Tufte's four books. Decoration is not the goal; revealing structure in data is.

---

## Core philosophy

"Non-bland" does **not** mean more decoration. It means higher information
density and revealing structure. A bar chart is bland because it shows almost
nothing per unit of space — not because it lacks ornament. Flashy ≠ good;
most flashy chart styling is what Tufte calls *chartjunk*.

Every chart must answer Tufte's recurring question: **"Compared to what?"**
If a chart doesn't enable a comparison, reconsider it.

---

## The five principles (apply to every chart)

1. **Small multiples** — the same chart repeated across one variable, on
   **identical, locked scales**, laid in a grid. Highest-leverage idea. Lets
   the eye compare patterns across categories *in parallel*.
2. **Direct labeling** — put the label on the line/point itself. Kill legends
   and the cross-referencing they force.
3. **Layering via visual hierarchy** — muted context in the background (light
   gray gridlines), dark signal in the foreground.
4. **High data density** — show more per pixel; trust the viewer to scan.
   Sparklines are the extreme case (word-sized charts).
5. **Graphical integrity** — the representation must be proportional to the
   numbers (low "Lie Factor"). See the locked-scale rule below.

---

## NON-NEGOTIABLE: lock your scales

The single most common way to ship a *lying* chart is to let each panel
auto-scale to its own data.

- **Shared/locked scale** (every panel uses the max of ALL data) → shapes are
  directly comparable → honest.
- **Per-panel scale** (each panel uses its own max) → a flat, low series gets
  stretched to fill its panel and looks like a dramatic trend → lies.

Example: a region flat at ~5 across a year, given its own `[0, 6]` axis, turns
1 unit of noise into a full-height "mountain." On the shared `[0, 36]` axis it
correctly reads as flat. **Always derive shared scales from the combined
dataset**, not per-series.

---

## Chart selection — decision rule

The **shape of the data** picks the chart, not aesthetics:

| Data shape | Question it answers | Chart |
|---|---|---|
| Many items, one metric over time | "compare the patterns" | **Small multiples** |
| Many points over time, many rows | "trend next to the number" | **Sparklines** |
| Two time points, per item | "who rose and who fell?" | **Slopegraph** |
| Two continuous variables | "is there correlation?" | **Range-frame scatter** |

Disambiguating tells:
- Only **two** time points → slopegraph, NOT sparklines (a sparkline needs a
  *sequence* to trace; two points is just one segment with no shared scale).
- Comparing *shapes* of many series → small multiples, NOT one crowded chart.

---

## React + D3 architecture rule

**React owns the DOM. D3 owns the math.**

- Use D3 ONLY for scales and shape generators (`d3.scaleLinear`, `d3.line`,
  `d3.max`, …) — these are pure functions, no DOM.
- Let **React render** every `<svg>`, `<path>`, `<circle>`, `<text>`.
- NEVER use `d3.select().append()` inside a React component — that makes D3 and
  React fight over the DOM. This is the classic mistake.

```jsx
// D3 = math (pure, no DOM)
const x = d3.scaleLinear().domain([0, n - 1]).range([pad, w - pad]);
const y = d3.scaleLinear().domain([0, d3.max(allValues)]).range([h - pad, pad]);
const line = d3.line().x((d, i) => x(i)).y((d) => y(d));

// React = DOM (renders the marks)
return <svg width={w} height={h}><path d={line(series)} /></svg>;
```

### Next.js specifics
- Chart components are **client components** — add `"use client"` at the top
  (they use `useState`/`useMemo` and render interactive SVG).
- Keep data fetching in Server Components / route handlers; pass plain data
  down as props. The D3-math/React-DOM split is unchanged whether data is
  hardcoded or fetched.
- Memoize scales with `useMemo` keyed on the data so they don't rebuild every
  render.
- Install: `npm i d3` and `npm i -D @types/d3` (TypeScript).

---

## Styling defaults (refined minimalism, NOT maximalism)

- Signal color: a single strong hue (e.g. `#1d7a5a`). Use red/green ONLY to
  encode direction of change (up = green, down = red), never decoratively.
- Gridlines / context: light gray (`#e5e5e0`), thin (1px).
- Axis & helper text: muted gray (`#86857c`), 9–11px.
- Numbers: `font-variant-numeric: tabular-nums` so digits align.
- Round every displayed number. Sentence case for all labels.
- Restraint is the aesthetic. Whitespace over borders; erase non-data ink.

---

## Reference implementations

Four working patterns are included as files in this project (copy/adapt):

- `components/charts/SmallMultiples.tsx` — locked-scale grid of line panels,
  direct end-of-line value labels, layered gridlines. Includes a dev-only
  toggle to demonstrate the shared-vs-per-panel-scale lie.
- `components/charts/Sparklines.tsx` — table rows with word-sized inline trend
  lines next to the current value and the change.
- `components/charts/RangeFrameScatter.tsx` — scatter whose axis lines span
  only the data's min–max, with marginal dot-dash ticks projecting each point
  onto both axes (data-ink ratio made literal).
- `components/charts/Slopegraph.tsx` — two-period comparison; one line per
  item on a shared scale, direct-labeled at both ends, colored by direction.

(If these files are not yet present, generate them following the architecture
and styling rules above. The canonical SmallMultiples implementation lives in
`TufteSmallMultiples.jsx` from the design session — port it to TSX.)

---

## Build checklist (run through before shipping any chart)

- [ ] Does it answer "compared to what?"
- [ ] Are all scales **locked/shared** across panels (no per-panel auto-scale)?
- [ ] Are labels **direct** (on the data), with legends removed?
- [ ] Is context **muted** and signal **dark/strong**?
- [ ] Did I pick the chart from the **data shape**, not by habit?
- [ ] Is it a **client component** with memoized D3 scales?
- [ ] Are numbers rounded and labels sentence-case?
