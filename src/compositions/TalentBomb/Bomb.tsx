import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "./layout";
import { TIMELINE, flowTime, phaseProgress } from "./timeline";
import { burnAt, charredFusePath, flamePointAt, remainingFusePath } from "./fuse";
import { clamp01, pulse, seeded, seededRange } from "./math";

/**
 * A unit-height teardrop, drawn from its base at (0, 0) pointing up. Scaling
 * this one path keeps the flame's silhouette consistent at every size.
 */
const FLAME_PATH = "M0 0 C-0.34 -0.20 -0.30 -0.55 0 -1 C0.30 -0.55 0.34 -0.20 0 0Z";

/* -------------------------------------------------------------------------- */
/*  Bomb body                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The glossy black sphere. Everything is expressed as a fraction of the radius
 * so the bomb can be resized from `layout.ts` without redrawing it.
 */
const BombBody: React.FC<{ r: number; heat: number }> = ({ r, heat }) => (
  <g>
    {/* Warm halo that swells as the fuse gets short — the bomb "heats up". */}
    <circle cx={0} cy={0} r={r * (1.28 + heat * 0.22)} fill="url(#tb-halo)" opacity={heat * 0.55} />

    <circle cx={0} cy={0} r={r} fill="url(#tb-body)" />

    {/* Bounce light along the lower-right edge keeps the sphere from reading flat. */}
    <ellipse
      cx={r * 0.3}
      cy={r * 0.44}
      rx={r * 0.46}
      ry={r * 0.2}
      transform={`rotate(38 ${r * 0.3} ${r * 0.44})`}
      fill="#FFFFFF"
      opacity={0.1}
      filter="url(#tb-soft)"
    />

    {/* Orange bounce from the fuse, on the side the flame is on. */}
    <ellipse
      cx={r * 0.52}
      cy={-r * 0.5}
      rx={r * 0.34}
      ry={r * 0.24}
      fill={COLORS.ember}
      opacity={heat * 0.4}
      filter="url(#tb-soft)"
    />

    {/* Main specular highlight, upper left, as on the reference emoji. */}
    <ellipse
      cx={-r * 0.33}
      cy={-r * 0.4}
      rx={r * 0.27}
      ry={r * 0.17}
      transform={`rotate(-34 ${-r * 0.33} ${-r * 0.4})`}
      fill="#FFFFFF"
      opacity={0.55}
      filter="url(#tb-soft)"
    />
    <circle cx={-r * 0.42} cy={-r * 0.47} r={r * 0.075} fill="#FFFFFF" opacity={0.9} />
  </g>
);

/** The metal collar the fuse is seated in. */
const FuseCap: React.FC<{ r: number }> = ({ r }) => (
  <g transform={`translate(${r * 0.62} ${-r * 0.82}) rotate(38)`}>
    <rect
      x={-r * 0.21}
      y={-r * 0.24}
      width={r * 0.42}
      height={r * 0.48}
      rx={r * 0.1}
      fill="#26262A"
    />
    <rect
      x={-r * 0.21}
      y={-r * 0.24}
      width={r * 0.42}
      height={r * 0.15}
      rx={r * 0.07}
      fill="#55555E"
    />
  </g>
);

/* -------------------------------------------------------------------------- */
/*  Fuse                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The rope. Only the un-burned stretch is drawn: the path is re-sampled every
 * frame from the analytic curve in `fuse.ts`, so the flame always sits exactly
 * on the rope's end.
 */
export const BombFuse: React.FC<{ r: number; time: number }> = ({ r, time }) => {
  const remaining = 1 - burnAt(time);
  if (remaining <= 0.008) return null;

  const d = remainingFusePath(time, r);

  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke="#6E4A26" strokeWidth={r * 0.3} />
      <path d={d} stroke="#C1904F" strokeWidth={r * 0.19} />
      <path d={d} stroke="#E4BC7C" strokeWidth={r * 0.06} opacity={0.55} />
      {/* Charred stub right behind the flame — only once there *is* a flame. */}
      <path
        d={charredFusePath(time, r)}
        stroke="#241C16"
        strokeWidth={r * 0.26}
        opacity={time >= TIMELINE.ignite.start && remaining > 0.02 ? 0.95 : 0}
      />
    </g>
  );
};

