"use client";

import { useMemo, useState } from "react";
import * as d3 from "d3";

// ── Data — quarterly spend & revenue per region ───────────────
interface Quarter { q: string; spend: number; revenue: number }
interface Region  { label: string; data: Quarter[] }

const REGIONS: Region[] = [
  {
    label: "North",
    data: [
      { q: "Q1", spend: 12, revenue: 10 },
      { q: "Q2", spend: 18, revenue: 20 },
      { q: "Q3", spend: 25, revenue: 28 },
      { q: "Q4", spend: 30, revenue: 36 },
    ],
  },
  {
    label: "South",
    data: [
      { q: "Q1", spend: 20, revenue: 22 },
      { q: "Q2", spend: 16, revenue: 18 },
      { q: "Q3", spend: 11, revenue: 13 },
      { q: "Q4", spend: 8,  revenue: 7  },
    ],
  },
  {
    label: "East",
    data: [
      { q: "Q1", spend: 9,  revenue: 8  },
      { q: "Q2", spend: 22, revenue: 28 },
      { q: "Q3", spend: 14, revenue: 12 },
      { q: "Q4", spend: 7,  revenue: 8  },
    ],
  },
  {
    label: "West",
    data: [
      { q: "Q1", spend: 5, revenue: 5 },
      { q: "Q2", spend: 6, revenue: 6 },
      { q: "Q3", spend: 5, revenue: 5 },
      { q: "Q4", spend: 6, revenue: 5 },
    ],
  },
];

// ── Panel geometry ────────────────────────────────────────────
const W = 180;
const H = 160;
const PAD = { top: 20, right: 16, bottom: 30, left: 30 };
const COLOR = "#1d7a5a";

// ── Shared axis domains across all regions (locked scales) ────
const allSpend   = REGIONS.flatMap((r) => r.data.map((d) => d.spend));
const allRevenue = REGIONS.flatMap((r) => r.data.map((d) => d.revenue));
const SPEND_MAX   = d3.max(allSpend)   as number;
const REVENUE_MAX = d3.max(allRevenue) as number;

// Quarter label offsets — nudge to avoid overprinting the dot
const Q_OFFSETS: Record<string, [number, number]> = {
  Q1: [-10, 4],
  Q2: [5,  -6],
  Q3: [5,   4],
  Q4: [-10, 10],
};

// ── Single panel ──────────────────────────────────────────────
interface PanelProps {
  region: Region;
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
  hovered: string | null;           // region label currently hovered globally
  onHover: (label: string | null) => void;
}

