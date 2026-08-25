/**
 * Geometry for the hiring creative.
 *
 * The card row is one supplied PNG — public/hiring/strip.png, seven cards
 * exported as a single artwork — rather than cards rebuilt in code. Everything
 * below describes where that artwork sits and how far it travels, and the
 * numbers marked "measured" were read off the file's own alpha channel, so
 * re-exporting the strip at a different size means updating STRIP.
 */

/** Portrait 4:5, matching the source artwork. */
export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1350;

/**
 * 25 rather than the project's usual 30. This composition ships as a GIF, and
 * GIF frame delays are whole centiseconds: 25fps is exactly 4cs per frame and
 * plays back at the speed it was rendered, where 30fps rounds to 3cs and runs
 * the four-second loop in three and a half.
 */
export const HIRING_SWIPE_FPS = 25;

/** 4 seconds. */
export const HIRING_SWIPE_DURATION = 4 * HIRING_SWIPE_FPS;

/**
 * The strip artwork, in its own pixels.
 *
 * The file carries a uniform 78px transparent bleed on all four sides for the
 * cards' drop shadows. `inset` is that bleed: the layout aligns the cards the
 * viewer sees, not the file's edges, so the margins below are real margins.
 */
export const STRIP = {
  path: "hiring/strip.png",
  /** Measured: full file size. */
  fileWidth: 8668,
  fileHeight: 1424,
  /** Measured: transparent shadow bleed around the cards. */
  inset: 78,
  /** Measured: one card, and the gap to the next. */
  cardWidth: 1180,
  cardGap: 42,
  cardCount: 7,
} as const;

/** Width of the cards themselves, shadow bleed excluded. */
export const STRIP_CONTENT_WIDTH =
  STRIP.cardCount * STRIP.cardWidth + (STRIP.cardCount - 1) * STRIP.cardGap;

/**
 * Height of a card on the canvas, in canvas px. Everything else about the
 * strip's size follows from this — change it and the cards stay in proportion.
 */
export const CARD_HEIGHT = 634;

/** Scale applied to the artwork to hit CARD_HEIGHT. */
export const STRIP_SCALE = CARD_HEIGHT / (STRIP.fileHeight - STRIP.inset * 2);

/** Vertical centre of the card row. */
export const ROW_CENTER_Y = 838;

/**
 * Inset of the first card at the start of the pass, and of the last card at
 * the end of it. The row is deliberately tighter to the edges than the
 * headline is, exactly as in the artwork.
 */
export const ROW_MARGIN = 42;
