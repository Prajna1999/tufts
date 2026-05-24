"use client";

import { useMemo, useState } from "react";
import * as d3 from "d3";

// ── Data ──────────────────────────────────────────────────────
interface Row {
  label: string;
  values: number[];
  unit?: string;
  annotation?: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const ROWS: Row[] = [
  { label: "North", values: [10,12,14,15,18,20,23,25,28,30,33,36], unit: "k", annotation: "Consistent growth all year" },
  { label: "South", values: [22,21,22,20,19,18,16,15,13,11,9,7],   unit: "k", annotation: "Decline accelerating since Apr" },
  { label: "East",  values: [8,9,11,14,28,30,12,11,10,9,9,8],      unit: "k", annotation: "Trade show spike, May–Jun" },
  { label: "West",  values: [5,5,6,5,6,5,5,6,5,5,6,5],             unit: "k" },
];

// ── Sparkline geometry (word-sized) ───────────────────────────
const SW = 80;
const SH = 20;
const SPAD = 2;

interface SparklineProps {
  values: number[];
  // highlight index for micro readout
  highlightIndex: number | null;
}

function Sparkline({ values, highlightIndex }: SparklineProps) {
  const x = useMemo(
    () => d3.scaleLinear().domain([0, values.length - 1]).range([SPAD, SW - SPAD]),
    [values.length]
  );
  const y = useMemo(
    () => d3.scaleLinear()
      .domain([0, d3.max(values) as number])
      .range([SH - SPAD, SPAD]),
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

  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const color = last > prev ? "#1d7a5a" : last < prev ? "#b84040" : "#86857c";

  return (
    <svg width={SW} height={SH} aria-hidden="true" style={{ overflow: "visible" }}>
      <path d={lineFn(values) ?? ""} fill="none" stroke={color} strokeWidth={1.25} />
      {/* End dot */}
      <circle cx={x(values.length - 1)} cy={y(last)} r={1.75} fill={color} />
      {/* Highlight crosshair — follows micro readout */}
      {highlightIndex !== null && (
        <>
          <line
            x1={x(highlightIndex)} x2={x(highlightIndex)}
            y1={SPAD} y2={SH - SPAD}
            stroke="#c0bfb8" strokeWidth={1} strokeDasharray="2,2"
          />
          <circle
            cx={x(highlightIndex)}
            cy={y(values[highlightIndex])}
            r={2}
            fill={color}
          />
        </>
      )}
    </svg>
  );
}

// ── Root component ────────────────────────────────────────────
export default function Sparklines() {
  // Micro readout state — {rowLabel, monthIndex} or null
  const [readout, setReadout] = useState<{ label: string; index: number } | null>(null);

  const readoutRow = readout ? ROWS.find((r) => r.label === readout.label) : null;
  const readoutValue = readoutRow && readout ? readoutRow.values[readout.index] : null;

  return (
    <div className="font-serif max-w-lg mx-auto px-6 py-8 text-[#33332e] bg-[#fbfbf8]">
      <h2 className="text-xl font-medium mb-1">Sales summary</h2>
      <p className="text-[13px] text-[#86857c] mb-3 leading-relaxed">
        Sparklines · table-as-chart · annotation on data · micro/macro reading
      </p>

      {/* ── Micro readout — fixed scoreboard, never a tooltip ── */}
      <div className="h-6 mb-4 text-[12px] text-[#33332e] tabular-nums">
        {readout && readoutValue !== null ? (
          <span>
            <span className="font-medium">{readout.label}</span>
            <span className="text-[#86857c]"> · {MONTHS[readout.index]} · </span>
            <span className="font-medium">{readoutValue}k</span>
          </span>
        ) : (
          <span className="text-[#c0bfb8] italic text-[11px]">
            Hover a row to read a month
          </span>
        )}
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#e5e5e0]">
            <th className="text-left text-[10px] text-[#86857c] font-normal pb-1 pr-3 uppercase tracking-wide w-16">Region</th>
            <th className="text-left text-[10px] text-[#86857c] font-normal pb-1 pr-3 uppercase tracking-wide">12 mo</th>
            <th className="text-right text-[10px] text-[#86857c] font-normal pb-1 pr-3 uppercase tracking-wide w-12">Now</th>
            <th className="text-right text-[10px] text-[#86857c] font-normal pb-1 pr-3 uppercase tracking-wide w-12">Δ yr</th>
            <th className="text-left text-[10px] text-[#86857c] font-normal pb-1 uppercase tracking-wide">Note</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ label, values, unit, annotation }) => {
            const last = values[values.length - 1];
            const first = values[0];
            const delta = last - first;
            const pct = Math.round((delta / first) * 100);
            const up = delta > 0;
            const flat = delta === 0;
            const changeColor = flat ? "#86857c" : up ? "#1d7a5a" : "#b84040";
            const sign = delta > 0 ? "+" : "";

            // For the hover zone we divide the sparkline width into 12 buckets
            const handleMouseMove = (e: React.MouseEvent<HTMLTableCellElement>) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const relX = e.clientX - rect.left;
              const index = Math.min(
                11,
                Math.max(0, Math.round((relX / rect.width) * 11))
              );
              setReadout({ label, index });
            };

            return (
              <tr
                key={label}
                className="border-b border-[#f0f0ec] hover:bg-[#f5f5f2] transition-colors"
                onMouseLeave={() => setReadout(null)}
              >
                <td className="py-2 pr-3 text-[12px] font-medium">{label}</td>
                <td
                  className="py-2 pr-3 cursor-crosshair"
                  onMouseMove={handleMouseMove}
                >
                  <Sparkline
                    values={values}
                    highlightIndex={readout?.label === label ? readout.index : null}
                  />
                </td>
                <td className="py-2 pr-3 text-right text-[13px] tabular-nums font-medium">
                  {last}{unit}
                </td>
                <td
                  className="py-2 pr-3 text-right text-[11px] tabular-nums"
                  style={{ color: changeColor }}
                >
                  {sign}{pct}%
                </td>
                {/* Annotation — directly in the table row, no tooltip */}
                <td className="py-2 text-[10px] text-[#86857c] italic leading-tight max-w-[120px]">
                  {annotation ?? ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
