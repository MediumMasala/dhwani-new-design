import React from "react";
import { z } from "zod";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { FloatingCard } from "./FloatingCard";
import { CANVAS, CARDS, TALENT_RING_DURATION } from "./layout";

export {
  CANVAS as TALENT_RING_CANVAS,
  TALENT_RING_FPS,
  TALENT_RING_DURATION,
  CARDS as TALENT_RING_CARDS,
} from "./layout";

/**
 * Only the scene-wide knobs are exposed as props. The per-card numbers live in
 * layout.ts as a plain typed constant instead — eight nested objects would be
 * unusable in the Studio's props editor, and positions are something you tune
 * by editing and watching, not by dragging a slider.
 */
export const talentRingSchema = z.object({
  backgroundColor: z.string(),
  /** Multiplies every card's idle amplitude. 0 freezes the ring once it lands. */
  idleIntensity: z.number().min(0).max(3),
  /** Multiplies every card's drop shadow. 0 renders the cards flat. */
  shadowIntensity: z.number().min(0).max(2),
  /**
   * Scales the whole ring inside the frame. 1 reproduces the reference; drop it
   * if you need safe margin for an overlay, raise it to crop in.
   */
  ringScale: z.number().min(0.5).max(1.5),
});

export type TalentRingProps = z.infer<typeof talentRingSchema>;

export const talentRingDefaultProps: TalentRingProps = {
  backgroundColor: "#000000",
  idleIntensity: 1,
  shadowIntensity: 1,
  ringScale: 1,
};

export const talentRingDuration = () => TALENT_RING_DURATION;

export const TalentRing: React.FC<TalentRingProps> = ({
  backgroundColor,
  idleIntensity,
  shadowIntensity,
  ringScale,
}) => {
  // The ring is authored against a fixed CANVAS-px square and then scaled to
  // whatever the composition's real width is, so re-rendering at 1440 or 2160
  // needs no changes in layout.ts.
  const { width } = useVideoConfig();
  const fit = (width / CANVAS) * ringScale;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/*
        `perspective` here is what gives each card's small entry tilt a real
        foreshortening instead of a flat squash. At rest every tilt is 0, so it
        has no effect whatsoever on the final frame.
      */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          perspective: 1600,
        }}
      >
        <div
          style={{
            position: "relative",
            width: CANVAS,
            height: CANVAS,
            transform: `scale(${fit})`,
            transformStyle: "preserve-3d",
          }}
        >
          {CARDS.map((spec) => (
            <FloatingCard
              key={spec.id}
              spec={spec}
              idleIntensity={idleIntensity}
              shadowIntensity={shadowIntensity}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
