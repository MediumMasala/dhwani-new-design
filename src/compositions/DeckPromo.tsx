import { z } from "zod";
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from "remotion";
import { HEADLINE_FONT } from "../fonts";

// Natural size of phones/mockup.png, and the content slot inside its screen.
// The slot is a perfect rectangle already filled with #0B0B0F — the same
// colour CardDeckReel renders on — so footage that overflows it on every side
// meets the mockup's own screen with no visible seam.
const PHONE_IMG = { width: 1138, height: 2210 };
const PHONE_SLOT = { x: 96, y: 238, width: 950, height: 1338 };
// The device's own bounds inside the PNG, which carries transparent margins on
// every side. `phoneWidth` and `phoneTop` describe the device the viewer sees,
// so the layout stays measurable against the reference artwork instead of
// against the asset's padding.
const PHONE_DEVICE = { top: 42, width: 1050 };

export const deckPromoSchema = z.object({
  // Path resolves relative to public/. Expected to be square and to render on
  // the same background colour as the mockup's content slot.
  video: z.string(),
  phone: z.string(),
  backgroundColor: z.string(),
  // Width of the phone artwork in px, measured across the device. The height
  // follows from the PNG's own aspect ratio.
  phoneWidth: z.number().min(100).max(2000),
  // Y of the top of the device. The phone deliberately runs off the bottom of
  // the canvas rather than being fitted inside it, the way the reference
  // artwork crops it.
  phoneTop: z.number().min(-1000).max(1000),
  // Footage width as a multiple of the slot width. Above 1 the square video
  // overflows the slot left and right, which is what lets the cards fill the
  // screen — the overflow is all empty background, and the progress bar at the
  // foot of the source clip is pushed out of the slot and clipped away.
  screenZoom: z.number().min(0.5).max(4),
  // Nudges the footage inside the slot, in canvas px.
  screenOffsetY: z.number().min(-500).max(500),
  // Height in px of the scrim fading the bottom of the frame out to
  // `scrimColor`. 0 is off — with the phone's own body filling the lower
  // third there is usually nothing bright left down there to knock back.
  scrimHeight: z.number().min(0).max(2000),
  // Expects 6-digit hex; the gradient stops append their own alpha.
  scrimColor: z.string(),
  // Branding is inert: every element below is drawn identically on every
  // frame, so nothing here fights the footage for attention. Empty string (or
  // false, for the app buttons) switches an element off.
  headline: z.string(),
  headlineSize: z.number().min(10).max(300),
  logo: z.string(),
  logoHeight: z.number().min(10).max(400),
  cta: z.string(),
  ctaHeight: z.number().min(10).max(400),
  // The in-app dismiss/chat controls sitting on the phone's screen below the
  // card. Drawn in code rather than supplied as artwork.
  showAppButtons: z.boolean(),
  appButtonHeight: z.number().min(20).max(200),
  // Centre line of the app buttons, the logo and the CTA, measured up from the
  // bottom edge. One number keeps all three sitting on the same row.
  bottomRowCenter: z.number().min(20).max(500),
  // Inset for the headline and for the logo/CTA row.
  margin: z.number().min(0).max(300),
});

export type DeckPromoProps = z.infer<typeof deckPromoSchema>;

export const deckPromoDefaultProps: DeckPromoProps = {
  video: "video/card-deck-reel.mp4",
  phone: "phones/mockup.png",
  backgroundColor: "#000000",
  // Proportions taken off the reference artwork: the device spans a little
  // under half the square and its top edge sits just below the headline.
  phoneWidth: 518,
  phoneTop: 206,
  // Sized so the cards reach ~94% of the screen width, which is as close to
  // full-bleed as they can get while the stacked cards behind the front one
  // still peek out above it.
  screenZoom: 1.62,
  screenOffsetY: 15,
  scrimHeight: 0,
  scrimColor: "#000000",
  headline: "TOP BOSSES ARE\nHIRING ON TAL BOSS",
  // The largest size that still keeps the longer second line on one line
  // between the margins.
  headlineSize: 62,
  logo: "brand/logo.png",
  logoHeight: 60,
  cta: "brand/cta.png",
  // The supplied cta.png is a chunkier pill than the one drawn in the
  // reference art, so it is matched on height and left to find its own width.
  ctaHeight: 70,
  showAppButtons: true,
  appButtonHeight: 65,
  bottomRowCenter: 88,
  margin: 56,
};

/** The dismiss control: a translucent disc with an X through it. */
const DismissButton: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: "rgba(255,255,255,0.14)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24">
      <path
        d="M4 4 L20 20 M20 4 L4 20"
        stroke="rgba(255,255,255,0.62)"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </svg>
  </div>
);

