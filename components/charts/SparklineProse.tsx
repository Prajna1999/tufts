"use client";

import { useMemo } from "react";
import * as d3 from "d3";

// ── Data ──────────────────────────────────────────────────────
const REGIONS = {
  North: [10, 12, 14, 15, 18, 20, 23, 25, 28, 30, 33, 36],
  South: [22, 21, 22, 20, 19, 18, 16, 15, 13, 11, 9, 7],
  East:  [8, 9, 11, 14, 28, 30, 12, 11, 10, 9, 9, 8],
  West:  [5, 5, 6, 5, 6, 5, 5, 6, 5, 5, 6, 5],
};

// ── Word-sized sparkline ──────────────────────────────────────
// Sits inline with text: same cap-height, no axes, no padding.
const SW = 52;
const SH = 14;

interface InlineSparkProps {
  values: number[];
  // optional: highlight the peak or trough with a dot
  mark?: "peak" | "trough";
}

function InlineSpark({ values, mark }: InlineSparkProps) {
  const x = useMemo(
    () => d3.scaleLinear().domain([0, values.length - 1]).range([1, SW - 1]),
    [values.length]
  );
  const y = useMemo(
    () => d3.scaleLinear()
      .domain([d3.min(values) as number, d3.max(values) as number])
      .range([SH - 1, 1]),
    [values]
  );
  const lineFn = useMemo(
    () =>
      d3.line<number>()
        .x((_d, i) => x(i))
        .y((d) => y(d))
        .curve(d3.curveMonotoneX),
    [x, y]
  );

  const last  = values[values.length - 1];
  const first = values[0];
  const trend = last > first ? "#1d7a5a" : last < first ? "#b84040" : "#86857c";

  let markIndex: number | null = null;
  if (mark === "peak")   markIndex = values.indexOf(d3.max(values) as number);
  if (mark === "trough") markIndex = values.indexOf(d3.min(values) as number);

  return (
    // display:inline-block so it sits on the text baseline
    <svg
      width={SW}
      height={SH}
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle", marginBottom: 2 }}
    >
      <path d={lineFn(values) ?? ""} fill="none" stroke={trend} strokeWidth={1.25} />
      {markIndex !== null && (
        <circle
          cx={x(markIndex)}
          cy={y(values[markIndex])}
          r={2}
          fill={mark === "peak" ? "#1d7a5a" : "#b84040"}
        />
      )}
    </svg>
  );
}

// ── Derived summaries (computed once, used in prose) ──────────
function summary(values: number[]) {
  const first = values[0];
  const last  = values[values.length - 1];
  const delta = last - first;
  const pct   = Math.round(Math.abs(delta / first) * 100);
  const peak  = d3.max(values) as number;
  const trough = d3.min(values) as number;
  return { first, last, delta, pct, peak, trough };
}

// ── Root component ────────────────────────────────────────────
export default function SparklineProse() {
  const n = summary(REGIONS.North);
  const s = summary(REGIONS.South);
  const e = summary(REGIONS.East);
  const w = summary(REGIONS.West);

  return (
    <div className="font-serif max-w-[520px] mx-auto px-6 py-8 text-[#33332e] bg-[#fbfbf8]">
      <h2 className="text-xl font-medium mb-1">Annual sales in review</h2>
      <p className="text-[13px] text-[#86857c] mb-6 leading-relaxed">
        Sparkline prose · chart as word · no axes · no interaction
      </p>

      {/* ── The prose ─────────────────────────────────────────── */}
      <p className="text-[15px] leading-[2] text-[#33332e]">
        {/* North */}
        <strong>North</strong> grew {n.pct}% over the year&nbsp;
        <InlineSpark values={REGIONS.North} />,
        finishing at {n.last}k — the strongest result across all regions.{" "}

        {/* South */}
        <strong>South</strong> contracted by {s.pct}%&nbsp;
        <InlineSpark values={REGIONS.South} mark="trough" />,
        falling from {s.first}k to {s.last}k with no sign of recovery in the
        final quarter.{" "}

        {/* East */}
        <strong>East</strong> spiked to {e.peak}k mid-year&nbsp;
        <InlineSpark values={REGIONS.East} mark="peak" />,
        driven by a trade-show effect in May–June, before retreating to {e.last}k
        — nearly where it started.{" "}

        {/* West */}
        <strong>West</strong> held flat throughout&nbsp;
        <InlineSpark values={REGIONS.West} />,
        ranging only {w.trough}–{w.peak}k across all twelve months.
      </p>

      {/* ── Tufte note ────────────────────────────────────────── */}
      <p className="text-[11px] text-[#86857c] mt-6 leading-relaxed border-t border-[#e5e5e0] pt-4">
        Each inline chart is {SW}×{SH}px — word-sized. The line encodes the full
        twelve-month sequence; the dot marks the extreme. No axes, no labels, no
        interaction. The words carry the meaning; the shape confirms it.
        Tufte calls these &ldquo;data words.&rdquo;
      </p>
    </div>
  );
}
