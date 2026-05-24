"use client";

import { useMemo, useState } from "react";
import * as d3 from "d3";

// ── Data ──────────────────────────────────────────────────────
interface Point {
  label: string;
  region: string;
  quarter: string;
  x: number;
  y: number;
  annotation?: string;
}

const DATA: Point[] = [
  { label: "N-Q1", region: "North", quarter: "Q1", x: 12, y: 10 },
  { label: "N-Q2", region: "North", quarter: "Q2", x: 18, y: 20 },
  { label: "N-Q3", region: "North", quarter: "Q3", x: 25, y: 28 },
  { label: "N-Q4", region: "North", quarter: "Q4", x: 30, y: 36 },
  { label: "S-Q1", region: "South", quarter: "Q1", x: 20, y: 22 },
  { label: "S-Q2", region: "South", quarter: "Q2", x: 16, y: 18 },
  { label: "S-Q3", region: "South", quarter: "Q3", x: 11, y: 13 },
  { label: "S-Q4", region: "South", quarter: "Q4", x: 8,  y: 7  },
  { label: "E-Q1", region: "East",  quarter: "Q1", x: 9,  y: 8  },
  { label: "E-Q2", region: "East",  quarter: "Q2", x: 22, y: 28, annotation: "Trade show" },
  { label: "E-Q3", region: "East",  quarter: "Q3", x: 14, y: 12 },
  { label: "E-Q4", region: "East",  quarter: "Q4", x: 7,  y: 8  },
  { label: "W-Q1", region: "West",  quarter: "Q1", x: 5,  y: 5  },
  { label: "W-Q2", region: "West",  quarter: "Q2", x: 6,  y: 6  },
  { label: "W-Q3", region: "West",  quarter: "Q3", x: 5,  y: 5  },
  { label: "W-Q4", region: "West",  quarter: "Q4", x: 6,  y: 5  },
];

// ── Geometry ──────────────────────────────────────────────────
const W = 340;
const H = 280;
const PAD = { top: 20, right: 24, bottom: 44, left: 44 };
const COLOR = "#1d7a5a";

// ── Ink layers ────────────────────────────────────────────────
interface InkLayers {
  gridlines: boolean;
  marginalTicks: boolean;
}

