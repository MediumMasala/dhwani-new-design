import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  ACTIVATING,
  BOMB,
  CANVAS,
  CARDS,
  COLORS,
  HEADLINE,
  PILL,
  SHEET,
} from "./layout";
import { TIMELINE, phaseProgress } from "./timeline";
import { burnAt } from "./fuse";
import { clamp01 } from "./math";
import { CardIcon } from "./CardIcons";

/**
 * With `lineHeight: 1` Inter's cap height happens to centre exactly on the
 * line box, so `translateY(-50%)` optically centres capitalised text with no
 * correction. Kept as a named constant so it is obvious that this was checked
 * rather than forgotten.
 */
const CAP_NUDGE = 0;

export type SheetCopy = {
  activatingLabel: string;
  pillLabel: string;
  primaryTask: string;
  primaryTaskTotal: number;
  secondaryTask: string;
  primaryIcon: string;
  secondaryIcon: string;
};

/** "Activating 1x" plus three dots that cycle while the bomb is working. */
const Activating: React.FC<{ label: string; time: number; fontFamily: string }> = ({
  label,
  time,
  fontFamily,
}) => {
  const stripped = label.replace(/\.+$/, "");
  const dots = label.length - stripped.length || 3;

  return (
    <div
      style={{
        position: "absolute",
        top: ACTIVATING.centerY,
        left: 0,
        width: CANVAS.width,
        textAlign: "center",
        transform: `translateY(calc(-50% - ${ACTIVATING.fontSize * CAP_NUDGE}px))`,
        fontFamily,
        fontSize: ACTIVATING.fontSize,
        fontWeight: ACTIVATING.weight,
        lineHeight: 1,
        color: COLORS.ink,
        letterSpacing: -0.2,
      }}
    >
      {stripped}
      {Array.from({ length: dots }).map((_, i) => (
        <span
          key={i}
          style={{
            opacity: interpolate(
              Math.sin((time - i * 0.16) * 4.6),
              [-1, 1],
              [0.25, 1],
            ),
          }}
        >
          .
        </span>
      ))}
    </div>
  );
};

