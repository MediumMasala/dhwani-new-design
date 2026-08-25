import { z } from "zod";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { TITLE_SAFE_MARGIN } from "../config";

// Loading the font at module scope means it's fetched once and cached,
// not re-requested on every frame render. Restricted to the one weight
// and subset actually used below, instead of every Inter variant.
const { fontFamily } = loadFont("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

export const kineticTextSchema = z.object({
  words: z.array(z.string()),
  backgroundColor: z.string(),
  textColor: z.string(),
  playSound: z.boolean(),
});

export type KineticTextProps = z.infer<typeof kineticTextSchema>;

export const kineticTextDefaultProps: KineticTextProps = {
  words: ["Make", "something", "people", "want."],
  backgroundColor: "#0e0e0e",
  textColor: "#ffffff",
  playSound: true,
};

const EXIT_DURATION = 20;
// Frames between each word's entrance starting.
const STAGGER = 6;

export const KineticText: React.FC<KineticTextProps> = ({
  words,
  backgroundColor,
  textColor,
  playSound,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const exitStart = durationInFrames - EXIT_DURATION;
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames - 1],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) },
  );
  const exitOpacity = 1 - exitProgress;
  const exitTranslateY = exitProgress * -30;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        padding: TITLE_SAFE_MARGIN,
      }}
    >
      {/*
        A short "pop" plays as the first word lands. The audio file has
        no leading silence, so it starts exactly on the Sequence's
        first frame — trim your own sound effects the same way so they
        don't feel delayed.
      */}
      {playSound && (
        <Sequence durationInFrames={30} layout="none">
          <Audio src={staticFile("audio/pop.wav")} volume={0.5} />
        </Sequence>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 20px",
          maxWidth: `calc(100% - ${TITLE_SAFE_MARGIN * 2}px)`,
          opacity: exitOpacity,
          transform: `translateY(${exitTranslateY}px)`,
        }}
      >
        {words.map((word, i) => {
          const wordStart = i * STAGGER;
          const enter = spring({
            frame: frame - wordStart,
            fps,
            config: { damping: 200, stiffness: 200, mass: 0.4 },
            durationInFrames: 15,
          });

          const opacity = interpolate(enter, [0, 1], [0, 1]);
          const translateY = interpolate(enter, [0, 1], [24, 0]);
          const scale = interpolate(enter, [0, 1], [0.9, 1]);

          return (
            <span
              key={`${word}-${i}`}
              style={{
                fontFamily,
                fontSize: 72,
                fontWeight: 700,
                color: textColor,
                opacity,
                transform: `translateY(${translateY}px) scale(${scale})`,
                display: "inline-block",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
