import React from "react";
import { Easing, interpolate } from "remotion";
import { COLORS } from "./layout";
import { TIMELINE, phaseProgress } from "./timeline";
import { pulse, seeded, seededRange } from "./math";

/**
 * A stylised, graphic blast — layered shapes rather than fire. Everything is
 * built from one irregular starburst, two shockwave rings and a spray of
 * dots / stars / streaks / fragments, all sized in multiples of the bomb's
 * radius so the blast never grows past the sheet.
 */

const BURST_SPIKES = 13;
const DOT_COUNT = 20;
const STREAK_COUNT = 10;
const FRAGMENT_COUNT = 11;
const STAR_COUNT = 5;

/** Irregular star polygon, in units where the longest spike is 1. */
const burstPath = (spikes: number, innerRatio: number, seed: number) => {
  const steps = spikes * 2;
  let d = "";
  for (let i = 0; i < steps; i++) {
    const outer = i % 2 === 0;
    const radius =
      (outer ? 1 : innerRatio) * seededRange(seed + i, 0.74, 1.16);
    const angle =
      (i / steps) * Math.PI * 2 -
      Math.PI / 2 +
      seededRange(seed + i + 97, -0.1, 0.1);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(3)},${y.toFixed(3)}`;
  }
  return `${d}Z`;
};

const BURST_BACK = burstPath(BURST_SPIKES, 0.46, 3);
const BURST_FRONT = burstPath(BURST_SPIKES, 0.52, 41);
const STAR = "M0,-1 L0.24,-0.24 L1,0 L0.24,0.24 L0,1 L-0.24,0.24 L-1,0 L-0.24,-0.24Z";

const EASE_OUT = Easing.bezier(0.16, 0.84, 0.28, 1);

export const Explosion: React.FC<{ r: number; time: number }> = ({ r, time }) => {
  const p = phaseProgress(time, TIMELINE.boom);
  // Particles keep travelling a little past the blast itself.
  const tail = phaseProgress(time, {
    start: TIMELINE.boom.start,
    end: TIMELINE.talent.end,
  });
  if (time < TIMELINE.boom.start || tail >= 1) return null;

  const ease = (v: number) => interpolate(v, [0, 1], [0, 1], { easing: EASE_OUT });

  /* Core: white flash → orange burst → black graphic layer behind it. */
  const flash = pulse(interpolate(p, [0, 0.16], [0, 1], { extrapolateRight: "clamp" }));
  const burstScale = interpolate(p, [0, 0.16, 0.4, 1], [0.12, 1.16, 1, 0.88], {
    extrapolateRight: "clamp",
  });
  const burstOpacity = interpolate(p, [0, 0.05, 0.55, 0.9], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });
  // Sized so the blast still lets the headline read either side of it — a
  // starburst that swallows the whole word stops being a product animation.
  const burstSize = r * 1.85;

  /* Shockwaves. */
  const ringOf = (
    delay: number,
    color: string,
    maxR: number,
    width: number,
    peak: number,
    span = 0.75,
  ) => {
    const rp = interpolate(p, [delay, delay + span], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return {
      radius: r * (0.5 + ease(rp) * maxR),
      width: width * (1 - rp) ** 1.6,
      opacity: (1 - rp) ** 2.4 * peak,
      color,
    };
  };
  // Kept deliberately tight and short-lived: a ring that hangs around as a
  // clean circle stops reading as impact and starts reading as a spinner.
  const rings = [
    ringOf(0, "#FFFFFF", 2.2, r * 0.7, 0.9, 0.3),
    ringOf(0.06, COLORS.flameEdge, 3.0, r * 0.34, 0.5, 0.5),
  ];

  return (
    <svg
      width={r * 16}
      height={r * 16}
      viewBox={`${-r * 8} ${-r * 8} ${r * 16} ${r * 16}`}
      style={{ position: "absolute", left: -r * 8, top: -r * 8, overflow: "visible" }}
    >
      <defs>
        <radialGradient id="tb-flash">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="55%" stopColor="#FFF3C4" stopOpacity={0.75} />
          <stop offset="100%" stopColor="#FFB020" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="tb-boomGlow">
          <stop offset="0%" stopColor={COLORS.flameMid} stopOpacity={0.5} />
          <stop offset="100%" stopColor={COLORS.flameEdge} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Shockwave rings, behind everything. */}
      {rings.map((ring, i) => (
        <circle
          key={`ring${i}`}
          r={ring.radius}
          fill="none"
          stroke={ring.color}
          strokeWidth={Math.max(ring.width, 0)}
          opacity={ring.opacity}
        />
      ))}

      {/* Warm afterglow that lingers a beat longer than the burst. */}
      <circle
        r={r * (1.8 + ease(p) * 2.4)}
        fill="url(#tb-boomGlow)"
        opacity={(1 - p) ** 2 * 0.8}
      />

      {/* Streaks — short radial lines, the fastest thing in the blast. */}
      {Array.from({ length: STREAK_COUNT }).map((_, i) => {
        const angle = (i / STREAK_COUNT) * Math.PI * 2 + seededRange(i + 61, -0.2, 0.2);
        const sp = interpolate(p, [0.02, 0.6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const dist = r * (0.8 + ease(sp) * seededRange(i + 62, 3.2, 5));
        const len = r * seededRange(i + 63, 0.5, 1.1) * (1 - sp);
        return (
          <line
            key={`st${i}`}
            x1={Math.cos(angle) * dist}
            y1={Math.sin(angle) * dist}
            x2={Math.cos(angle) * (dist + len)}
            y2={Math.sin(angle) * (dist + len)}
            stroke={i % 3 === 0 ? COLORS.ink : COLORS.flameEdge}
            strokeWidth={r * 0.07}
            strokeLinecap="round"
            opacity={(1 - sp) ** 1.2}
          />
        );
      })}

      {/* Graphic starburst: black plate behind, orange on top, hot core. */}
      <g opacity={burstOpacity}>
        <path
          d={BURST_BACK}
          transform={`rotate(${-14 + p * 10}) scale(${burstSize * burstScale * 1.14})`}
          fill={COLORS.ink}
        />
        <path
          d={BURST_FRONT}
          transform={`rotate(${9 - p * 8}) scale(${burstSize * burstScale})`}
          fill={COLORS.flameEdge}
        />
        <path
          d={BURST_FRONT}
          transform={`rotate(${9 - p * 8}) scale(${burstSize * burstScale * 0.56})`}
          fill={COLORS.flameMid}
        />
      </g>

      {/* Fragments — chunks of casing tumbling outward. */}
      {Array.from({ length: FRAGMENT_COUNT }).map((_, i) => {
        const angle = (i / FRAGMENT_COUNT) * Math.PI * 2 + seededRange(i + 71, -0.3, 0.3);
        const fp = interpolate(tail, [0.03, 0.75], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const dist = r * (0.4 + ease(fp) * seededRange(i + 72, 2.2, 4.6));
        const size = r * seededRange(i + 73, 0.09, 0.2);
        return (
          <rect
            key={`fr${i}`}
            x={-size}
            y={-size * 0.7}
            width={size * 2}
            height={size * 1.4}
            rx={size * 0.3}
            transform={`translate(${Math.cos(angle) * dist} ${
              Math.sin(angle) * dist + 120 * fp * fp
            }) rotate(${seededRange(i + 74, -180, 180) + fp * 260})`}
            fill={seeded(i + 75) > 0.45 ? COLORS.ink : COLORS.flameEdge}
            opacity={(1 - fp) ** 1.3}
          />
        );
      })}

      {/* Dots. */}
      {Array.from({ length: DOT_COUNT }).map((_, i) => {
        const angle = (i / DOT_COUNT) * Math.PI * 2 + seededRange(i + 81, -0.25, 0.25);
        const dp = interpolate(tail, [0, 0.62], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const dist = r * (0.3 + ease(dp) * seededRange(i + 82, 2.4, 5.2));
        return (
          <circle
            key={`dt${i}`}
            cx={Math.cos(angle) * dist}
            cy={Math.sin(angle) * dist + 90 * dp * dp}
            r={r * seededRange(i + 83, 0.045, 0.11) * (1 - dp * 0.5)}
            fill={
              i % 4 === 0
                ? COLORS.ink
                : i % 4 === 1
                  ? COLORS.flameMid
                  : COLORS.flameEdge
            }
            opacity={(1 - dp) ** 1.2}
          />
        );
      })}

      {/* A few sparkle stars for the playful register. */}
      {Array.from({ length: STAR_COUNT }).map((_, i) => {
        const angle = (i / STAR_COUNT) * Math.PI * 2 + 0.4;
        const sp = interpolate(tail, [0.05, 0.7], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const dist = r * (0.6 + ease(sp) * seededRange(i + 91, 2.6, 4.2));
        const size = r * 0.22 * pulse(sp) ** 0.5;
        return (
          <path
            key={`sr${i}`}
            d={STAR}
            transform={`translate(${Math.cos(angle) * dist} ${
              Math.sin(angle) * dist
            }) scale(${size}) rotate(${sp * 90})`}
            fill={COLORS.flameCore}
            opacity={(1 - sp) ** 0.8}
          />
        );
      })}

      {/* The initial white kick, on top of everything for two or three frames. */}
      <circle r={r * (0.6 + flash * 2.6)} fill="url(#tb-flash)" opacity={flash} />
    </svg>
  );
};
