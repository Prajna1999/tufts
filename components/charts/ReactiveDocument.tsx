"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import * as d3 from "d3";

// ── Inline sparkline ──────────────────────────────────────────
const SW = 56, SH = 14;

function InlineSpark({ values }: { values: number[] }) {
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
    () => d3.line<number>().x((_d, i) => x(i)).y((d) => y(d)).curve(d3.curveMonotoneX),
    [x, y]
  );
  const color = values[values.length - 1] > values[0] ? "#1d7a5a" : "#b84040";
  return (
    <svg width={SW} height={SH} aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle", marginBottom: 2 }}>
      <path d={lineFn(values) ?? ""} fill="none" stroke={color} strokeWidth={1.25} />
    </svg>
  );
}

// ── Scrubable number ──────────────────────────────────────────
interface ScrubProps {
  value: number;
  min: number;
  max: number;
  sensitivity: number;
  decimals?: number;
  suffix?: string;
  onChange: (v: number) => void;
}

function Scrub({ value, min, max, sensitivity, decimals = 0, suffix = "", onChange }: ScrubProps) {
  const startX   = useRef(0);
  const startVal = useRef(value);
  const active   = useRef(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      active.current   = true;
      startX.current   = e.clientX;
      startVal.current = value;

      const onMove = (ev: MouseEvent) => {
        if (!active.current) return;
        const raw     = startVal.current + (ev.clientX - startX.current) * sensitivity;
        const snapped = parseFloat((Math.round(raw / sensitivity) * sensitivity).toFixed(decimals));
        onChange(Math.min(max, Math.max(min, snapped)));
      };
      const onUp = () => {
        active.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup",   onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup",   onUp);
    },
    [value, min, max, sensitivity, decimals, onChange]
  );

  return (
    <span
      onMouseDown={onMouseDown}
      title="Drag left or right to adjust"
      style={{
        cursor:              "ew-resize",
        textDecoration:      "underline",
        textDecorationStyle: "dotted",
        textDecorationColor: "#2563a8",
        textUnderlineOffset: "3px",
        color:               "#2563a8",
        userSelect:          "none",
        fontVariantNumeric:  "tabular-nums",
      }}
    >
      {value.toFixed(decimals)}{suffix}
    </span>
  );
}

// ── Constants (real 2026 data) ────────────────────────────────
// Sources: MNRE, CEA, Carbon Brief, pv-magazine, March 2026
const CURRENT_GW      = 150;    // installed solar, March 2026
const TARGET_GW       = 500;    // COP26 renewable target, 2030
const CO2_PER_GW      = 2.412;  // MT CO₂ avoided per GW per year (361.8 MT ÷ 150 GW)
const COAL_COST       = 5.4;    // ₹/kWh, new coal (CEA 2025)
const CAPACITY_FACTOR = 0.22;   // India solar average
// Average petrol car in India: ~2 tonnes CO₂/year
const CO2_PER_CAR     = 0.000002; // MT

// CO₂ context (fixed, current fleet only)
const currentCO2     = Math.round(CURRENT_GW * CO2_PER_GW * 10) / 10;  // 361.8 MT
const carsEquivalent = Math.round(currentCO2 / CO2_PER_CAR / 1_000_000); // millions

// Capacity series: historical + projected (2022–2030)
function capacitySeries(addPerYear: number): number[] {
  return [67, 87, 110, 132, CURRENT_GW,
    CURRENT_GW + addPerYear,
    CURRENT_GW + addPerYear * 2,
    CURRENT_GW + addPerYear * 3,
    CURRENT_GW + addPerYear * 4,
  ];
}