/* -------------------------------------------------------------------------- */
/*  Flame                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The burning tip. It pops on ignition, then flickers on a sum of two
 * out-of-phase sines — fast enough to read as fire, small enough to stay clean
 * next to product typography.
 */
export const FuseFlame: React.FC<{ r: number; time: number; flowT: number }> = ({
  r,
  time,
  flowT,
}) => {
  const { fps } = useVideoConfig();
  if (time < TIMELINE.ignite.start) return null;

  const pos = flamePointAt(time, r);

  // Ignition pop: overshoots, then settles into its flicker.
  const ignitionFrame = (time - TIMELINE.ignite.start) * fps;
  const lit = spring({
    frame: ignitionFrame,
    fps,
    config: { damping: 9, mass: 0.5, stiffness: 220 },
  });

  // The flame gets bigger and angrier as it nears the bomb.
  const burn = burnAt(time);
  const size = r * (0.62 + burn * 0.4) * interpolate(lit, [0, 1, 1.15], [0, 1, 1.22]);

  const flickerY = 1 + 0.16 * Math.sin(flowT * 29) + 0.07 * Math.sin(flowT * 46 + 1.7);
  const flickerX = 1 - 0.11 * Math.sin(flowT * 33 + 0.6);
  const lean = 7 * Math.sin(flowT * 21) + 3.5 * Math.sin(flowT * 39 + 2.1);
  const glow = 0.55 + 0.2 * Math.sin(flowT * 37 + 0.9) + burn * 0.25;

  return (
    <g transform={`translate(${pos.x} ${pos.y})`}>
      <circle r={size * 1.5} fill="url(#tb-glow)" opacity={glow} />
      <g transform={`rotate(${lean}) scale(${flickerX} ${flickerY})`}>
        <path
          d={FLAME_PATH}
          transform={`scale(${size})`}
          fill="url(#tb-flame)"
        />
        <path
          d={FLAME_PATH}
          transform={`translate(0 ${-size * 0.06}) scale(${size * 0.52})`}
          fill={COLORS.flameCore}
          opacity={0.95}
        />
      </g>
      {/* One-frame white kick at the moment of ignition. */}
      <circle
        r={size * 2.1}
        fill="#FFFFFF"
        opacity={0.75 * pulse(phaseProgress(time, { start: TIMELINE.ignite.start, end: TIMELINE.ignite.start + 0.1 }))}
      />
    </g>
  );
};

/* -------------------------------------------------------------------------- */
/*  Sparks, embers, smoke                                                      */
/* -------------------------------------------------------------------------- */

const SPARK_COUNT = 30;
const EMBER_COUNT = 5;
const SMOKE_COUNT = 8;
const PRESSURE_SPARK_COUNT = 10;

/**
 * All of the small stuff around the flame. Each particle is a pure function of
 * its seed and the current time — nothing accumulates between frames, so the
 * render is frame-order independent.
 */