export default function RangeFrameScatter() {
  const [hovered, setHovered] = useState<Point | null>(null);
  const [ink, setInk] = useState<InkLayers>({ gridlines: true, marginalTicks: true });

  const xs = useMemo(() => DATA.map((d) => d.x), []);
  const ys = useMemo(() => DATA.map((d) => d.y), []);

  const xMin = d3.min(xs) as number;
  const xMax = d3.max(xs) as number;
  const yMin = d3.min(ys) as number;
  const yMax = d3.max(ys) as number;

  const x = useMemo(
    () => d3.scaleLinear().domain([xMin, xMax]).range([PAD.left, W - PAD.right]).nice(),
    [xMin, xMax]
  );
  const y = useMemo(
    () => d3.scaleLinear().domain([yMin, yMax]).range([H - PAD.bottom, PAD.top]).nice(),
    [yMin, yMax]
  );

  const xTicks = x.ticks(5);
  const yTicks = y.ticks(5);
  const xAxisY = H - PAD.bottom;
  const yAxisX = PAD.left;

  // Annotation leader: offset label away from the point to avoid overlap
  function annotationOffset(pt: Point): { dx: number; dy: number } {
    // E-Q2 is upper-right cluster — push label up-right
    return { dx: 8, dy: -14 };
  }

  const toggleInk = (layer: keyof InkLayers) =>
    setInk((prev) => ({ ...prev, [layer]: !prev[layer] }));

  return (
    <div className="font-serif max-w-lg mx-auto px-6 py-8 text-[#33332e] bg-[#fbfbf8]">
      <h2 className="text-xl font-medium mb-1">Spend vs revenue</h2>
      <p className="text-[13px] text-[#86857c] mb-3 leading-relaxed">
        Range-frame scatter · marginal ticks · direct annotation · micro readout
      </p>

      {/* ── Micro readout — fixed scoreboard ─────────────────── */}
      <div className="h-6 mb-4 text-[12px] text-[#33332e] tabular-nums">
        {hovered ? (
          <span>
            <span className="font-medium">{hovered.region} {hovered.quarter}</span>
            <span className="text-[#86857c]"> · spend </span>
            <span className="font-medium">{hovered.x}k</span>
            <span className="text-[#86857c]"> · revenue </span>
            <span className="font-medium">{hovered.y}k</span>
            <span className="text-[#86857c]"> · ratio </span>
            <span className="font-medium">{(hovered.y / hovered.x).toFixed(2)}</span>
          </span>
        ) : (
          <span className="text-[#c0bfb8] italic text-[11px]">
            Hover a point to read exact values
          </span>
        )}
      </div>

      <svg
        width={W}
        height={H}
        role="img"
        aria-label="Scatter plot of marketing spend vs revenue"
        style={{ overflow: "visible" }}
      >
        {/* Gridlines — removable context layer */}
        {ink.gridlines && yTicks.map((t) => (
          <line key={`gy-${t}`} x1={PAD.left} x2={W - PAD.right}
            y1={y(t)} y2={y(t)} stroke="#e5e5e0" strokeWidth={1} />
        ))}
        {ink.gridlines && xTicks.map((t) => (
          <line key={`gx-${t}`} x1={x(t)} x2={x(t)}
            y1={PAD.top} y2={H - PAD.bottom} stroke="#e5e5e0" strokeWidth={1} />
        ))}

        {/* Range-frame axes — span data min→max only, never removed */}
        <line x1={x(xMin)} x2={x(xMax)} y1={xAxisY} y2={xAxisY} stroke="#86857c" strokeWidth={1} />
        <line x1={yAxisX} x2={yAxisX} y1={y(yMin)} y2={y(yMax)} stroke="#86857c" strokeWidth={1} />

        {/* Marginal ticks — removable; teach that they replace gridlines */}
        {ink.marginalTicks && DATA.map((d) => (
          <g key={`tick-${d.label}`}>
            <line x1={x(d.x)} x2={x(d.x)} y1={xAxisY - 3} y2={xAxisY + 3}
              stroke={COLOR} strokeWidth={1} opacity={0.45} />
            <line x1={yAxisX - 3} x2={yAxisX + 3} y1={y(d.y)} y2={y(d.y)}
              stroke={COLOR} strokeWidth={1} opacity={0.45} />
          </g>
        ))}

        {/* Axis tick labels */}
        {xTicks.map((t) => (
          <text key={`xt-${t}`} x={x(t)} y={xAxisY + 14} textAnchor="middle"
            fontSize={9} fill="#86857c" style={{ fontVariantNumeric: "tabular-nums" }}>
            {t}
          </text>
        ))}
        {yTicks.map((t) => (
          <text key={`yt-${t}`} x={yAxisX - 6} y={y(t) + 3} textAnchor="end"
            fontSize={9} fill="#86857c" style={{ fontVariantNumeric: "tabular-nums" }}>
            {t}
          </text>
        ))}

        {/* Axis labels */}
        <text x={(PAD.left + W - PAD.right) / 2} y={H - 4}
          textAnchor="middle" fontSize={10} fill="#86857c">
          Marketing spend (k)
        </text>
        <text x={10} y={(PAD.top + H - PAD.bottom) / 2}
          textAnchor="middle" fontSize={10} fill="#86857c"
          transform={`rotate(-90, 10, ${(PAD.top + H - PAD.bottom) / 2})`}>
          Revenue (k)
        </text>

        {/* Data points + hover targets */}
        {DATA.map((d) => {
          const isHovered = hovered?.label === d.label;
          return (
            <g key={d.label}>
              {/* Invisible larger hit target */}
              <circle cx={x(d.x)} cy={y(d.y)} r={10} fill="transparent"
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "crosshair" }}
              />
              {/* Visible dot */}
              <circle
                cx={x(d.x)} cy={y(d.y)}
                r={isHovered ? 5 : 3.5}
                fill={COLOR}
                fillOpacity={isHovered ? 1 : 0.72}
                stroke="#fbfbf8"
                strokeWidth={1}
                style={{ pointerEvents: "none", transition: "r 80ms ease" }}
              />
              {/* Crosshair lines on hover — project to both axes */}
              {isHovered && (
                <>
                  <line x1={x(d.x)} x2={x(d.x)} y1={y(d.y)} y2={xAxisY}
                    stroke={COLOR} strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
                  <line x1={yAxisX} x2={x(d.x)} y1={y(d.y)} y2={y(d.y)}
                    stroke={COLOR} strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
                </>
              )}
            </g>
          );
        })}

        {/* Direct annotations — rendered on the data, no tooltip */}
        {DATA.filter((d) => d.annotation).map((d) => {
          const { dx, dy } = annotationOffset(d);
          const lx = x(d.x);
          const ly = y(d.y);
          return (
            <g key={`ann-${d.label}`} style={{ pointerEvents: "none" }}>
              {/* Leader line from point to label */}
              <line
                x1={lx} y1={ly}
                x2={lx + dx * 0.6} y2={ly + dy * 0.6}
                stroke="#86857c" strokeWidth={0.75}
              />
              <text
                x={lx + dx} y={ly + dy}
                fontSize={8} fill="#86857c" fontStyle="italic"
                textAnchor="middle"
              >
                {d.annotation}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Data-ink teaching controls ────────────────────────── */}
      <div className="mt-5 pt-4 border-t border-[#e5e5e0]">
        <p className="text-[12px] font-medium mb-2">Data-ink ratio — strip context layers</p>
        <div className="flex gap-5 mb-2">
          {(["gridlines", "marginalTicks"] as const).map((layer) => (
            <label key={layer} className="flex items-center gap-1.5 text-[12px] cursor-pointer select-none text-[#86857c]">
              <input type="checkbox" checked={ink[layer]} onChange={() => toggleInk(layer)} />
              {layer === "gridlines" ? "Gridlines" : "Marginal ticks"}
            </label>
          ))}
        </div>
        <p className="text-[11px] text-[#86857c] leading-relaxed">
          {ink.gridlines && ink.marginalTicks &&
            "Both on. Notice that marginal ticks already tell you the distribution — gridlines are partly redundant."}
          {ink.gridlines && !ink.marginalTicks &&
            "Ticks removed. Gridlines now do all the positional work — but they show a grid, not the actual data distribution."}
          {!ink.gridlines && ink.marginalTicks &&
            "Gridlines removed. Marginal ticks survive because they encode real data — every tick is a point projected onto its axis."}
          {!ink.gridlines && !ink.marginalTicks &&
            "Both removed. The range-frame axes alone carry the data range. This is the minimum honest scaffold."}
        </p>
      </div>
    </div>
  );
}
