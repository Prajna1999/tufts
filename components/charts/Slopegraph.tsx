"use client";

import { useMemo, useState } from "react";
import * as d3 from "d3";

// ── Data ──────────────────────────────────────────────────────
interface Item {
  label: string;
  h1: number;
  h2: number;
  annotation?: string;
}

// Sorted by delta (descending) — Tufte: order reveals structure
const DATA: Item[] = [
  { label: "North", h1: 10, h2: 36, annotation: "Strongest growth" },
  { label: "South", h1: 22, h2: 7,  annotation: "Steepest decline" },
  { label: "East",  h1: 8,  h2: 8  },
  { label: "West",  h1: 5,  h2: 5  },
];

const W = 260;
const H = 300;
const PAD = { top: 36, right: 88, bottom: 28, left: 88 };

function lineColor(h1: number, h2: number) {
  if (h2 > h1) return "#1d7a5a";
  if (h2 < h1) return "#b84040";
  return "#86857c";
}

export default function Slopegraph() {
  const [hovered, setHovered] = useState<string | null>(null);

  const allVals = useMemo(() => DATA.flatMap((d) => [d.h1, d.h2]), []);

  const y = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, d3.max(allVals) as number])
        .range([H - PAD.bottom, PAD.top])
        .nice(),
    [allVals]
  );

  const xLeft = PAD.left;
  const xRight = W - PAD.right;

  // Readout for hovered item
  const hoveredItem = hovered ? DATA.find((d) => d.label === hovered) : null;
  const delta = hoveredItem ? hoveredItem.h2 - hoveredItem.h1 : null;
  const pct = hoveredItem && delta !== null
    ? Math.round((delta / hoveredItem.h1) * 100)
    : null;

  return (
    <div className="font-serif max-w-xs mx-auto px-6 py-8 text-[#33332e] bg-[#fbfbf8]">
      <h2 className="text-xl font-medium mb-1">H1 → H2 by region</h2>
      <p className="text-[13px] text-[#86857c] mb-3 leading-relaxed">
        Slopegraph · shared scale · ordered by delta · direct annotation
      </p>

      {/* ── Micro readout ─────────────────────────────────────── */}
      <div className="h-6 mb-4 text-[12px] text-[#33332e] tabular-nums">
        {hoveredItem && delta !== null && pct !== null ? (
          <span>
            <span className="font-medium">{hoveredItem.label}</span>
            <span className="text-[#86857c]"> · H1 </span>
            <span className="font-medium">{hoveredItem.h1}k</span>
            <span className="text-[#86857c]"> → H2 </span>
            <span className="font-medium">{hoveredItem.h2}k</span>
            <span style={{ color: lineColor(hoveredItem.h1, hoveredItem.h2) }}>
              {" "}({delta > 0 ? "+" : ""}{pct}%)
            </span>
          </span>
        ) : (
          <span className="text-[#c0bfb8] italic text-[11px]">
            Hover a slope to read the change
          </span>
        )}
      </div>

      <svg
        width={W}
        height={H}
        role="img"
        aria-label="Slopegraph comparing H1 and H2 sales by region"
        style={{ overflow: "visible" }}
      >
        {/* Period headers */}
        <text x={xLeft} y={22} textAnchor="middle" fontSize={11} fontWeight={600} fill="#33332e">H1</text>
        <text x={xRight} y={22} textAnchor="middle" fontSize={11} fontWeight={600} fill="#33332e">H2</text>

        {/* Spine — muted reference columns */}
        <line x1={xLeft}  x2={xLeft}  y1={PAD.top} y2={H - PAD.bottom} stroke="#e5e5e0" strokeWidth={1} />
        <line x1={xRight} x2={xRight} y1={PAD.top} y2={H - PAD.bottom} stroke="#e5e5e0" strokeWidth={1} />

        {DATA.map(({ label, h1, h2, annotation }) => {
          const color = lineColor(h1, h2);
          const y1 = y(h1);
          const y2 = y(h2);
          const isHovered = hovered === label;
          const isOther = hovered !== null && !isHovered;

          return (
            <g key={label}>
              {/* Invisible wide hit target on the slope */}
              <line
                x1={xLeft} y1={y1} x2={xRight} y2={y2}
                stroke="transparent" strokeWidth={12}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(label)}
                onMouseLeave={() => setHovered(null)}
              />

              {/* Slope line — dims when another is hovered */}
              <line
                x1={xLeft} y1={y1} x2={xRight} y2={y2}
                stroke={color}
                strokeWidth={isHovered ? 2.25 : 1.5}
                opacity={isOther ? 0.18 : isHovered ? 1 : 0.82}
                style={{ pointerEvents: "none", transition: "opacity 120ms ease, stroke-width 80ms ease" }}
              />

              {/* Endpoints */}
              <circle cx={xLeft}  cy={y1} r={isHovered ? 4 : 3} fill={color}
                opacity={isOther ? 0.18 : 1} style={{ pointerEvents: "none" }} />
              <circle cx={xRight} cy={y2} r={isHovered ? 4 : 3} fill={color}
                opacity={isOther ? 0.18 : 1} style={{ pointerEvents: "none" }} />

              {/* Left: region name + H1 value */}
              <text x={xLeft - 8} y={y1 + 4} textAnchor="end" fontSize={10}
                fill="#33332e" opacity={isOther ? 0.25 : 1}
                style={{ pointerEvents: "none" }}>
                {label}
              </text>
              <text x={xLeft - 8} y={y1 + 15} textAnchor="end" fontSize={9}
                fill={color} opacity={isOther ? 0.18 : 0.85}
                style={{ fontVariantNumeric: "tabular-nums", pointerEvents: "none" }}>
                {h1}k
              </text>

              {/* Right: H2 value */}
              <text x={xRight + 8} y={y2 + 4} textAnchor="start" fontSize={10}
                fill={color} opacity={isOther ? 0.18 : 1}
                style={{ fontVariantNumeric: "tabular-nums", pointerEvents: "none" }}>
                {h2}k
              </text>

              {/* Annotation — appears mid-slope, italic, only when hovered or always if present */}
              {annotation && isHovered && (
                <text
                  x={(xLeft + xRight) / 2}
                  y={(y1 + y2) / 2 - 8}
                  textAnchor="middle"
                  fontSize={8}
                  fill={color}
                  fontStyle="italic"
                  style={{ pointerEvents: "none" }}
                >
                  {annotation}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Compact direction key — direct labels make legend redundant, but direction coding needs a key */}
      <div className="flex gap-4 mt-1 text-[10px] text-[#86857c]">
        <span><span className="inline-block w-2 h-0.5 bg-[#1d7a5a] mr-1 align-middle" />Up</span>
        <span><span className="inline-block w-2 h-0.5 bg-[#b84040] mr-1 align-middle" />Down</span>
        <span><span className="inline-block w-2 h-0.5 bg-[#86857c] mr-1 align-middle" />Flat</span>
      </div>
    </div>
  );
}
