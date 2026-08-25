import { z } from "zod";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const cardDeckReelSchema = z.object({
  // Shown in order, front to back. Paths resolve relative to public/.
  images: z.array(z.string()).min(2),
  backgroundColor: z.string(),
  // Fill of the progress bar and the glow behind the deck.
  accentColor: z.string(),
  cardHeight: z.number().min(100).max(2000),
  // Frames each card rests at the front before it swipes away.
  hold: z.number().min(1).max(240),
  // Frames the swipe itself takes.
  transitionDuration: z.number().min(4).max(60),
  showProgress: z.boolean(),
  playSound: z.boolean(),
});

export type CardDeckReelProps = z.infer<typeof cardDeckReelSchema>;

const REEL_IMAGES = Array.from(
  { length: 20 },
  (_, i) => `cards/reel/${String(i + 1).padStart(2, "0")}.png`,
);

export const cardDeckReelDefaultProps: CardDeckReelProps = {
  images: REEL_IMAGES,
  backgroundColor: "#0B0B0F",
  accentColor: "#FF5200",
  cardHeight: 820,
  hold: 24,
  transitionDuration: 9,
  showProgress: true,
  playSound: true,
};

// The source cards are all 970x1270.
const CARD_ASPECT = 970 / 1270;

// Frames reserved after the last card for the whole deck to fade out, so the
// clip ends on a settle rather than a hard cut.
const OUTRO = 20;

// How many cards peek out behind the front one before they fade into the stack.
const VISIBLE_DEPTH = 3;

const STACK_LIFT = 46;
const STACK_SCALE = 0.05;

const SWIPE_SPRING = { damping: 20, mass: 0.9, stiffness: 110 };

/**
 * Total frames needed to walk the whole list: every card gets its hold, every
 * gap between cards gets a swipe, plus the outro fade.
 */
export const cardDeckReelDuration = ({
  images,
  hold,
  transitionDuration,
}: CardDeckReelProps) =>
  images.length * hold + (images.length - 1) * transitionDuration + OUTRO;

export const CardDeckReel: React.FC<CardDeckReelProps> = ({
  images,
  backgroundColor,
  accentColor,
  cardHeight,
  hold,
  transitionDuration,
  showProgress,
  playSound,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const cardWidth = cardHeight * CARD_ASPECT;
  const lastIndex = images.length - 1;

  // Every card occupies the same slice of the timeline: hold, then swipe.
  const step = hold + transitionDuration;
  const index = Math.min(lastIndex, Math.floor(frame / step));
  const local = frame - index * step;

  // 0 while the front card rests, ramping to 1 as it swipes off. The final
  // card never swipes — it just holds until the outro takes over.
  const advance =
    index < lastIndex
      ? spring({
          frame: local - hold,
          fps,
          config: SWIPE_SPRING,
          durationInFrames: transitionDuration,
        })
      : 0;

  // Fractional position of the deck. Card `index` sits at the front at 0 and
  // has fully left by 1, which is exactly where card `index + 1` arrives.
  const position = index + advance;

  const enter = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.7 },
    durationInFrames: 12,
  });
  const outro = interpolate(
    frame,
    [durationInFrames - OUTRO, durationInFrames - 2],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const deckScale = interpolate(enter, [0, 1], [0.9, 1]);
  const deckOpacity = enter * outro;

  const faceStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  const cardStyle = (depth: number): React.CSSProperties => {
    // depth < 0 is the card currently swiping off the front of the deck.
    if (depth < 0) {
      const p = -depth;
      return {
        transform: [
          `translateX(${-p * cardWidth * 1.5}px)`,
          `translateY(${p * 50}px)`,
          `rotate(${-p * 14}deg)`,
          `scale(${1 - p * 0.05})`,
        ].join(" "),
        opacity: interpolate(p, [0.5, 1], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      };
    }

    // Cards still in the stack sit progressively higher, smaller and dimmer.
    // The lift has to beat the height the scale-down takes off the top edge
    // (cardHeight * STACK_SCALE / 2) or the cards behind barely peek out.
    return {
      transform: [
        `translateY(${-depth * STACK_LIFT}px)`,
        `scale(${1 - depth * STACK_SCALE})`,
      ].join(" "),
      opacity: interpolate(
        depth,
        [VISIBLE_DEPTH - 0.8, VISIBLE_DEPTH],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      ),
      filter: `brightness(${interpolate(depth, [0, VISIBLE_DEPTH], [1, 0.55], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })})`,
    };
  };

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Soft pool of accent light behind the deck, so the cards read as
          floating above the background rather than pasted onto it. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 46%, ${accentColor}33 0%, transparent 58%)`,
          opacity: deckOpacity,
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: deckOpacity,
          transform: `scale(${deckScale})`,
        }}
      >
        <div
          style={{
            width: cardWidth,
            height: cardHeight,
            position: "relative",
          }}
        >
          {/* Every image stays mounted so nothing has to decode mid-swipe;
              the ones deep in the stack are simply transparent. */}
          {images.map((src, i) => {
            const depth = i - position;
            if (depth > VISIBLE_DEPTH || depth < -1) {
              return null;
            }
            return (
              <div
                key={src}
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: images.length - i,
                  ...cardStyle(depth),
                }}
              >
                {/* The card art is only ~98% opaque, so a single copy lets
                    the next card in the stack ghost through its face. Two
                    identical copies composite to ~99.96% and kill the
                    bleed-through without touching the rounded corners or
                    the soft shadow baked into the PNG. */}
                <Img src={staticFile(src)} style={faceStyle} />
                <Img src={staticFile(src)} style={faceStyle} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {showProgress ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 64,
            display: "flex",
            justifyContent: "center",
            gap: 6,
            opacity: deckOpacity,
          }}
        >
          {images.map((src, i) => (
            <div
              key={src}
              style={{
                width: Math.min(40, (cardWidth - 6 * lastIndex) / images.length),
                height: 6,
                borderRadius: 3,
                backgroundColor: "rgba(255,255,255,0.18)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${
                    // Past cards stay full, future cards stay empty, and the
                    // current one fills across its own hold + swipe.
                    (i < index ? 1 : i > index ? 0 : local / step) * 100
                  }%`,
                  backgroundColor: accentColor,
                }}
              />
            </div>
          ))}
        </div>
      ) : null}

      {playSound
        ? images.map((src, i) =>
            i < lastIndex ? (
              <Sequence
                key={src}
                from={i * step + hold}
                durationInFrames={transitionDuration}
                layout="none"
              >
                <Audio src={staticFile("audio/pop.wav")} volume={0.4} />
              </Sequence>
            ) : null,
          )
        : null}
    </AbsoluteFill>
  );
};
