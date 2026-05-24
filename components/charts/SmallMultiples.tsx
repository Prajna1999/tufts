"use client";

import React, { useState, useMemo } from "react";
import * as d3 from "d3";

// ── Data ──────────────────────────────────────────────────────
const DATA: Record<string, number[]> = {
  North: [10, 12, 14, 15, 18, 20, 23, 25, 28, 30, 33, 36],
  South: [22, 21, 22, 20, 19, 18, 16, 15, 13, 11, 9, 7],
  East:  [8, 9, 11, 14, 28, 30, 12, 11, 10, 9, 9, 8],
  West:  [5, 5, 6, 5, 6, 5, 5, 6, 5, 5, 6, 5],
};

const MONTHS = ["J","F","M","A","M","J","J","A","S","O","N","D"];

// ── Annotations — one per panel, keyed by region ──────────────
// startIndex/endIndex are month indices (0–11); label sits above the bracket.
interface Annotation {
  startIndex: number;
  endIndex: number;
  label: string;
}

const ANNOTATIONS: Record<string, Annotation> = {
  East: { startIndex: 4, endIndex: 5, label: "Trade show" },
};

// ── Panel geometry ────────────────────────────────────────────
const W = 240;
const H = 130;
const PAD = { top: 22, right: 48, bottom: 20, left: 8 };

const COLOR = "#1d7a5a";

// ── Ink layer types ───────────────────────────────────────────
interface InkLayers {
  gridlines: boolean;
  tickLabels: boolean;
  monthLabels: boolean;
}

// ── Panel ─────────────────────────────────────────────────────
interface PanelProps {
  region: string;
  series: number[];
  yScale: d3.ScaleLinear<number, number>;
  ink: InkLayers;
  annotation?: Annotation;
}

function Panel({ region, series, yScale, ink, annotation }: PanelProps) {
  const x = useMemo(
    () => d3.scaleLinear().domain([0, 11]).range([PAD.left, W - PAD.right]),
    []
  );

  const lineFn = useMemo(
    () =>
      d3
        .line<number>()
        .x((_d, i) => x(i))
        .y((d) => yScale(d))
        .curve(d3.curveMonotoneX),
    [x, yScale]
  );

  const lastVal = series[series.length - 1];
  const gridTicks = yScale.ticks(3);

  // Annotation geometry — bracket sits 6px above the higher of the two annotated points
  const annotationEl = useMemo(() => {
    if (!annotation) return null;
    const { startIndex, endIndex, label } = annotation;
    const x1 = x(startIndex);
    const x2 = x(endIndex);
    const peakY = Math.min(
      ...series.slice(startIndex, endIndex + 1).map((v) => yScale(v))
    );
    const bracketY = peakY - 10;
    const midX = (x1 + x2) / 2;
    return { x1, x2, bracketY, midX, label };
  }, [annotation, x, yScale, series]);

  return (
    <svg
      width={W}
      height={H}
      role="img"
      aria-label={`${region} monthly sales trend`}
      style={{ overflow: "visible" }}
    >
      {/* Gridlines — context layer, removable */}
      {ink.gridlines &&
        gridTicks.map((t) => (
          <line
            key={t}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={yScale(t)}
            y2={yScale(t)}
            stroke="#e5e5e0"
            strokeWidth={1}
          />
        ))}

      {/* Tick labels — removable */}
      {ink.tickLabels &&
        gridTicks.map((t) => (
          <text
            key={t}
            x={W - PAD.right + 4}
            y={yScale(t) + 3}
            fontSize={9}
            fill="#b0b0a8"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {t}
          </text>
        ))}

      {/* Month labels — removable */}
      {ink.monthLabels &&
        MONTHS.map((m, i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 4}
            fontSize={8}
            fill="#c0bfb8"
            textAnchor="middle"
          >
            {m}
          </text>
        ))}

      {/* Signal line — never removed */}
      <path
        d={lineFn(series) ?? ""}
        fill="none"
        stroke={COLOR}
        strokeWidth={1.75}
      />

      {/* Direct end-of-line label */}
      <circle cx={x(11)} cy={yScale(lastVal)} r={2.5} fill={COLOR} />
      <text
        x={x(11) + 6}
        y={yScale(lastVal) + 4}
        fontSize={10}
        fontWeight={500}
        fill={COLOR}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {lastVal}
      </text>

      {/* Region label */}
      <text x={PAD.left} y={13} fontSize={12} fontWeight={600} fill="#33332e">
        {region}
      </text>

      {/* Annotation bracket + label — rendered directly on the data, no tooltip */}
      {annotationEl && (
        <g>
          {/* Horizontal bracket */}
          <line
            x1={annotationEl.x1} x2={annotationEl.x2}
            y1={annotationEl.bracketY} y2={annotationEl.bracketY}
            stroke="#86857c" strokeWidth={1}
          />
          {/* Left serif */}
          <line
            x1={annotationEl.x1} x2={annotationEl.x1}
            y1={annotationEl.bracketY} y2={annotationEl.bracketY + 4}
            stroke="#86857c" strokeWidth={1}
          />
          {/* Right serif */}
          <line
            x1={annotationEl.x2} x2={annotationEl.x2}
            y1={annotationEl.bracketY} y2={annotationEl.bracketY + 4}
            stroke="#86857c" strokeWidth={1}
          />
          {/* Label sits above bracket midpoint */}
          <text
            x={annotationEl.midX}
            y={annotationEl.bracketY - 4}
            textAnchor="middle"
            fontSize={8}
            fill="#86857c"
            fontStyle="italic"
          >
            {annotationEl.label}
          </text>
        </g>
      )}
    </svg>
  );
}

