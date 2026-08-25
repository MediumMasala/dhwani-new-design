import React from "react";
import { Easing, interpolate } from "remotion";
import { COLORS } from "./layout";
import { TIMELINE } from "./timeline";
import { quadPoint, seeded, seededRange, type Point } from "./math";

/**
 * The payoff: the blast throws little profile chips out of the headline and
 * they fly down into the candidate cards.
 *
 * Each chip follows its own quadratic Bézier — launched upward and outward,
 * then curving down into its target — so the group fans out instead of moving
 * as one block. Targets are given relative to the bomb's centre.
 */

const CHIP_FILLS = ["#141416", "#141416", "#FF7A18", "#141416", "#1F6F5C", "#141416"];

/** Late enough that the chips break *out* of the fireball rather than sit in it. */
const LAUNCH = TIMELINE.boom.start + 0.09;
const EASE_IN_OUT = Easing.bezier(0.3, 0.8, 0.3, 1);

/** A round avatar chip: head + shoulders knocked out of a solid disc. */
const Chip: React.FC<{ radius: number; fill: string }> = ({ radius: R, fill }) => (
  <g>
    <circle r={R} fill={fill} />
    <circle r={R * 0.94} fill="none" stroke="#FFFFFF" strokeWidth={R * 0.1} opacity={0.22} />
    <circle cy={-R * 0.2} r={R * 0.27} fill="#FFFFFF" />
    <path
      d={`M${-R * 0.46},${R * 0.5} A${R * 0.46},${R * 0.5} 0 0 1 ${R * 0.46},${R * 0.5} Z`}
      fill="#FFFFFF"
    />
  </g>
);

export const CandidateParticles: React.FC<{
  r: number;
  time: number;
  /** Where the chips should land, as offsets from the bomb's centre. */
  targets: Point[];
}> = ({ r, time, targets }) => {
  if (time < LAUNCH) return null;

  const strays = 5;
  const total = targets.length + strays;

  const chips = Array.from({ length: total }).map((_, i) => {
    const targeted = i < targets.length;
    const seed = i * 13 + 7;

    const born = LAUNCH + i * 0.014;
    const lands = targeted
      ? TIMELINE.talent.start + seededRange(seed + 1, 0, 0.18)
      : TIMELINE.boom.end + 0.12;
    const p = interpolate(time, [born, lands], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_IN_OUT,
    });
    if (p <= 0) return null;

    // Strays are thrown clear of the sheet and simply fade.
    const strayAngle = -Math.PI / 2 + seededRange(seed + 2, -1.5, 1.5);
    const target: Point = targeted
      ? targets[i]
      : {
          x: Math.cos(strayAngle) * seededRange(seed + 3, r * 3, r * 6),
          y: Math.sin(strayAngle) * seededRange(seed + 3, r * 3, r * 6),
        };

    // Control point: half way there, kicked sideways and lifted, so the chip
    // arcs out of the explosion rather than sliding along a straight line.
    const side = seeded(seed + 4) > 0.5 ? 1 : -1;
    const control: Point = {
      x: target.x * 0.45 + side * seededRange(seed + 5, r * 0.8, r * 2.6),
      y: target.y * 0.32 - seededRange(seed + 6, r * 1.4, r * 3.2),
    };
    const pos = quadPoint({ x: 0, y: 0 }, control, target, p);

    // Pop in on launch, then get absorbed by the card on arrival.
    const popIn = interpolate(p, [0, 0.1, 0.2], [0, 1.2, 1], { extrapolateRight: "clamp" });
    const absorb = targeted
      ? interpolate(p, [0.84, 1], [1, 0.45], { extrapolateLeft: "clamp" })
      : interpolate(p, [0.5, 1], [1, 0.7], { extrapolateLeft: "clamp" });
    const opacity = targeted
      ? interpolate(p, [0.86, 1], [1, 0], { extrapolateLeft: "clamp" })
      : interpolate(p, [0.35, 1], [1, 0], { extrapolateLeft: "clamp" });

    const size = r * seededRange(seed + 8, 0.24, 0.34);
    const spin = seededRange(seed + 9, -26, 26) * (1 - p);

    return (
      <g
        key={i}
        transform={`translate(${pos.x} ${pos.y}) scale(${popIn * absorb}) rotate(${spin})`}
        opacity={opacity}
      >
        <circle r={size * 1.7} fill={COLORS.flameEdge} opacity={0.16 * (1 - p)} />
        <Chip radius={size} fill={CHIP_FILLS[i % CHIP_FILLS.length]} />
      </g>
    );
  });

  const pad = r * 3;
  const xs = [0, ...targets.map((t) => t.x)];
  const ys = [0, ...targets.map((t) => t.y)];
  const box = {
    x: Math.min(...xs) - pad,
    y: Math.min(...ys) - pad,
    w: Math.max(...xs) - Math.min(...xs) + pad * 2,
    h: Math.max(...ys) - Math.min(...ys) + pad * 2,
  };

  return (
    <svg
      width={box.w}
      height={box.h}
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      style={{ position: "absolute", left: box.x, top: box.y, overflow: "visible" }}
    >
      {chips}
    </svg>
  );
};