function Panel({ region, x, y, hovered, onHover }: PanelProps) {
  const lineFn = useMemo(
    () =>
      d3
        .line<Quarter>()
        .x((d) => x(d.spend))
        .y((d) => y(d.revenue))
        .curve(d3.curveLinear),
    [x, y]
  );

  const isHovered = hovered === region.label;
  const isOther   = hovered !== null && !isHovered;

  // Arrow direction: unit vector of last segment, for arrowhead
  const pts = region.data;
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const dx = x(last.spend)   - x(prev.spend);
  const dy = y(last.revenue) - y(prev.revenue);
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;

  // Small arrowhead at the end of the path
  const ax = x(last.spend);
  const ay = y(last.revenue);
  const arrowSize = 5;
  const arrowPath = `M ${ax} ${ay} L ${ax - arrowSize * ux + arrowSize * 0.4 * uy} ${ay - arrowSize * uy - arrowSize * 0.4 * ux} L ${ax - arrowSize * ux - arrowSize * 0.4 * uy} ${ay - arrowSize * uy + arrowSize * 0.4 * ux} Z`;

  const xTicks = x.ticks(3);
  const yTicks = y.ticks(3);
  const xAxisY = H - PAD.bottom;
  const yAxisX = PAD.left;

  return (
    <svg
      width={W}
      height={H}
      role="img"
      aria-label={`${region.label} connected scatter: spend vs revenue trajectory`}
      style={{ overflow: "visible", cursor: "default" }}
      onMouseEnter={() => onHover(region.label)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Gridlines — muted */}
      {yTicks.map((t) => (
        <line key={`gy-${t}`} x1={yAxisX} x2={W - PAD.right}
          y1={y(t)} y2={y(t)} stroke="#e5e5e0" strokeWidth={1} />
      ))}
      {xTicks.map((t) => (
        <line key={`gx-${t}`} x1={x(t)} x2={x(t)}
          y1={PAD.top} y2={xAxisY} stroke="#e5e5e0" strokeWidth={1} />
      ))}

      {/* Range-frame axes */}
      <line x1={x(d3.min(allSpend) as number)} x2={x(SPEND_MAX)}
        y1={xAxisY} y2={xAxisY} stroke="#86857c" strokeWidth={1} />
      <line x1={yAxisX} x2={yAxisX}
        y1={y(d3.min(allRevenue) as number)} y2={y(REVENUE_MAX)}
        stroke="#86857c" strokeWidth={1} />

      {/* Axis tick labels */}
      {xTicks.map((t) => (
        <text key={`xt-${t}`} x={x(t)} y={xAxisY + 12} textAnchor="middle"
          fontSize={8} fill="#b0b0a8" style={{ fontVariantNumeric: "tabular-nums" }}>
          {t}
        </text>
      ))}
      {yTicks.map((t) => (
        <text key={`yt-${t}`} x={yAxisX - 4} y={y(t) + 3} textAnchor="end"
          fontSize={8} fill="#b0b0a8" style={{ fontVariantNumeric: "tabular-nums" }}>
          {t}
        </text>
      ))}

      {/* Path */}
      <path
        d={lineFn(region.data) ?? ""}
        fill="none"
        stroke={COLOR}
        strokeWidth={isHovered ? 2 : 1.5}
        opacity={isOther ? 0.15 : 0.85}
        style={{ transition: "opacity 120ms ease, stroke-width 80ms ease" }}
      />

      {/* Arrowhead showing time direction */}
      <path
        d={arrowPath}
        fill={COLOR}
        opacity={isOther ? 0.15 : 0.85}
        style={{ transition: "opacity 120ms ease" }}
      />

      {/* Points + quarter labels */}
      {region.data.map((d, i) => {
        const [ox, oy] = Q_OFFSETS[d.q] ?? [5, -6];
        const isFirst = i === 0;
        return (
          <g key={d.q}>
            <circle
              cx={x(d.spend)} cy={y(d.revenue)}
              r={isFirst ? 3.5 : 2.5}
              fill={isFirst ? "#fbfbf8" : COLOR}
              stroke={COLOR}
              strokeWidth={isFirst ? 1.5 : 0}
              opacity={isOther ? 0.15 : 1}
              style={{ transition: "opacity 120ms ease" }}
            />
            <text
              x={x(d.spend) + ox} y={y(d.revenue) + oy}
              fontSize={7.5} fill={isHovered ? "#33332e" : "#86857c"}
              textAnchor="middle"
              opacity={isOther ? 0.15 : 1}
              style={{ transition: "opacity 120ms ease, fill 80ms ease" }}
            >
              {d.q}
            </text>
          </g>
        );
      })}

      {/* Region label — top-left */}
      <text x={yAxisX} y={14} fontSize={11} fontWeight={600}
        fill="#33332e" opacity={isOther ? 0.25 : 1}
        style={{ transition: "opacity 120ms ease" }}>
        {region.label}
      </text>
    </svg>
  );
}

// ── Root component ────────────────────────────────────────────
export default function ConnectedScatter() {
  const [hovered, setHovered] = useState<string | null>(null);

  // Shared locked scales — same domain on every panel
  const x = useMemo(
    () => d3.scaleLinear().domain([0, SPEND_MAX]).range([PAD.left, W - PAD.right]).nice(),
    []
  );
  const y = useMemo(
    () => d3.scaleLinear().domain([0, REVENUE_MAX]).range([H - PAD.bottom, PAD.top]).nice(),
    []
  );

  const hoveredRegion = hovered ? REGIONS.find((r) => r.label === hovered) : null;
  const h = hoveredRegion;

  return (
    <div className="font-serif max-w-[560px] mx-auto px-6 py-8 text-[#33332e] bg-[#fbfbf8]">
      <h2 className="text-xl font-medium mb-1">Quarterly spend → revenue trajectory</h2>
      <p className="text-[13px] text-[#86857c] mb-3 leading-relaxed">
        Connected scatter · time implicit in sequence · locked scales · arrowhead shows direction
      </p>

      {/* ── Micro readout ─────────────────────────────────────── */}
      <div className="h-6 mb-5 text-[12px] text-[#33332e] tabular-nums">
        {h ? (
          <span>
            <span className="font-medium">{h.label}</span>
            {h.data.map((d) => (
              <span key={d.q}>
                <span className="text-[#86857c]"> · {d.q} </span>
                <span>{d.spend}→{d.revenue}k</span>
              </span>
            ))}
          </span>
        ) : (
          <span className="text-[#c0bfb8] italic text-[11px]">
            Hover a panel to read the quarterly trajectory
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6">
        {REGIONS.map((region) => (
          <Panel
            key={region.label}
            region={region}
            x={x}
            y={y}
            hovered={hovered}
            onHover={setHovered}
          />
        ))}
      </div>

      {/* ── Annotation explaining the chart type ──────────────── */}
      <div className="mt-5 pt-4 border-t border-[#e5e5e0]">
        <p className="text-[11px] text-[#86857c] leading-relaxed">
          Each path traces one region through spend/revenue space over four quarters. Open circle = Q1 (start);
          arrowhead = Q4 (direction of travel). North moves steadily northeast — spend and revenue rise together.
          East spikes into high-revenue territory in Q2 (trade show) then retreats. South and West compress toward the origin.
          All panels share the same axes: shapes are directly comparable.
        </p>
      </div>
    </div>
  );
}