const FuseParticles: React.FC<{ r: number; time: number; flowT: number }> = ({
  r,
  time,
  flowT,
}) => {
  const emitStart = TIMELINE.ignite.start + 0.04;
  const emitEnd = TIMELINE.finalShake.end;
  const nodes: React.ReactNode[] = [];

  // Sparks — tiny, fast, gravity-bound.
  for (let i = 0; i < SPARK_COUNT; i++) {
    const born = emitStart + ((emitEnd - emitStart) * i) / SPARK_COUNT;
    const life = seededRange(i * 3 + 1, 0.3, 0.55);
    const age = flowT - born;
    if (age < 0 || age > life) continue;

    const origin = flamePointAt(born, r);
    const angle = ((-90 + seededRange(i * 3 + 2, -62, 62)) * Math.PI) / 180;
    const speed = seededRange(i * 3 + 3, 80, 210);
    const x = origin.x + Math.cos(angle) * speed * age;
    const y = origin.y + Math.sin(angle) * speed * age + 300 * age * age;
    const k = age / life;

    nodes.push(
      <circle
        key={`s${i}`}
        cx={x}
        cy={y}
        r={seededRange(i * 3 + 4, 1.8, 3.6) * (1 - k * 0.55)}
        fill={seeded(i * 3 + 5) > 0.5 ? COLORS.flameMid : COLORS.ember}
        opacity={(1 - k) * 0.95}
      />,
    );
  }

  // Embers — slower, glowing, they drift and die out.
  for (let i = 0; i < EMBER_COUNT; i++) {
    const born = emitStart + 0.18 + ((emitEnd - emitStart) * i) / EMBER_COUNT;
    const life = 0.8;
    const age = flowT - born;
    if (age < 0 || age > life) continue;

    const origin = flamePointAt(born, r);
    const angle = ((-90 + seededRange(i * 7 + 11, -34, 34)) * Math.PI) / 180;
    const speed = seededRange(i * 7 + 12, 34, 74);
    const k = age / life;

    nodes.push(
      <circle
        key={`e${i}`}
        cx={origin.x + Math.cos(angle) * speed * age + Math.sin(flowT * 6 + i) * 4}
        cy={origin.y + Math.sin(angle) * speed * age + 90 * age * age}
        r={seededRange(i * 7 + 13, 2.6, 4.4) * (1 - k * 0.4)}
        fill={COLORS.ember}
        opacity={(1 - k) * 0.8}
        filter="url(#tb-soft)"
      />,
    );
  }

  // Smoke — soft grey puffs off the charred rope.
  for (let i = 0; i < SMOKE_COUNT; i++) {
    const born = emitStart + 0.1 + ((emitEnd - emitStart) * i) / SMOKE_COUNT;
    const life = 1.0;
    const age = flowT - born;
    if (age < 0 || age > life) continue;

    const origin = flamePointAt(born, r);
    const k = age / life;
    const drift = seededRange(i * 5 + 21, -26, 26);

    nodes.push(
      <circle
        key={`m${i}`}
        cx={origin.x + drift * k + Math.sin(flowT * 2.4 + i) * 5}
        cy={origin.y - 74 * k}
        r={r * (0.07 + k * 0.2)}
        fill={COLORS.smoke}
        opacity={(1 - k) * 0.22}
        filter="url(#tb-soft)"
      />,
    );
  }

  // Pressure sparks — the bomb venting right before it goes, thrown from the
  // cap rather than from the (now consumed) fuse.
  for (let i = 0; i < PRESSURE_SPARK_COUNT; i++) {
    const born = TIMELINE.finalShake.start + (0.16 * i) / PRESSURE_SPARK_COUNT;
    const life = seededRange(i * 11 + 31, 0.22, 0.4);
    const age = flowT - born;
    if (age < 0 || age > life || time >= TIMELINE.boom.start) continue;

    const angle = ((-90 + seededRange(i * 11 + 32, -110, 110)) * Math.PI) / 180;
    const speed = seededRange(i * 11 + 33, 150, 320);
    const k = age / life;

    nodes.push(
      <circle
        key={`p${i}`}
        cx={r * 0.62 + Math.cos(angle) * speed * age}
        cy={-r * 0.8 + Math.sin(angle) * speed * age + 260 * age * age}
        r={seededRange(i * 11 + 34, 1.6, 3.2) * (1 - k * 0.5)}
        fill={COLORS.flameMid}
        opacity={(1 - k) * 0.9}
      />,
    );
  }

  return <>{nodes}</>;
};

/* -------------------------------------------------------------------------- */
/*  The rig                                                                    */
/* -------------------------------------------------------------------------- */

export type TalentBombProps = {
  /** Radius of the sphere in canvas px. */
  radius: number;
};

/**
 * The bomb itself: entrance, wobble, final shake, held breath.
 *
 * Drawn around a local origin of (0, 0) — the parent decides where that sits
 * in the layout. The SVG deliberately overflows its box so the fuse, flame and
 * sparks can sit above the headline.
 */
