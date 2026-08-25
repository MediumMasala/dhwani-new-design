import { useMemo } from "react";
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

export const cardFlipReelSchema = z.object({
  // Faces in order. Even indices land on one side of the card, odd indices on
  // the other, so the card keeps turning the same way through the whole list.
  images: z.array(z.string()).min(2),
  backgroundColor: z.string(),
  cardHeight: z.number().min(100).max(2000),
  // Frames to rest on an even-indexed face (the logo cards) before flipping.
  logoHold: z.number().min(0).max(120),
  // Frames to rest on an odd-indexed face (the photo cards, which carry text
  // and need longer to read).
  photoHold: z.number().min(0).max(120),
  flipDuration: z.number().min(4).max(60),
});

export type CardFlipReelProps = z.infer<typeof cardFlipReelSchema>;

const REEL_IMAGES = Array.from(
  { length: 20 },
  (_, i) => `cards/reel/${String(i + 1).padStart(2, "0")}.png`,
);

export const cardFlipReelDefaultProps: CardFlipReelProps = {
  images: REEL_IMAGES,
  backgroundColor: "#000000",
  cardHeight: 880,
  logoHold: 4,
  photoHold: 10,
  flipDuration: 6,
};

// The source cards are all 970x1270.
const CARD_ASPECT = 970 / 1270;

// Rescaled to fit flipDuration exactly: past 90 degrees a quarter of the way
// in, flat again at just past half, then a ~3 degree overshoot that settles by
// the end of the window.
const FLIP_SPRING = { damping: 16, mass: 1.1, stiffness: 90 };

const holdFor = (index: number, logoHold: number, photoHold: number) =>
  index % 2 === 0 ? logoHold : photoHold;

/**
 * Total frames needed to walk the whole list: every face gets its hold, and
 * every gap between faces gets a flip.
 */
export const cardFlipReelDuration = ({
  images,
  logoHold,
  photoHold,
  flipDuration,
}: CardFlipReelProps) => {
  let total = 0;
  for (let i = 0; i < images.length; i++) {
    total += holdFor(i, logoHold, photoHold);
    if (i < images.length - 1) {
      total += flipDuration;
    }
  }
  return total;
};

export const CardFlipReel: React.FC<CardFlipReelProps> = ({
  images,
  backgroundColor,
  cardHeight,
  logoHold,
  photoHold,
  flipDuration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Frame at which each flip begins. Flip k turns image k into image k + 1.
  const flipStarts = useMemo(() => {
    const starts: number[] = [];
    let cursor = 0;
    for (let i = 0; i < images.length - 1; i++) {
      cursor += holdFor(i, logoHold, photoHold);
      starts.push(cursor);
      cursor += flipDuration;
    }
    return starts;
  }, [images.length, logoHold, photoHold, flipDuration]);

  // The last flip that has begun — the one either in progress or just landed.
  // Before the first flip starts this stays at 0 and the spring below reads 0.
  const started = flipStarts.filter((start) => frame >= start).length;
  const flipIndex = Math.max(0, started - 1);

  const progress = spring({
    frame: frame - flipStarts[flipIndex],
    fps,
    config: FLIP_SPRING,
    durationInFrames: flipDuration,
  });

  // Every completed flip contributes a full half turn; the card never reverses.
  const rotateY = flipIndex * 180 + progress * 180;

  // Pull the card back through the middle of each turn so it reads as a
  // physical object rotating rather than a texture swap.
  const turn = Math.sin(Math.min(progress, 1) * Math.PI);
  const scale = 1 - turn * 0.07;
  const translateZ = turn * -60;

  const enter = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 140, mass: 0.6 },
    durationInFrames: 8,
  });
  const enterScale = interpolate(enter, [0, 1], [0.92, 1]);

  // Only the two faces bracketing the current flip are visible. Every image
  // stays mounted so nothing has to decode mid-flip.
  const front = flipIndex % 2 === 0 ? flipIndex : flipIndex + 1;
  const back = flipIndex % 2 === 0 ? flipIndex + 1 : flipIndex;

  const cardWidth = cardHeight * CARD_ASPECT;

  const faceStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  };

  const imgStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
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
        <div style={faceStyle}>
          {images.map((src, i) =>
            i % 2 === 0 ? (
              <Img
                key={src}
                src={staticFile(src)}
                style={{ ...imgStyle, opacity: i === front ? 1 : 0 }}
              />
            ) : null,
          )}
        </div>
        <div style={{ ...faceStyle, transform: "rotateY(180deg)" }}>
          {images.map((src, i) =>
            i % 2 === 1 ? (
              <Img
                key={src}
                src={staticFile(src)}
                style={{ ...imgStyle, opacity: i === back ? 1 : 0 }}
              />
            ) : null,
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
