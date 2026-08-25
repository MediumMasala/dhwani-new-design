/**
 * Layout + colour tokens, transcribed from the reference screenshot.
 *
 * The reference is a 923 x 1920 phone screenshot; every measurement below was
 * taken off it and multiplied by `SCALE` so the design lands on a 1080-wide
 * canvas at the same proportions. Change nothing here unless the UI itself
 * changes — the animation reads all of its positions from these values.
 */
export const CANVAS = { width: 1080, height: 2160 };

/** 1080 / 923 — reference screenshot px → canvas px. */
const SCALE = CANVAS.width / 923;
const px = (referencePx: number) => Math.round(referencePx * SCALE);

export const COLORS = {
  sheet: "#F7F7F7",
  card: "#EFEFEF",
  ink: "#0E0E10",
  inkSoft: "#141416",
  track: "#DFDFE0",
  fill: "#101012",
  flameCore: "#FFF3C4",
  flameMid: "#FFC638",
  flameEdge: "#FF7A18",
  ember: "#FF9A2E",
  smoke: "#A8A8AE",
};

export const SHEET = {
  left: px(12),
  width: px(899),
  top: px(815),
  radius: px(44),
};

export const ACTIVATING = {
  centerY: px(907),
  fontSize: px(33),
  weight: 700,
};

/**
 * The headline is always typeset as the literal string "Talent Bomb" — the
 * bomb simply covers the "o", which is held at zero opacity until the blast
 * hands the letter back. That way the word is laid out and centred by the
 * browser and there is no gap to eyeball.
 */
export const HEADLINE = {
  centerY: px(1035),
  fontSize: px(108),
  weight: 800,
  letterSpacing: px(-3),
  before: "Talent B",
  hidden: "o",
  after: "mb",
  /**
   * Distance from the centre of the "o" slot's line box down to the centre of
   * the "o" glyph itself, as a fraction of the font size. Derived from Inter's
   * vertical metrics (ascender .969em, descender .242em, x-height .546em).
   */
  glyphCenterOffset: 0.09,
};

export const BOMB = {
  radius: px(50),
  /**
   * Rough canvas position of the sphere's centre. The bomb is positioned by
   * the layout (it hangs off the hidden "o"), so this is *only* used to aim
   * candidate chips at the cards and to place the blast's light — a few px of
   * drift there is invisible.
   */
  center: { x: 672, y: px(1035) + px(108) * 0.09 },
};

export const PILL = {
  width: px(476),
  height: px(70),
  top: px(1140),
  radius: px(35),
  fontSize: px(27),
  letterSpacing: px(0.7),
  label: "APPLICANTS IN 10 MINS",
};

export const CARDS = {
  left: px(64),
  width: px(796),
  radius: px(28),
  /** Vertical top edge of each card. */
  tops: [px(1318), px(1560)],
  heights: [px(172), px(170)],
  iconCenterX: px(142),
  iconSize: px(62),
  textLeft: px(232),
  textRight: px(826),
  fontSize: px(34),
  lineHeight: px(44),
  /** Offsets measured from the card's own top edge. */
  singleLineCenterY: px(67),
  twoLineFirstBaselineY: px(52),
  barTop: px(119),
  barHeight: px(12),
};

/** Centre point of a card, in canvas coordinates. */
export const cardCenter = (index: number) => ({
  x: CARDS.left + CARDS.width / 2,
  y: CARDS.tops[index] + CARDS.heights[index] / 2,
});