export const TalentBomb: React.FC<TalentBombProps> = ({ radius: r }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const flowT = flowTime(time);

  /* --- Phase 1: enter -------------------------------------------------- */
  // One underdamped spring drives position, rotation and scale, so the
  // overshoot / undershoot / settle all share the same physical motion.
  const enter = spring({
    frame,
    fps,
    config: { damping: 9.5, mass: 0.75, stiffness: 210 },
    durationInFrames: Math.round(TIMELINE.bombEnter.end * fps),
  });

  const enterX = interpolate(enter, [0, 1], [r * 0.5, 0]);
  const enterY = interpolate(enter, [0, 1], [-r * 1.05, 0]);
  // Breakpoints past 1 are what the spring's overshoot passes through:
  // rotation reads -6° → +3° → -1° → 0°, scale 0.85 → 1.08 → 0.98 → 1.
  const enterRotate = interpolate(enter, [0, 1, 1.12], [-6, 0, 3]);
  const enterScale = interpolate(enter, [0, 1, 1.12], [0.85, 1, 1.08]);

  // Soft squash on touchdown, timed to when the spring first reaches 1.
  const land = phaseProgress(time, { start: 0.26, end: 0.42 });
  const landSquash = pulse(land) * 0.11;

  /* --- Phase 3: instability ramp --------------------------------------- */
  const burn = burnAt(time);
  const heat = Math.pow(burn, 1.7);
  const wobbleRot =
    (0.8 + 5.4 * heat) * Math.sin(flowT * (7 + 19 * heat)) +
    (0.3 + 2.1 * heat) * Math.sin(flowT * (13 + 30 * heat) + 1.9);
  const wobbleX = heat * heat * 6 * Math.sin(flowT * (9 + 25 * heat) + 0.7);
  const wobbleY = -Math.abs(Math.sin(flowT * (11 + 28 * heat))) * 5 * heat * heat;

  /* --- Phase 4: final shake, then the held breath ----------------------- */
  // `shake` stays at 1 through the hold; because `flowT` is frozen there, the
  // bomb freezes mid-shake instead of snapping back to centre.
  const shake = phaseProgress(time, TIMELINE.finalShake);
  const shakeRot = 12 * shake * Math.sin(flowT * 72);
  const shakeX = 8 * shake * Math.sin(flowT * 63 + 1.2);
  const shakeY = 5 * shake * Math.sin(flowT * 87 + 0.4);

  const hold = phaseProgress(time, TIMELINE.hold);
  const holdEase = Math.pow(hold, 0.6);
  const anticipation = 1 + holdEase * 0.15;
  const anticipationSquash = holdEase * 0.07;

  /* --- Phase 5: gone ---------------------------------------------------- */
  const alive = time < TIMELINE.boom.start ? 1 : 0;

  const scale = enterScale * anticipation;
  const scaleX = scale * (1 + landSquash + anticipationSquash);
  const scaleY = scale * (1 - landSquash - anticipationSquash);
  const rotate = enterRotate + wobbleRot + shakeRot;
  const x = enterX + wobbleX + shakeX;
  const y = enterY + wobbleY + shakeY + holdEase * 4;

  // Room for the fuse (up ~2.2r), the flame above it and the spark spray.
  const box = { x: -4.2 * r, y: -5.4 * r, w: 8.4 * r, h: 7.6 * r };

  return (
    <svg
      width={box.w}
      height={box.h}
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        overflow: "visible",
        opacity: alive,
      }}
    >
      <defs>
        <radialGradient id="tb-body" cx="34%" cy="27%" r="80%">
          <stop offset="0%" stopColor="#5A5A64" />
          <stop offset="20%" stopColor="#2A2A31" />
          <stop offset="52%" stopColor="#0C0C0E" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        <radialGradient id="tb-halo">
          <stop offset="0%" stopColor={COLORS.ember} stopOpacity={0.55} />
          <stop offset="55%" stopColor={COLORS.flameEdge} stopOpacity={0.22} />
          <stop offset="100%" stopColor={COLORS.flameEdge} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="tb-glow">
          <stop offset="0%" stopColor={COLORS.flameMid} stopOpacity={0.85} />
          <stop offset="45%" stopColor={COLORS.flameEdge} stopOpacity={0.32} />
          <stop offset="100%" stopColor={COLORS.flameEdge} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="tb-flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={COLORS.flameEdge} />
          <stop offset="45%" stopColor={COLORS.flameMid} />
          <stop offset="100%" stopColor={COLORS.flameCore} />
        </linearGradient>
        <filter id="tb-soft" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={r * 0.06} />
        </filter>
      </defs>

      {/* Sparks and smoke ride the bomb's entrance but not its wobble, so they
          keep drifting on their own once they have left the fuse. */}
      <g transform={`translate(${enterX} ${enterY})`}>
        <FuseParticles r={r} time={time} flowT={flowT} />
      </g>

      <g
        transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scaleX} ${scaleY})`}
      >
        <BombFuse r={r} time={time} />
        <FuseCap r={r} />
        <BombBody r={r} heat={clamp01(heat + hold * 0.4)} />
        <FuseFlame r={r} time={time} flowT={flowT} />
      </g>
    </svg>
  );
};
