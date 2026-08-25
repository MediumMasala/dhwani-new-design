import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { CANVAS } from "./layout";
import { TIMELINE, phaseProgress } from "./timeline";
import { pulse } from "./math";

/**
 * What sits behind the sheet: an out-of-focus portrait.
 *
 * Pass `image` to use a real photo. With no image, the same composition is
 * approximated with blurred CSS shapes — overcast sky, pastel buildings, trees,
 * and a figure in a jacket — which is all that survives a 26px blur anyway.
 */
const ProceduralPortrait: React.FC = () => {
  const shape = (style: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    ...style,
  });

  return (
    <div
      style={{
        position: "absolute",
        // Bleed well past the frame: a 26px blur samples transparency at the
        // edges and would otherwise leave a pale border down each side.
        inset: -90,
        transform: "scale(1.14)",
        filter: "blur(26px)",
        background:
          "linear-gradient(180deg, #B4BCC3 0%, #A3ACB3 20%, #C6CCCB 32%, #A8B0AC 44%, #8E9A93 56%, #97A0A3 100%)",
      }}
    >
      {/* Overcast cloud streaks. */}
      <div
        style={shape({
          left: "-10%",
          top: "2%",
          width: "60%",
          height: "9%",
          borderRadius: "50%",
          background: "#5E666D",
          opacity: 0.45,
        })}
      />
      <div
        style={shape({
          left: "45%",
          top: "8%",
          width: "70%",
          height: "7%",
          borderRadius: "50%",
          background: "#6B737A",
          opacity: 0.4,
        })}
      />

      {/* Pastel buildings along the far bank. */}
      {[
        { left: "-4%", w: "22%", c: "#DCD6C6" },
        { left: "16%", w: "16%", c: "#C9D6CF" },
        { left: "50%", w: "20%", c: "#E9A392" },
        { left: "68%", w: "18%", c: "#D8DACB" },
        { left: "83%", w: "22%", c: "#BFCFC9" },
      ].map((b) => (
        <div
          key={b.left}
          style={shape({
            left: b.left,
            top: "17%",
            width: b.w,
            height: "12%",
            background: b.c,
            opacity: 0.95,
          })}
        />
      ))}

      {/* Tree line. */}
      <div
        style={shape({
          left: "-6%",
          top: "24%",
          width: "52%",
          height: "9%",
          borderRadius: "50%",
          background: "#5C7059",
        })}
      />
      <div
        style={shape({
          left: "58%",
          top: "24%",
          width: "50%",
          height: "9%",
          borderRadius: "50%",
          background: "#516A55",
        })}
      />

      {/* Ground / water. */}
      <div
        style={shape({
          left: 0,
          top: "32%",
          width: "100%",
          height: "68%",
          background: "linear-gradient(180deg, #9AA5A7 0%, #8D9899 100%)",
        })}
      />

      {/* The figure: jacket, shirt, red graphic, head, hair. */}
      <div
        style={shape({
          left: "17%",
          top: "29%",
          width: "66%",
          height: "50%",
          borderRadius: "46% 46% 12% 12% / 34% 34% 8% 8%",
          background: "#6E6252",
        })}
      />
      <div
        style={shape({
          left: "41%",
          top: "29%",
          width: "18%",
          height: "34%",
          background: "#181B20",
        })}
      />
      <div
        style={shape({
          left: "43%",
          top: "35%",
          width: "13%",
          height: "12%",
          borderRadius: "18%",
          background: "#DE2F49",
        })}
      />
      <div
        style={shape({
          left: "40%",
          top: "16%",
          width: "20%",
          height: "15%",
          borderRadius: "48%",
          background: "#C79C7C",
        })}
      />
      <div
        style={shape({
          left: "39%",
          top: "14%",
          width: "22%",
          height: "8%",
          borderRadius: "50% 50% 20% 20%",
          background: "#2B231D",
        })}
      />
      <div
        style={shape({
          left: "41%",
          top: "20%",
          width: "18%",
          height: "2.4%",
          borderRadius: "20%",
          background: "#20242B",
          opacity: 0.85,
        })}
      />
    </div>
  );
};

export const Backdrop: React.FC<{ image?: string; time: number }> = ({
  image,
  time,
}) => {
  // The blast throws a little light back onto the photo.
  const flash =
    pulse(
      phaseProgress(time, {
        start: TIMELINE.boom.start,
        end: TIMELINE.boom.start + 0.22,
      }),
    ) * 0.5;

  return (
    <AbsoluteFill style={{ backgroundColor: "#8E9A96", overflow: "hidden" }}>
      {image ? (
        <Img
          src={staticFile(image)}
          style={{
            width: CANVAS.width,
            height: CANVAS.height,
            objectFit: "cover",
            transform: "scale(1.16)",
            filter: "blur(26px)",
          }}
        />
      ) : (
        <ProceduralPortrait />
      )}

      {/* Vignette — kept outside the blur so the edges stay clean. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 70% at 50% 30%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.28) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 22% at 58% ${interpolate(
            flash,
            [0, 0.5],
            [46, 44],
          )}%, rgba(255,168,64,${flash * 0.55}) 0%, rgba(255,168,64,0) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
