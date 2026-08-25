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
import { HEADLINE_FONT } from "../fonts";

export const phoneCarouselSchema = z.object({
  // Shown in carousel order. Paths resolve relative to public/.
  images: z.array(z.string()).min(2),
  backgroundColor: z.string(),
  // Colour of the pool of light behind the front phone.
  glowColor: z.string(),
  // Height of the phone art in px; the width follows from the PNG's own
  // aspect ratio because the image is letterboxed with object-fit: contain.
  phoneHeight: z.number().min(100).max(2000),
  // Horizontal gap between neighbouring phones, in px.
  spacing: z.number().min(0).max(1200),
  // How far a neighbour turns away from the camera, in degrees.
  rotation: z.number().min(0).max(90),
  // How far back a neighbour sits, in px.
  depth: z.number().min(0).max(1200),
  // Frames a phone rests dead centre before the carousel turns.
  hold: z.number().min(1).max(240),
  // Frames the turn itself takes.
  transitionDuration: z.number().min(4).max(90),
  showDots: z.boolean(),
  playSound: z.boolean(),
  // Shifts the whole carousel down the canvas, so the branded cut can push the
  // phones past the bottom edge and crop them the way the reference art does.
  verticalOffset: z.number().min(-1000).max(1000),
  // Height in px of the scrim that fades the bottom of the frame out to
  // `scrimColor`, sitting over the phones but under the logo and CTA. 0 is off.
  scrimHeight: z.number().min(0).max(2000),
  // Expects 6-digit hex; the gradient stops append their own alpha.
  scrimColor: z.string(),
  // Branding is inert: every element below is drawn identically on every frame.
  // Animating them in would put a one-shot event inside a clip that is meant to
  // loop forever, so the seam would show on the second pass.
  // Empty string on any of these switches that element off.
  headline: z.string(),
  headlineSize: z.number().min(10).max(300),
  logo: z.string(),
  logoHeight: z.number().min(10).max(400),
  cta: z.string(),
  ctaHeight: z.number().min(10).max(400),
  // Inset for the headline and the logo/CTA row.
  margin: z.number().min(0).max(300),
});

export type PhoneCarouselProps = z.infer<typeof phoneCarouselSchema>;

export const phoneCarouselDefaultProps: PhoneCarouselProps = {
  images: ["phones/01.png", "phones/02.png", "phones/03.png"],
  backgroundColor: "#000000",
  glowColor: "#4C8DFF",
  phoneHeight: 820,
  spacing: 340,
  rotation: 38,
  depth: 320,
  hold: 30,
  transitionDuration: 22,
  showDots: true,
  playSound: false,
  verticalOffset: 0,
  scrimHeight: 0,
  scrimColor: "#000000",
  headline: "",
  headlineSize: 86,
  logo: "",
  logoHeight: 64,
  cta: "",
  ctaHeight: 80,
  margin: 64,
};

/**
 * The branded cut: headline up top, logo and CTA along the bottom, and the
 * phones pushed down so they run off the bottom edge instead of floating.
 */
export const phoneCarouselBrandedProps: PhoneCarouselProps = {
  ...phoneCarouselDefaultProps,
  phoneHeight: 900,
  spacing: 355,
  // The dots would collide with the logo/CTA row, and the row already tells the
  // viewer this is a promo rather than a browsable carousel.
  showDots: false,
  // Drops the phones clear of the headline and lets them run off the bottom
  // edge, so the logo and CTA sit over them rather than beside them.
  verticalOffset: 120,
  // Roughly the bottom 40% of the square, so the phones have gone fully black
  // by the time they reach the logo/CTA row rather than ending on a hard crop.
  scrimHeight: 420,
  scrimColor: "#000000",
  headline: "GREAT BOSSES HIRE\nBEYOND THE RESUME.",
  // Sized so the longer second line fills the width between the margins.
  headlineSize: 56,
  logo: "brand/logo.png",
  logoHeight: 64,
  cta: "brand/cta.png",
  ctaHeight: 80,
  margin: 64,
};

// Strength of the perspective on the carousel's shared 3D context. Smaller
// numbers exaggerate the turn; this is deliberately long so the side phones
// read as angled rather than warped.
const PERSPECTIVE = 1500;

// A phone is fully faded out by the time it is this many slots from centre,
// which is where the wrap-around from one end of the carousel to the other
// happens. With three images the wrap lands at 1.5, so the fade has to finish
// just before that or the jump would be visible.
const FADE_START = 1.05;
const FADE_END = 1.4;

const TURN_SPRING = { damping: 26, mass: 1, stiffness: 90 };

/**
 * Every phone gets one hold plus one turn, so the carousel arrives back at its
 * starting rotation on the frame after the last one — the clip loops seamlessly.
 */
export const phoneCarouselDuration = ({
  images,
  hold,
  transitionDuration,
}: PhoneCarouselProps) => images.length * (hold + transitionDuration);

/**
 * Signed distance from `pos` to slot `i`, taking the short way around a
 * carousel of `n` slots. The result lands in [-n/2, n/2), so the phone that
 * walks off the left edge reappears on the right.
 */
const signedOffset = (i: number, pos: number, n: number) => {
  const forward = (((i - pos) % n) + n) % n;
  return forward > n / 2 ? forward - n : forward;
};

