import React from "react";
import { z } from "zod";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { UI_FONT } from "../../fonts";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CARD_HEIGHT,
  ROW_CENTER_Y,
  ROW_MARGIN,
  STRIP,
  STRIP_CONTENT_WIDTH,
  STRIP_SCALE,
} from "./layout";

export {
  CANVAS_WIDTH as HIRING_SWIPE_WIDTH,
  CANVAS_HEIGHT as HIRING_SWIPE_HEIGHT,
  HIRING_SWIPE_FPS,
  HIRING_SWIPE_DURATION,
} from "./layout";

/**
 * The hiring creative: a static headline and wordmark, and the card strip
 * swiping across between them.
 *
 * Two motions are available, and they trade off against each other:
 *
 *   "pass"    — what the reference prototype does. The strip starts with the
 *               first card against the left margin, eases across, and stops
 *               with the last card against the right margin. It is a shot with
 *               a beginning and an end, so a GIF of it cuts back to the start
 *               when it loops.
 *   "marquee" — constant speed, and the strip is drawn twice so it wraps. The
 *               last frame meets the first exactly and the GIF loops with no
 *               seam, at the cost of the cards repeating and of the ease.
 */

export const hiringSwipeSchema = z.object({
  /** Authored line breaks, not wrapping — the artwork balances its own lines. */
  headline: z.string(),
  headlineSize: z.number().min(20).max(200),
  backgroundColor: z.string(),
  textColor: z.string(),
  /** Path under public/ to the seven-card strip artwork. */
  strip: z.string(),
  motion: z.enum(["pass", "marquee"]),
  /** "pass" only. Seconds held on the first card before the strip moves. */
  holdStart: z.number().min(0).max(2),
  /** "pass" only. Seconds held on the last card once it arrives. */
  holdEnd: z.number().min(0).max(2),
  logo: z.string(),
  logoHeight: z.number().min(10).max(400),
  /** The supplied wordmark is white artwork; inverting it makes it black. */
  logoInvert: z.boolean(),
  /** Inset of the headline from the left edge and of the wordmark from the right. */
  margin: z.number().min(0).max(300),
});

export type HiringSwipeProps = z.infer<typeof hiringSwipeSchema>;

export const hiringSwipeDefaultProps: HiringSwipeProps = {
  headline: "Directors of\nEngineering are\nhiring on Tal Boss",
  // The largest size that keeps the longest line inside the margins.
  headlineSize: 100,
  backgroundColor: "#FFFFFF",
  textColor: "#101215",
  strip: STRIP.path,
  motion: "pass",
  holdStart: 0.32,
  holdEnd: 0.68,
  logo: "brand/logo.png",
  logoHeight: 76,
  logoInvert: true,
  margin: 50,
};

export const hiringSwipeDuration = () => 4 * 25;

/** Scaled artwork dimensions, shared by both motions. */
const stripWidth = STRIP.fileWidth * STRIP_SCALE;
const stripHeight = STRIP.fileHeight * STRIP_SCALE;
const contentWidth = STRIP_CONTENT_WIDTH * STRIP_SCALE;
const bleed = STRIP.inset * STRIP_SCALE;
/** Gap between the last card of one copy and the first card of the next. */
const marqueePeriod = contentWidth + STRIP.cardGap * STRIP_SCALE;

export const HiringSwipe: React.FC<HiringSwipeProps> = ({
  headline,
  headlineSize,
  backgroundColor,
  textColor,
  strip,
  motion,
  holdStart,
  holdEnd,
  logo,
  logoHeight,
  logoInvert,
  margin,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps, width } = useVideoConfig();

  // Authored against a fixed canvas and scaled to whatever the composition's
  // real width is, so re-rendering at 2160 needs no changes here.
  const fit = width / CANVAS_WIDTH;

  // x of the artwork's own left edge, which sits `bleed` further left than the
  // first card does. Both motions produce this one number.
  let stripX: number;

  if (motion === "pass") {
    const from = ROW_MARGIN - bleed;
    const to = CANVAS_WIDTH - ROW_MARGIN - contentWidth - bleed;
    const start = holdStart * fps;
    const end = durationInFrames - holdEnd * fps;

    stripX = interpolate(frame, [start, end], [from, to], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      // Slow off the mark and slow into the stop, with the travel itself
      // quick — the same shape a prototype's "ease in and out" gives.
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  } else {
    // One whole period over the clip, so frame `durationInFrames` would land
    // exactly where frame 0 is — that frame is never rendered, which is what
    // makes the loop seamless.
    const travelled = (frame / durationInFrames) * marqueePeriod;
    stripX = ROW_MARGIN - bleed - travelled;
  }

  const rowTop = ROW_CENTER_Y - CARD_HEIGHT / 2;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <AbsoluteFill style={{ transform: `scale(${fit})`, transformOrigin: "0 0" }}>
        <div
          style={{
            position: "relative",
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: margin,
              top: 86,
              right: margin,
              fontFamily: `"${UI_FONT}", sans-serif`,
              fontWeight: 600,
              fontSize: headlineSize,
              lineHeight: 1.06,
              letterSpacing: "-0.035em",
              color: textColor,
              whiteSpace: "pre-line",
            }}
          >
            {headline}
          </div>

          {/*
            The artwork is positioned by its top-left and moved with a
            transform rather than by animating `left`: `left` is a layout
            property and re-lays the row out every frame, which shows up as
            sub-pixel jitter along the card edges.

            In "marquee" the same image is drawn a second time one period to
            the right, so whatever leaves the frame on the left has already
            been replaced on the right.
          */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: rowTop - bleed,
              width: stripWidth,
              height: stripHeight,
              transform: `translate3d(${stripX.toFixed(3)}px, 0, 0)`,
              willChange: "transform",
            }}
          >
            <Img
              src={staticFile(strip)}
              style={{ width: stripWidth, height: stripHeight, display: "block" }}
            />
            {motion === "marquee" ? (
              <Img
                src={staticFile(strip)}
                style={{
                  position: "absolute",
                  left: marqueePeriod,
                  top: 0,
                  width: stripWidth,
                  height: stripHeight,
                  display: "block",
                }}
              />
            ) : null}
          </div>

          {logo ? (
            <Img
              src={staticFile(logo)}
              style={{
                position: "absolute",
                right: margin,
                bottom: 46,
                height: logoHeight,
                // The wordmark ships as white artwork on transparency, so on a
                // light background it has to be flipped rather than recoloured.
                filter: logoInvert ? "invert(1)" : undefined,
              }}
            />
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