// ── Conclusion ────────────────────────────────────────────────
function conclusion(addPerYear: number, projected: number, solarCost: number): string {
  const gap = TARGET_GW - projected;
  if (addPerYear < 20)
    return `At this pace the 2030 target falls short by ${Math.round(gap)} GW. Solar remains a meaningful contributor — but not the structural shift the transition requires.`;
  if (projected > TARGET_GW + 30)
    return `India would surpass the 500 GW target by ${Math.round(-gap)} GW — the fastest large-economy energy transition on record, if execution holds.`;
  if (solarCost > COAL_COST)
    return `Above ₹${COAL_COST}/kWh, solar loses its cost edge over new coal. The transition becomes a policy commitment rather than a market inevitability.`;
  if (solarCost > 4.2)
    return `The cost advantage is narrowing. At ₹${solarCost.toFixed(1)}/kWh, solar still beats new coal — but the margin leaves little room for financing costs or grid integration expenses.`;
  return `The trajectory is credible. Capacity is on track, and the cost gap is wide enough that market forces — not just policy — are driving the build-out.`;
}

// ── Root component ────────────────────────────────────────────
export default function ReactiveDocument() {
  const [addPerYear, setAddPerYear] = useState(44);
  const [solarCost,  setSolarCost]  = useState(3.2);

  const projected   = CURRENT_GW + addPerYear * 4;
  const gap         = TARGET_GW - projected;
  const solarTWh    = Math.round(projected * CAPACITY_FACTOR * 8.76);
  const savings     = Math.max(0, COAL_COST - solarCost);
  const savingsCr   = Math.round(solarTWh * savings * 100 / 1000); // ₹ crore

  const series = useMemo(() => capacitySeries(addPerYear), [addPerYear]);
  const closing = conclusion(addPerYear, projected, solarCost);

  return (
    <div className="font-serif max-w-[520px] mx-auto px-6 py-8 text-[#33332e] bg-[#fbfbf8]">
      <h2 className="text-xl font-medium mb-1">India&rsquo;s solar transition, 2026–2030</h2>
      <p className="text-[13px] text-[#86857c] mb-1 leading-relaxed">
        Reactive document · drag the underlined numbers
      </p>
      <p className="text-[11px] text-[#c0bfb8] italic mb-6">
        Data: MNRE, CEA, Carbon Brief · March 2026 · after Bret Victor, Explorable Explanations (2011)
      </p>

      <div className="text-[15px] leading-[2.15] space-y-4">

        <p>
          India reached <strong>{CURRENT_GW} GW</strong> of solar in March 2026,
          avoiding <strong>{currentCO2} MT</strong> of CO₂ annually —
          the equivalent of permanently removing <strong>{carsEquivalent} million</strong> petrol
          cars from the road.
        </p>

        <p>
          At{" "}
          <Scrub value={addPerYear} min={10} max={70} sensitivity={0.3}
            decimals={0} suffix=" GW added per year" onChange={setAddPerYear} />{" "}
          <InlineSpark values={series} />,
          India reaches <strong>{Math.round(projected)} GW</strong> by 2030 —{" "}
          {gap > 0
            ? <><strong>{Math.round(gap)} GW short</strong> of the 500 GW target</>
            : <><strong>{Math.round(-gap)} GW beyond</strong> the 500 GW target</>
          }.
        </p>

        <p>
          Utility solar now clears at{" "}
          <Scrub value={solarCost} min={2.0} max={6.5} sensitivity={0.02}
            decimals={1} suffix=" ₹/kWh" onChange={setSolarCost} />,
          against ₹{COAL_COST} for new coal.{" "}
          {savings > 0
            ? <>That ₹{savings.toFixed(1)}/kWh margin, applied to the {solarTWh} TWh
                the fleet would generate by 2030, implies{" "}
                <strong>₹{savingsCr.toLocaleString("en-IN")} crore</strong> saved
                against the coal counterfactual.</>
            : <>Solar has lost its cost advantage — the transition now rests on
                policy commitment, not market economics.</>
          }
        </p>

        <p className="text-[14px] border-l-2 border-[#e5e5e0] pl-4 leading-relaxed italic">
          {closing}
        </p>

      </div>

      <p className="text-[11px] text-[#b0b0a8] mt-8 pt-4 border-t border-[#e5e5e0] leading-relaxed">
        Drag underlined numbers left to decrease, right to increase.
        No assumption is hidden — the prose and the conclusion derive from the same model.
      </p>
    </div>
  );
}
