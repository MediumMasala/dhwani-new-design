import React from "react";
import { z } from "zod";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { BOMB, CANVAS, CARDS, cardCenter } from "./layout";
import { SEQUENCE_END } from "./timeline";
import { Backdrop } from "./Backdrop";
import { Sheet } from "./Sheet";
import { TalentBomb } from "./Bomb";
import { Explosion } from "./Explosion";
import { CandidateParticles } from "./CandidateParticles";
import type { Point } from "./math";

// Inter is the closest match to the reference's UI type. `loadFont` registers
// its own delayRender handle, so a render will wait for the font rather than
// flashing a fallback.
const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "800"],
  subsets: ["latin"],
});

/** 60fps: the whole point of this piece is how smooth the motion reads. */
export const TALENT_BOMB_FPS = 60;

export const talentBombSchema = z.object({
  /** Path inside public/ for the blurred portrait; empty = drawn backdrop. */
  backgroundImage: z.string(),
  activatingLabel: z.string(),
  pillLabel: z.string(),
  /** "phone" / "tuxedo" draw the icons from CardIcons; anything else is text. */
  primaryIcon: z.string(),
  primaryTask: z.string(),
  primaryTaskTotal: z.number().min(1).max(9999),
  secondaryIcon: z.string(),
  /** Newlines are honoured, so the reference's line break is preserved. */
  secondaryTask: z.string(),
  /** Seconds to hold on the settled result after the sequence ends. */
  holdAfterSequence: z.number().min(0).max(4),
});

export type TalentBombSceneProps = z.infer<typeof talentBombSchema>;

export const talentBombDefaultProps: TalentBombSceneProps = {
  backgroundImage: "",
  activatingLabel: "Activating 1x...",
  pillLabel: "APPLICANTS IN 10 MINS",
  primaryIcon: "phone",
  primaryTask: "Reaching out to candidates",
  primaryTaskTotal: 100,
  secondaryIcon: "tuxedo",
  secondaryTask: "Figuring out the top candidates for\nyour job post",
  holdAfterSequence: 0.6,
};

export const talentBombDuration = (
  props: TalentBombSceneProps,
  fps = TALENT_BOMB_FPS,
) => Math.round((SEQUENCE_END + props.holdAfterSequence) * fps);

/**
 * Where the candidate chips are aimed: a spread of points across each card,
 * expressed as offsets from the bomb's centre because that is the origin of
 * the blast.
 */
const CHIP_TARGETS: Point[] = [0, 1].flatMap((card) =>
  [0.16, 0.38, 0.6, 0.84].map((fraction, i) => ({
    x: CARDS.left + CARDS.width * fraction - BOMB.center.x,
    y: cardCenter(card).y + (i % 2 === 0 ? -12 : 14) - BOMB.center.y,
  })),
);

export const TalentBombScene: React.FC<TalentBombSceneProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const r = BOMB.radius;

  return (
    <AbsoluteFill style={{ width: CANVAS.width, height: CANVAS.height }}>
      <Backdrop image={props.backgroundImage || undefined} time={time} />

      <Sheet
        copy={props}
        time={time}
        fontFamily={fontFamily}
        effects={
          <>
            <TalentBomb radius={r} />
            <Explosion r={r} time={time} />
            <CandidateParticles r={r} time={time} targets={CHIP_TARGETS} />
          </>
        }
      />
    </AbsoluteFill>
  );
};