export const PhoneCarousel: React.FC<PhoneCarouselProps> = ({
  images,
  backgroundColor,
  glowColor,
  phoneHeight,
  spacing,
  rotation,
  depth,
  hold,
  transitionDuration,
  showDots,
  playSound,
  verticalOffset,
  scrimHeight,
  scrimColor,
  headline,
  headlineSize,
  logo,
  logoHeight,
  cta,
  ctaHeight,
  margin,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const count = images.length;

  // Every phone owns the same slice of the timeline: rest, then turn.
  const step = hold + transitionDuration;
  const index = Math.floor(frame / step);
  const local = frame - index * step;

  // 0 while the front phone rests, easing to 1 as the carousel turns by one
  // slot — so `pos` is the fractional slot currently facing the camera.
  const advance = spring({
    frame: local - hold,
    fps,
    config: TURN_SPRING,
    durationInFrames: transitionDuration,
  });
  const pos = index + advance;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Pool of light behind the front phone, so the carousel reads as
          floating in the black rather than pasted onto it. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 48% 56% at 50% 50%, ${glowColor}4D 0%, ${glowColor}14 45%, transparent 72%)`,
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          perspective: PERSPECTIVE,
          zIndex: 1,
        }}
      >
        <div
          style={{
            transformStyle: "preserve-3d",
            position: "relative",
            top: verticalOffset,
          }}
        >
          {images.map((src, i) => {
            const offset = signedOffset(i, pos, count);
            const distance = Math.abs(offset);

            const opacity = interpolate(distance, [FADE_START, FADE_END], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            if (opacity === 0) {
              return null;
            }

            return (
              <div
                key={src}
                style={{
                  position: "absolute",
                  top: -phoneHeight / 2,
                  left: -phoneHeight / 2,
                  width: phoneHeight,
                  height: phoneHeight,
                  // The box is square and the art is letterboxed inside it, so
                  // phone PNGs of any aspect ratio stay undistorted.
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: Math.round((2 - distance) * 100),
                  opacity,
                  transform: [
                    `translateX(${offset * spacing}px)`,
                    `translateZ(${-distance * depth}px)`,
                    // Left-hand phones turn their inner edge away from the
                    // camera and right-hand phones do the mirror of it, which
                    // is what makes the row read as a cylinder.
                    `rotateY(${-offset * rotation}deg)`,
                    `scale(${1 - distance * 0.08})`,
                  ].join(" "),
                  filter: `brightness(${interpolate(distance, [0, 1], [1, 0.5], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })}) drop-shadow(0 30px 60px rgba(0,0,0,0.75))`,
                }}
              >
                <Img
                  src={staticFile(src)}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {showDots ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 52,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
          }}
        >
          {images.map((src, i) => {
            // The active dot stretches into a pill, and hands that width to
            // the next dot across the turn rather than popping.
            const nearness = interpolate(
              Math.abs(signedOffset(i, pos, count)),
              [0, 1],
              [1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return (
              <div
                key={src}
                style={{
                  width: interpolate(nearness, [0, 1], [8, 28]),
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: `rgba(255,255,255,${interpolate(
                    nearness,
                    [0, 1],
                    [0.22, 0.9],
                  )})`,
                }}
              />
            );
          })}
        </div>
      ) : null}

      {scrimHeight > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: scrimHeight,
            // Eased rather than a straight ramp: a plain two-stop gradient
            // leaves a visible edge where it starts over the bright phone art.
            background: `linear-gradient(to bottom, ${scrimColor}00 0%, ${scrimColor}1A 25%, ${scrimColor}47 42%, ${scrimColor}80 58%, ${scrimColor}B8 72%, ${scrimColor}E0 85%, ${scrimColor}FF 100%)`,
            zIndex: 2,
          }}
        />
      ) : null}

      {headline ? (
        <div
          style={{
            position: "absolute",
            zIndex: 3,
            top: margin,
            left: margin,
            right: margin,
            textAlign: "center",
            fontFamily: `"${HEADLINE_FONT}", sans-serif`,
            fontWeight: 700,
            fontSize: headlineSize,
            // Obviously Wide is already broad, so the lines are stacked tight
            // to keep the headline reading as one block.
            lineHeight: 0.92,
            letterSpacing: "-0.01em",
            color: "#FFFFFF",
            // The headline is authored with its own line breaks rather than
            // left to wrap, so the two lines balance the way the artwork does.
            whiteSpace: "pre-line",
          }}
        >
          {headline}
        </div>
      ) : null}

      {logo || cta ? (
        <div
          style={{
            position: "absolute",
            zIndex: 3,
            left: margin,
            right: margin,
            bottom: margin,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {logo ? (
            <Img src={staticFile(logo)} style={{ height: logoHeight }} />
          ) : (
            <div />
          )}
          {cta ? (
            <Img src={staticFile(cta)} style={{ height: ctaHeight }} />
          ) : (
            <div />
          )}
        </div>
      ) : null}

      {playSound
        ? images.map((src, i) => (
            <Sequence
              key={src}
              from={i * step + hold}
              durationInFrames={transitionDuration}
              layout="none"
            >
              <Audio src={staticFile("audio/pop.wav")} volume={0.35} />
            </Sequence>
          ))
        : null}
    </AbsoluteFill>
  );
};
