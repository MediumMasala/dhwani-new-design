import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/**
 * The brand headline face, shared by every branded cut.
 *
 * loadFont holds the render back until the font is ready, which a bare
 * @font-face does not — without it the first frames rasterise in a fallback
 * face and the line breaks land in the wrong place.
 */
export const HEADLINE_FONT = "Obviously Wide";

loadFont({
  family: HEADLINE_FONT,
  url: staticFile("fonts/ObviouslyDemo-WideBold.otf"),
  weight: "700",
}).catch((err) => {
  console.error("Could not load the Obviously headline font", err);
});

/**
 * The UI face used by the hiring creatives — SF Pro Display Semibold, the one
 * weight the artwork is set in.
 *
 * It is loaded from public/ rather than trusted to the machine's own copy:
 * `font-family: "SF Pro Display"` resolves on a designer's Mac and silently
 * falls back to Helvetica on a render farm, which changes every line break.
 */
export const UI_FONT = "SF Pro Display";

loadFont({
  family: UI_FONT,
  url: staticFile("fonts/SF-Pro-Display-Semibold.otf"),
  weight: "600",
}).catch((err) => {
  console.error("Could not load the SF Pro Display font", err);
});
