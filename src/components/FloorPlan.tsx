import type { ApartmentId } from "../data/property";

/** Simple line plans of the two apartments, 1 m = 24 px. */

const wall = { fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinejoin: "round" as const };
const thin = { fill: "none", stroke: "currentColor", strokeWidth: 1.25, opacity: 0.7 };
const label = { fontSize: 10, fill: "currentColor", fontFamily: "Inter, sans-serif", letterSpacing: "0.04em" };

function Door({ x, y, r, rotate = 0 }: { x: number; y: number; r: number; rotate?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} {...thin}>
      <path d={`M0 0 L0 ${-r}`} />
      <path d={`M0 ${-r} A${r} ${r} 0 0 1 ${r} 0`} strokeDasharray="2 3" />
    </g>
  );
}

function Studio() {
  return (
    <svg viewBox="0 0 268 168" className="h-auto w-full" aria-hidden="true">
      <g transform="translate(10 10)">
        {/* 7 x 4 m inside, balcony on the right */}
        <path d="M0 0 H168 V96 H0 Z" {...wall} />
        <path d="M168 18 V78" stroke="var(--color-paper)" strokeWidth="4" />
        <path d="M168 18 V78" {...thin} />
        <path d="M168 6 H232 V90 H168" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* bathroom */}
        <path d="M0 52 H50 V96" {...wall} strokeWidth={2} />
        <Door x={50} y={70} r={16} rotate={90} />
        <rect x="6" y="58" width="22" height="32" rx="3" {...thin} />
        {/* kitchenette */}
        <rect x="58" y="4" width="64" height="16" {...thin} />
        <circle cx="72" cy="12" r="4" {...thin} />
        <circle cx="84" cy="12" r="4" {...thin} />
        {/* bed */}
        <rect x="110" y="44" width="48" height="46" rx="3" {...thin} />
        <path d="M110 56 H158" {...thin} />
        {/* entrance */}
        <path d="M64 96 H90" stroke="var(--color-paper)" strokeWidth="4" />
        <Door x={64} y={96} r={24} rotate={0} />
        <text x="62" y="40" {...label}>KITCHEN</text>
        <text x="116" y="80" {...label}>BED</text>
        <text x="8" y="45" {...label}>BATH</text>
        <text x="178" y="52" {...label}>BALCONY</text>
        <text x="0" y="132" {...label} opacity={0.75}>28 m² · 2nd floor</text>
      </g>
    </svg>
  );
}

function Mare() {
  return (
    <svg viewBox="0 0 268 188" className="h-auto w-full" aria-hidden="true">
      <g transform="translate(10 8)">
        {/* 9.5 x 5.5 m inside, terrace along the front */}
        <path d="M0 0 H228 V116 H0 Z" {...wall} />
        <path d="M0 116 H228 V156 H0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* bedroom */}
        <path d="M84 0 V116" {...wall} strokeWidth={2} />
        <rect x="14" y="10" width="56" height="52" rx="3" {...thin} />
        <path d="M14 24 H70" {...thin} />
        <path d="M84 70 V96" stroke="var(--color-paper)" strokeWidth="4" />
        <Door x={84} y={96} r={22} rotate={180} />
        {/* bathroom */}
        <path d="M84 50 H136 V0" {...wall} strokeWidth={2} />
        <rect x="112" y="6" width="18" height="38" rx="2" {...thin} />
        <path d="M136 22 V44" stroke="var(--color-paper)" strokeWidth="4" />
        {/* kitchen and living */}
        <rect x="150" y="4" width="72" height="16" {...thin} />
        <rect x="150" y="70" width="58" height="22" rx="6" {...thin} />
        <rect x="104" y="72" width="30" height="30" rx="4" {...thin} />
        {/* terrace doors */}
        <path d="M150 116 H206" stroke="var(--color-paper)" strokeWidth="4" />
        <path d="M150 116 H206" {...thin} />
        <text x="12" y="88" {...label}>BEDROOM</text>
        <text x="92" y="30" {...label}>BATH</text>
        <text x="152" y="40" {...label}>KITCHEN</text>
        <text x="152" y="62" {...label}>SOFA BED</text>
        <text x="12" y="140" {...label}>TERRACE · SEA VIEW</text>
        <text x="0" y="178" {...label} opacity={0.75}>55 m² · ground floor</text>
      </g>
    </svg>
  );
}

export function FloorPlan({ apartment }: { apartment: ApartmentId }) {
  return apartment === "studio" ? <Studio /> : <Mare />;
}