/** One of the two progress cards. */
const Card: React.FC<{
  index: number;
  icon: string;
  fontFamily: string;
  time: number;
  children: React.ReactNode;
}> = ({ index, icon, fontFamily, time, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // The card is knocked when its candidates land, then springs back.
  const impactAt = TIMELINE.talent.start + 0.02 + index * 0.07;
  const settle = spring({
    frame: frame - impactAt * fps,
    fps,
    config: { damping: 11, mass: 0.6, stiffness: 190 },
  });
  const knock = time < impactAt ? 0 : 1 - settle;
  const scale = 1 - knock * 0.03;
  const lift = knock * 7;

  return (
    <div
      style={{
        position: "absolute",
        left: CARDS.left,
        top: CARDS.tops[index],
        width: CARDS.width,
        height: CARDS.heights[index],
        borderRadius: CARDS.radius,
        background: COLORS.card,
        boxShadow: `0 ${1 + knock * 8}px ${8 + knock * 20}px rgba(0,0,0,${
          0.02 + knock * 0.05
        })`,
        transform: `translateY(${lift}px) scale(${scale})`,
        transformOrigin: "50% 50%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: CARDS.iconCenterX - CARDS.iconSize / 2,
          top: CARDS.heights[index] / 2 - CARDS.iconSize / 2,
        }}
      >
        <CardIcon name={icon} size={CARDS.iconSize} />
      </div>
      <div style={{ fontFamily }}>{children}</div>
    </div>
  );
};

export const Sheet: React.FC<{
  copy: SheetCopy;
  time: number;
  fontFamily: string;
  /** Slot the bomb, blast and chips are drawn into (rendered on top). */
  effects: React.ReactNode;
}> = ({ copy, time, fontFamily, effects }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /* The whole sheet takes a small hit when the bomb goes off. */
  const boomSettle = spring({
    frame: frame - TIMELINE.boom.start * fps,
    fps,
    config: { damping: 13, mass: 0.7, stiffness: 210 },
  });
  const recoil = time < TIMELINE.boom.start ? 0 : 1 - boomSettle;

  /* The "o" the bomb was standing in for pops back once the smoke clears. */
  const letterInRaw = spring({
    frame: frame - (TIMELINE.talent.start - 0.06) * fps,
    fps,
    config: { damping: 10, mass: 0.5, stiffness: 200 },
  });
  const letterIn = time < TIMELINE.talent.start - 0.06 ? 0 : letterInRaw;

  /* Candidate counter, driven by the same curve as the fuse. */
  const reached = Math.round(
    interpolate(burnAt(time), [0, 1], [6, 94]) +
      interpolate(phaseProgress(time, TIMELINE.boom), [0, 1], [0, 6]),
  );
  const progress = clamp01(reached / copy.primaryTaskTotal);

  /* Warm light thrown across the sheet by the blast. */
  const boomLight =
    interpolate(
      phaseProgress(time, { start: TIMELINE.boom.start, end: TIMELINE.boom.end }),
      [0, 0.15, 1],
      [0, 1, 0],
    ) * 0.16;

  const textStyle: React.CSSProperties = {
    position: "absolute",
    left: CARDS.textLeft,
    width: CARDS.textRight - CARDS.textLeft,
    fontSize: CARDS.fontSize,
    lineHeight: `${CARDS.lineHeight}px`,
    fontWeight: 400,
    color: COLORS.inkSoft,
    letterSpacing: -0.3,
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translateY(${recoil * 5}px) scale(${1 + recoil * 0.005})`,
        transformOrigin: `${BOMB.center.x}px ${BOMB.center.y}px`,
      }}
    >
      {/* Bottom sheet */}
      <div
        style={{
          position: "absolute",
          left: SHEET.left,
          top: SHEET.top,
          width: SHEET.width,
          height: CANVAS.height - SHEET.top + SHEET.radius,
          borderRadius: `${SHEET.radius}px ${SHEET.radius}px 0 0`,
          background: COLORS.sheet,
          boxShadow: "0 -20px 64px rgba(0,0,0,0.22)",
        }}
      >
        {/* Blast light, clipped to the sheet. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: `${SHEET.radius}px ${SHEET.radius}px 0 0`,
            background: `radial-gradient(46% 20% at ${
              BOMB.center.x - SHEET.left
            }px ${BOMB.center.y - SHEET.top}px, rgba(255,140,32,${boomLight}) 0%, rgba(255,140,32,0) 100%)`,
          }}
        />
      </div>

      <Activating label={copy.activatingLabel} time={time} fontFamily={fontFamily} />

      {/* Headline. The word is typeset in full — the bomb hangs off the "o",
          which stays invisible until the blast hands the letter back. Because
          the row is a positioned element, the bomb, blast and chips inside it
          paint above the cards without any z-index juggling. */}
      <div
        style={{
          position: "absolute",
          top: HEADLINE.centerY,
          left: 0,
          width: CANVAS.width,
          textAlign: "center",
          transform: `translateY(calc(-50% - ${HEADLINE.fontSize * CAP_NUDGE}px))`,
          fontFamily,
          fontSize: HEADLINE.fontSize,
          fontWeight: HEADLINE.weight,
          letterSpacing: HEADLINE.letterSpacing,
          lineHeight: 1,
          color: COLORS.ink,
          whiteSpace: "pre",
        }}
      >
        {HEADLINE.before}
        <span style={{ position: "relative", display: "inline-block" }}>
          <span
            style={{
              display: "inline-block",
              opacity: letterIn,
              transform: `scale(${interpolate(letterIn, [0, 1, 1.12], [0.4, 1, 1.1])})`,
            }}
          >
            {HEADLINE.hidden}
          </span>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: HEADLINE.fontSize * (0.5 + HEADLINE.glyphCenterOffset),
              width: 0,
              height: 0,
            }}
          >
            {effects}
          </div>
        </span>
        {HEADLINE.after}
      </div>

      {/* Pill */}
      <div
        style={{
          position: "absolute",
          left: (CANVAS.width - PILL.width) / 2,
          top: PILL.top,
          width: PILL.width,
          height: PILL.height,
          borderRadius: PILL.radius,
          background: COLORS.fill,
          color: "#FFFFFF",
          fontFamily,
          fontSize: PILL.fontSize,
          fontWeight: 700,
          letterSpacing: PILL.letterSpacing,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 10px 24px rgba(0,0,0,0.12), 0 0 ${
            boomLight * 220
          }px rgba(255,122,24,${boomLight * 4})`,
        }}
      >
        {copy.pillLabel}
      </div>

      {/* Card 1 — outreach progress */}
      <Card index={0} icon={copy.primaryIcon} fontFamily={fontFamily} time={time}>
        <div
          style={{
            ...textStyle,
            top: CARDS.singleLineCenterY - CARDS.lineHeight / 2,
          }}
        >
          {`${copy.primaryTask} (${reached}/${copy.primaryTaskTotal})`}
        </div>
        <div
          style={{
            position: "absolute",
            left: CARDS.textLeft,
            top: CARDS.barTop,
            width: CARDS.textRight - CARDS.textLeft,
            height: CARDS.barHeight,
            borderRadius: CARDS.barHeight / 2,
            background: COLORS.track,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              borderRadius: CARDS.barHeight / 2,
              background: COLORS.fill,
            }}
          />
        </div>
      </Card>

      {/* Card 2 — shortlisting */}
      <Card index={1} icon={copy.secondaryIcon} fontFamily={fontFamily} time={time}>
        <div
          style={{
            ...textStyle,
            top: CARDS.twoLineFirstBaselineY,
            whiteSpace: "pre-line",
            // Breathes gently while the task is still running.
            opacity:
              time < TIMELINE.boom.start
                ? interpolate(Math.sin(time * 3.1), [-1, 1], [0.86, 1])
                : 1,
          }}
        >
          {copy.secondaryTask}
        </div>
      </Card>
    </div>
  );
};