/** The primary in-app control: a translucent pill with a chat bubble. */
const StartChatButton: React.FC<{ height: number }> = ({ height }) => (
  <div
    style={{
      height,
      borderRadius: height / 2,
      backgroundColor: "rgba(255,255,255,0.14)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: height * 0.16,
      paddingLeft: height * 0.42,
      paddingRight: height * 0.52,
    }}
  >
    <svg
      width={height * 0.44}
      height={height * 0.44}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M20.5 11.2c0 4.3-3.9 7.8-8.7 7.8-1 0-2-.15-2.9-.43L4 20l1.5-3.6C4.2 15.05 3.3 13.2 3.3 11.2 3.3 6.9 7.2 3.4 12 3.4s8.5 3.5 8.5 7.8Z"
        stroke="rgba(255,255,255,0.62)"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <circle cx="16.6" cy="16.4" r="3.6" fill="rgba(255,255,255,0.62)" />
    </svg>
    <span
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
        fontSize: height * 0.37,
        fontWeight: 500,
        color: "rgba(255,255,255,0.72)",
        whiteSpace: "nowrap",
      }}
    >
      Start Chat
    </span>
  </div>
);

export const DeckPromo: React.FC<DeckPromoProps> = ({
  video,
  phone,
  backgroundColor,
  phoneWidth,
  phoneTop,
  screenZoom,
  screenOffsetY,
  scrimHeight,
  scrimColor,
  headline,
  headlineSize,
  logo,
  logoHeight,
  cta,
  ctaHeight,
  showAppButtons,
  appButtonHeight,
  bottomRowCenter,
  margin,
}) => {
  // Everything inside the phone is laid out in the PNG's own pixel space and
  // then scaled as one unit, so the slot stays locked to the screen whatever
  // `phoneWidth` is set to.
  const scale = phoneWidth / PHONE_DEVICE.width;
  const imgWidth = PHONE_IMG.width * scale;
  const slot = {
    left: PHONE_SLOT.x * scale,
    top: PHONE_SLOT.y * scale,
    width: PHONE_SLOT.width * scale,
    height: PHONE_SLOT.height * scale,
  };
  const videoSize = slot.width * screenZoom;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Soft pool of light behind the phone, so it reads as sitting in the
          black rather than pasted onto it. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 46% 42% at 50% 46%, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 45%, transparent 72%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: `calc(50% - ${imgWidth / 2}px)`,
          top: phoneTop - PHONE_DEVICE.top * scale,
          width: imgWidth,
          height: PHONE_IMG.height * scale,
        }}
      >
        <Img
          src={staticFile(phone)}
          style={{ width: "100%", height: "100%", display: "block" }}
        />

        {/* The mockup's screen is opaque, so the footage goes on top of it and
            is clipped back to the slot rather than showing through. */}
        <div style={{ position: "absolute", overflow: "hidden", ...slot }}>
          <OffthreadVideo
            src={staticFile(video)}
            // The creative is silent — it ships as a GIF, and the MP4 cut is
            // only ever a preview of the same frames.
            muted
            style={{
              position: "absolute",
              width: videoSize,
              height: videoSize,
              left: (slot.width - videoSize) / 2,
              top: (slot.height - videoSize) / 2 + screenOffsetY,
            }}
          />
        </div>
      </div>

      {scrimHeight > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: scrimHeight,
            // Eased rather than a straight ramp: a plain two-stop gradient
            // leaves a visible edge where it starts.
            background: `linear-gradient(to bottom, ${scrimColor}00 0%, ${scrimColor}12 18%, ${scrimColor}38 32%, ${scrimColor}6E 44%, ${scrimColor}A0 54%, ${scrimColor}C8 62%, ${scrimColor}EC 70%, ${scrimColor}FF 76%, ${scrimColor}FF 100%)`,
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

      {showAppButtons ? (
        <div
          style={{
            position: "absolute",
            zIndex: 3,
            left: 0,
            right: 0,
            bottom: bottomRowCenter - appButtonHeight / 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: appButtonHeight * 0.34,
          }}
        >
          <DismissButton size={appButtonHeight} />
          <StartChatButton height={appButtonHeight} />
        </div>
      ) : null}

      {logo ? (
        <Img
          src={staticFile(logo)}
          style={{
            position: "absolute",
            zIndex: 3,
            left: margin,
            bottom: bottomRowCenter - logoHeight / 2,
            height: logoHeight,
          }}
        />
      ) : null}

      {cta ? (
        <Img
          src={staticFile(cta)}
          style={{
            position: "absolute",
            zIndex: 3,
            right: margin,
            bottom: bottomRowCenter - ctaHeight / 2,
            height: ctaHeight,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
