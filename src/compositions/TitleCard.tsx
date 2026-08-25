import { z } from "zod";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TITLE_SAFE_MARGIN } from "../config";

export const titleCardSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  backgroundColor: z.string(),
  textColor: z.string(),
});

export type TitleCardProps = z.infer<typeof titleCardSchema>;

export const titleCardDefaultProps: TitleCardProps = {
  title: "Your Title Here",
  subtitle: "A subtitle goes here",
  backgroundColor: "#111111",
  textColor: "#ffffff",
};

// How long the enter/exit take, in frames. The middle "hold" fills
// whatever time is left in the composition's durationInFrames.
const ENTER_DURATION = 20;
const EXIT_DURATION = 20;

export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  backgroundColor,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const exitStart = durationInFrames - EXIT_DURATION;

  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.6 },
    durationInFrames: ENTER_DURATION,
  });

  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames - 1],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) },
  );

  const opacity = interpolate(enterProgress, [0, 1], [0, 1]) * (1 - exitProgress);
  const translateY = interpolate(enterProgress, [0, 1], [30, 0]) + exitProgress * -20;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        padding: TITLE_SAFE_MARGIN,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          textAlign: "center",
          maxWidth: `calc(100% - ${TITLE_SAFE_MARGIN * 2}px)`,
        }}
      >
        <div
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: 88,
            fontWeight: 700,
            color: textColor,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: 36,
            fontWeight: 400,
            color: textColor,
            opacity: 0.8,
            marginTop: 20,
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
