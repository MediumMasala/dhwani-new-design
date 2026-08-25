import { z } from "zod";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const cardFlipSchema = z.object({
  frontImage: z.string(),
  backImage: z.string(),
  backgroundColor: z.string(),
  // Height of the card in pixels; the width follows the image's aspect ratio.
  cardHeight: z.number().min(100).max(2000),
  // Frames to hold on the front face before the flip starts.
  holdBeforeFlip: z.number().min(0).max(120),
});

export type CardFlipProps = z.infer<typeof cardFlipSchema>;

export const cardFlipDefaultProps: CardFlipProps = {
  frontImage: "cards/card-front.png",
  backImage: "cards/card-back.png",
  backgroundColor: "#f4f4f5",
  cardHeight: 900,
  holdBeforeFlip: 14,
};

// The source images are 970x1270.
const CARD_ASPECT = 970 / 1270;

// The turn takes ~14 frames (just under half a second) and overshoots by a
// couple of degrees before settling, so it lands with a snap rather than
// easing to a stop.
const FLIP_SPRING = { damping: 16, mass: 1.1, stiffness: 90 };

export const CardFlip: React.FC<CardFlipProps> = ({
  frontImage,
  backImage,
  backgroundColor,
  cardHeight,
  holdBeforeFlip,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 0 -> front, 1 -> back (overshoots slightly past 1 before settling).
  const flip = spring({
    frame: frame - holdBeforeFlip,
    fps,
    config: FLIP_SPRING,
  });

  const rotateY = flip * 180;

  // Pull the card back a touch through the middle of the flip so it reads
  // as a physical object turning rather than a flat texture swap.
  const turn = Math.sin(Math.min(flip, 1) * Math.PI);
  const scale = 1 - turn * 0.07;
  const translateZ = turn * -60;

  // Gentle scale-in on the very first frames.
  const enter = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 140, mass: 0.6 },
    durationInFrames: 14,
  });
  const enterScale = interpolate(enter, [0, 1], [0.92, 1]);

  const cardWidth = cardHeight * CARD_ASPECT;

  const faceStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        perspective: 2000,
      }}
    >
      <div
        style={{
          width: cardWidth,
          height: cardHeight,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `scale(${enterScale * scale}) translateZ(${translateZ}px) rotateY(${rotateY}deg)`,
        }}
      >
        <Img src={staticFile(frontImage)} style={faceStyle} />
        <Img
          src={staticFile(backImage)}
          style={{ ...faceStyle, transform: "rotateY(180deg)" }}
        />
      </div>
    </AbsoluteFill>
  );
};
