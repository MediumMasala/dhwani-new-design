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

export const lowerThirdSchema = z.object({
  name: z.string(),
  role: z.string(),
  accentColor: z.string(),
  backgroundColor: z.string(),
  textColor: z.string(),
});

export type LowerThirdProps = z.infer<typeof lowerThirdSchema>;

export const lowerThirdDefaultProps: LowerThirdProps = {
  name: "Jane Doe",
  role: "Product Designer",
  accentColor: "#4f7cff",
  backgroundColor: "#1a1a1a",
  textColor: "#ffffff",
};

const ENTER_DURATION = 18;
const EXIT_DURATION = 18;

// A lower third is an overlay: this composition itself has a
// transparent canvas so it can be placed over any footage.
export const LowerThird: React.FC<LowerThirdProps> = ({
  name,
  role,
  accentColor,
  backgroundColor,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const exitStart = durationInFrames - EXIT_DURATION;

  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 160, mass: 0.5 },
    durationInFrames: ENTER_DURATION,
  });

  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames - 1],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) },
  );

  const slideIn = interpolate(enterProgress, [0, 1], [-60, 0]);
  const slideOut = exitProgress * -60;
  const translateX = slideIn + slideOut;
  const opacity = interpolate(enterProgress, [0, 1], [0, 1]) * (1 - exitProgress);

  // The accent bar grows a beat after the card slides in.
  const barWidth = interpolate(enterProgress, [0.3, 1], [0, 64], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: TITLE_SAFE_MARGIN,
          bottom: TITLE_SAFE_MARGIN,
          display: "flex",
          alignItems: "center",
          opacity,
          transform: `translateX(${translateX}px)`,
        }}
      >
        <div style={{ width: barWidth, height: 6, backgroundColor: accentColor }} />
        <div
          style={{
            backgroundColor,
            padding: "16px 32px",
            marginLeft: 4,
          }}
        >
          <div
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: 34,
              fontWeight: 700,
              color: textColor,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: 22,
              fontWeight: 400,
              color: textColor,
              opacity: 0.75,
              marginTop: 2,
            }}
          >
            {role}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
