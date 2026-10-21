/** Rovinj's old town at dusk, drawn in code: the hill of houses, St Euphemia's bell tower and one lit window. */

const W = 640;
const SHORE = 300;
const hill = (x: number) => SHORE - 122 * Math.max(0, 1 - ((x - 320) / 285) ** 2);

function random(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

type House = { x: number; y: number; w: number; h: number; roof: number; windows: { x: number; y: number; lit: boolean }[] };

function houses(seed: number, from: number, to: number, drop: number, minH: number, maxH: number): House[] {
  const next = random(seed);
  const list: House[] = [];
  for (let x = from; x < to; ) {
    const w = 14 + Math.round(next() * 16);
    const base = hill(x + w / 2) + drop;
    const h = minH + Math.round(next() * (maxH - minH));
    const windows = [];
    for (let wy = base - h + 7; wy < base - 8; wy += 10) {
      for (let wx = x + 4; wx < x + w - 5; wx += 8) {
        if (next() < 0.42) windows.push({ x: wx, y: wy, lit: next() < 0.18 });
      }
    }
    list.push({ x, y: base - h, w, h: h + 40, roof: next() < 0.55 ? 5 : 0, windows });
    x += w - 1;
  }
  return list;
}

const BACK = houses(7, 52, 590, 2, 14, 30);
const FRONT = houses(19, 96, 552, 26, 18, 34);
const nextStar = random(48271);
const STARS = Array.from({ length: 24 }, () => ({
  x: 20 + nextStar() * (W - 40),
  y: 14 + nextStar() * 130,
  r: 0.6 + nextStar() * 0.9,
  o: 0.3 + nextStar() * 0.5,
}));

function HouseShape({ house, fill, window }: { house: House; fill: string; window: string }) {
  const { x, y, w, h, roof } = house;
  return (
    <g>
      <path d={`M${x} ${y + h} V${y} ${roof ? `L${x + w / 2} ${y - roof} L${x + w} ${y}` : `H${x + w}`} V${y + h} Z`} fill={fill} />
      {house.windows.map((win) => (
        <rect key={`${win.x}-${win.y}`} x={win.x} y={win.y} width={3} height={4} rx={0.5} fill={win.lit ? "#f6c48f" : window} opacity={win.lit ? 0.95 : 0.55} />
      ))}
    </g>
  );
}

export function Illustration({ className }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${W} 440`} className={className} role="img" aria-label="Illustration of Rovinj's old town at dusk, with the bell tower on the hill and one warmly lit window reflected in the sea.">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d3b4e" />
          <stop offset="0.45" stopColor="#4f6876" />
          <stop offset="0.78" stopColor="#d9a984" />
          <stop offset="1" stopColor="#f3d0ab" />
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f5b6b" />
          <stop offset="1" stopColor="#0f2f3c" />
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0" stopColor="#ffb36b" stopOpacity="0.85" />
          <stop offset="0.35" stopColor="#f59a4c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f59a4c" stopOpacity="0" />
        </radialGradient>
        <mask id="crescent">
          <circle cx="532" cy="74" r="15" fill="white" />
          <circle cx="539" cy="69" r="13" fill="black" />
        </mask>
        <clipPath id="frame">
          <rect width={W} height="440" rx="28" />
        </clipPath>
      </defs>

      <g clipPath="url(#frame)">
        <rect width={W} height={SHORE} fill="url(#sky)" />
        {STARS.map((star, i) => (
          <circle key={i} cx={star.x} cy={star.y} r={star.r} fill="#fff8ec" opacity={star.o} />
        ))}
        <circle cx="532" cy="74" r="15" fill="#f6efe2" mask="url(#crescent)" />

        {/* Back row of houses and the hill behind them */}
        <path d={`M30 ${SHORE} ${Array.from({ length: 58 }, (_, i) => `L${30 + i * 10} ${hill(30 + i * 10) + 6}`).join(" ")} L610 ${SHORE} Z`} fill="#2c4b5a" />
        {BACK.map((house) => (
          <HouseShape key={house.x} house={house} fill="#2c4b5a" window="#5f7b88" />
        ))}

        {/* St Euphemia: the church and its bell tower */}
        <path d="M274 196 V158 L320 138 L366 158 V196 Z" fill="#203f4d" />
        <rect x="309" y="64" width="22" height="122" fill="#1a3542" />
        <rect x="313" y="76" width="5" height="12" rx="2.5" fill="#0f2430" />
        <rect x="322" y="76" width="5" height="12" rx="2.5" fill="#0f2430" />
        <path d="M307 64 H333 L320 22 Z" fill="#1a3542" />
        <path d="M320 22 V9" stroke="#1a3542" strokeWidth="2" />
        <circle cx="320" cy="8" r="2.2" fill="#1a3542" />

        {/* Cypresses */}
        {[[206, 216], [222, 210], [436, 222]].map(([cx, cy]) => (
          <ellipse key={cx} cx={cx} cy={cy} rx="5" ry="22" fill="#163240" />
        ))}

        {/* Front row of houses down to the water */}
        <path d={`M70 ${SHORE} ${Array.from({ length: 50 }, (_, i) => `L${70 + i * 10} ${hill(70 + i * 10) + 30}`).join(" ")} L570 ${SHORE} Z`} fill="#18333f" />
        {FRONT.map((house) => (
          <HouseShape key={house.x} house={house} fill="#18333f" window="#3c5866" />
        ))}

        {/* The lantern window */}
        <circle className="lantern-glow" cx="424" cy="246" r="46" fill="url(#glow)" />
        <rect x="419" y="240" width="10" height="13" rx="1.5" fill="#ffc27f" />
        <path d="M424 240 V253 M419 246.5 H429" stroke="#c76a22" strokeWidth="1" />

        {/* Sea, shoreline and reflections */}
        <rect y={SHORE} width={W} height={440 - SHORE} fill="url(#sea)" />
        <path d={`M0 ${SHORE + 0.5} H${W}`} stroke="#e6c3a0" strokeOpacity="0.35" />
        <path d={`M70 ${SHORE} H570 L540 ${SHORE + 18} H100 Z`} fill="#0f2a36" opacity="0.55" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} className="lantern-glow" x={418 - i * 2 + (i % 2) * 5} y={SHORE + 10 + i * 13} width={12 + i * 3} height="2" rx="1" fill="#ffb36b" opacity={0.85 - i * 0.12} />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={(i * 97) % 600 + 10} y={SHORE + 30 + ((i * 37) % 100)} width={26 + (i % 4) * 10} height="1.5" rx="0.75" fill="#cfe0e4" opacity="0.18" />
        ))}

        {/* A batana with an ochre sail */}
        <g transform="translate(150 336)">
          <path d="M-34 0 H36 Q30 12 14 13 H-22 Q-32 10 -34 0 Z" fill="#0c2530" />
          <path d="M2 -2 V-44 L28 -6 Z" fill="#d9783a" />
          <path d="M-2 -2 V-34 L-22 -6 Z" fill="#b8612a" />
          <path d="M-30 18 H32" stroke="#cfe0e4" strokeOpacity="0.25" strokeWidth="1.5" />
        </g>
      </g>
    </svg>
  );
}
