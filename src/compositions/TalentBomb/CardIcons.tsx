import React from "react";

/**
 * The two card icons, drawn rather than set as emoji.
 *
 * The reference uses a green push-button telephone and a headless tuxedo,
 * which no single emoji font renders the same way — Apple's ☎️ is a red rotary
 * phone and its 🤵 has a head. Drawing them keeps the card art identical on
 * every machine that renders this composition.
 */

const PhoneIcon: React.FC = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
      <linearGradient id="tb-phone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#63D97B" />
        <stop offset="100%" stopColor="#2E9E4B" />
      </linearGradient>
      <linearGradient id="tb-handset" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4FC468" />
        <stop offset="100%" stopColor="#227E3B" />
      </linearGradient>
    </defs>

    {/* Base, splayed towards the bottom like the emoji it stands in for */}
    <path
      d="M22 44 H78 a12 12 0 0 1 11.9 10.4 L93 82 a9 9 0 0 1 -8.9 10 H15.9 A9 9 0 0 1 7 82 l3.1 -27.6 A12 12 0 0 1 22 44 Z"
      fill="url(#tb-phone)"
      stroke="#1A6B33"
      strokeWidth={3.5}
      strokeLinejoin="round"
    />
    {/* Keypad */}
    <rect x={28} y={54} width={44} height={30} rx={4} fill="#EDF9EF" />
    {[0, 1, 2, 3].map((row) =>
      [0, 1, 2].map((col) => (
        <rect
          key={`${row}-${col}`}
          x={31 + col * 13.6}
          y={57 + row * 7}
          width={11}
          height={4.6}
          rx={1.6}
          fill="#83CE95"
        />
      )),
    )}
    {/*
      Handset: two earpieces joined by a bar. Drawn as three rectangles twice —
      once inflated in the outline colour, once in the fill — so the shapes
      merge into a single outlined silhouette with no seams where they meet.
    */}
    {[
      { fill: "#1A6B33", grow: 3.5 },
      { fill: "url(#tb-handset)", grow: 0 },
    ].map(({ fill, grow }) => (
      <g key={grow} fill={fill}>
        <rect
          x={32 - grow}
          y={19 - grow}
          width={36 + grow * 2}
          height={12 + grow * 2}
          rx={6 + grow}
        />
        <rect
          x={8 - grow}
          y={10 - grow}
          width={28 + grow * 2}
          height={30 + grow * 2}
          rx={11 + grow}
        />
        <rect
          x={64 - grow}
          y={10 - grow}
          width={28 + grow * 2}
          height={30 + grow * 2}
          rx={11 + grow}
        />
      </g>
    ))}
    <rect x={13} y={15} width={18} height={6} rx={3} fill="#FFFFFF" opacity={0.35} />
    <rect x={69} y={15} width={18} height={6} rx={3} fill="#FFFFFF" opacity={0.35} />
  </svg>
);

const TuxedoIcon: React.FC = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    {/* Jacket silhouette — broad shoulders, straight hem */}
    <path
      d="M50 20 C41 20 30 22 24 27 C16 33 12 42 11 50 L8 92 h84 L89 50 C88 42 84 33 76 27 C70 22 59 20 50 20 Z"
      fill="#17171B"
    />
    {/* Shirt front */}
    <path d="M42 21 L50 33 L58 21 L64 27 L60 92 H40 L36 27 Z" fill="#FBFBFC" />
    {/* Lapels laid over the shirt's edges, leaving a white V at the collar */}
    <path d="M41 21 L50 36 L44 92 H40 L37 29 Z" fill="#101014" />
    <path d="M59 21 L50 36 L56 92 H60 L63 29 Z" fill="#101014" />
    {/* Bow tie, seated in the neckline */}
    <path d="M50 33 L34 26 L34 41 Z" fill="#DE2438" />
    <path d="M50 33 L66 26 L66 41 Z" fill="#DE2438" />
    <rect x={45} y={28} width={10} height={11} rx={3.5} fill="#AE1929" />
    {/* Buttons down the shirt front */}
    <circle cx={50} cy={66} r={2.4} fill="#1C1C21" />
    <circle cx={50} cy={80} r={2.4} fill="#1C1C21" />
  </svg>
);

const DRAWN: Record<string, React.FC> = {
  phone: PhoneIcon,
  tuxedo: TuxedoIcon,
};

/**
 * Renders one of the drawn icons by name (`phone`, `tuxedo`); anything else is
 * treated as literal text, so a plain emoji still works as a quick override.
 */
export const CardIcon: React.FC<{ name: string; size: number }> = ({ name, size }) => {
  const Drawn = DRAWN[name];
  if (Drawn) {
    return (
      <div style={{ width: size, height: size }}>
        <Drawn />
      </div>
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        fontSize: size * 0.92,
        lineHeight: `${size}px`,
        textAlign: "center",
        fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
      }}
    >
      {name}
    </div>
  );
};
