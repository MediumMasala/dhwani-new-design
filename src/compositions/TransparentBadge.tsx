import { z } from "zod";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const transparentBadgeSchema = z.object({
  label: z.string(),
  badgeColor: z.string(),
  textColor: z.string(),
});

export type TransparentBadgeProps = z.infer<typeof transparentBadgeSchema>;

export const transparentBadgeDefaultProps: TransparentBadgeProps = {
  label: "LIVE",
  badgeColor: "#e0303f",
  textColor: "#ffffff",
};

const ENTER_DURATION = 15;
const EXIT_DURATION = 15;

// No backgroundColor is set on the AbsoluteFill, so this composition's
// canvas stays transparent — render it as ProRes 4444 or a PNG
// sequence (see the README) to keep that alpha channel in your
// editor.
export const TransparentBadge: React.FC<TransparentBadgeProps> = ({
  label,
  badgeColor,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const exitStart = durationInFrames - EXIT_DURATION;

  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
    durationInFrames: ENTER_DURATION,
  });

  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames - 1],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.back(1.5)) },
  );

  const scale = interpolate(enterProgress, [0, 1], [0.6, 1]) * (1 - exitProgress * 0.3);
  const opacity = interpolate(enterProgress, [0, 1], [0, 1]) * (1 - exitProgress);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          backgroundColor: badgeColor,
          borderRadius: 999,
          padding: "20px 48px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            backgroundColor: textColor,
          }}
        />
        <div
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: 2,
            color: textColor,
          }}
        >
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};