// ── Root component ────────────────────────────────────────────
export default function SmallMultiples() {
  const [shared, setShared] = useState(true);
  const [ink, setInk] = useState<InkLayers>({
    gridlines: true,
    tickLabels: true,
    monthLabels: true,
  });

  const allValues = useMemo(() => Object.values(DATA).flat(), []);

  const sharedY = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, d3.max(allValues) as number])
        .range([H - PAD.bottom, PAD.top])
        .nice(),
    [allValues]
  );

  const toggleInk = (layer: keyof InkLayers) =>
    setInk((prev) => ({ ...prev, [layer]: !prev[layer] }));

  const inkCount = Object.values(ink).filter(Boolean).length;

  return (
    <div className="font-serif max-w-[560px] mx-auto px-6 py-8 text-[#33332e] bg-[#fbfbf8]">
      <h2 className="text-xl font-medium mb-1">Monthly sales by region</h2>
      <p className="text-[13px] text-[#86857c] mb-5 leading-relaxed">
        Small multiples · direct labeling · locked scale · layered context
      </p>

      <div className="grid grid-cols-2 gap-x-2 gap-y-5">
        {Object.entries(DATA).map(([region, series]) => {
          const perPanelY = d3
            .scaleLinear()
            .domain([0, d3.max(series) as number])
            .range([H - PAD.bottom, PAD.top])
            .nice();

          return (
            <Panel
              key={region}
              region={region}
              series={series}
              yScale={shared ? sharedY : perPanelY}
              ink={ink}
              annotation={ANNOTATIONS[region]}
            />
          );
        })}
      </div>

      {/* ── Teaching controls ───────────────────────────────── */}
      <div className="mt-6 pt-5 border-t border-[#e5e5e0] space-y-4">

        {/* Scale lock */}
        <div>
          <label className="flex items-center gap-2 text-[13px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={shared}
              onChange={(e) => setShared(e.target.checked)}
            />
            Lock all panels to one shared scale (Tufte)
          </label>
          <p className="text-[11px] text-[#86857c] mt-1 leading-relaxed pl-5">
            {shared
              ? "Locked: West really is flat and low. Shapes are directly comparable."
              : "Unlocked: West looks as tall as North — the comparison lies. Lie Factor problem."}
          </p>
        </div>

        {/* Data-ink ratio controls */}
        <div>
          <p className="text-[12px] font-medium mb-2">
            Data-ink ratio — strip non-data ink layer by layer
          </p>
          <div className="flex gap-5">
            {(["gridlines", "tickLabels", "monthLabels"] as const).map((layer) => (
              <label key={layer} className="flex items-center gap-1.5 text-[12px] cursor-pointer select-none text-[#86857c]">
                <input
                  type="checkbox"
                  checked={ink[layer]}
                  onChange={() => toggleInk(layer)}
                />
                {layer === "gridlines" ? "Gridlines" : layer === "tickLabels" ? "Tick labels" : "Month labels"}
              </label>
            ))}
          </div>
          <p className="text-[11px] text-[#86857c] mt-2 leading-relaxed">
            {inkCount === 3 && "All context layers on. Remove them one by one to find the minimum viable ink."}
            {inkCount === 2 && "One layer removed. The chart still reads — that ink was redundant."}
            {inkCount === 1 && "Two layers gone. How much context can you lose before comparison breaks?"}
            {inkCount === 0 && "No context ink. Pure signal — but can you still answer 'compared to what?'"}
          </p>
        </div>
      </div>
    </div>
  );
}
