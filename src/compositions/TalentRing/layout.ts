/**
 * Everything that describes the ring lives here.
 *
 * The composition is a square canvas (see CANVAS below) and every card is
 * positioned by the centre point of its resting place, in canvas pixels. Those
 * numbers were measured off the reference screenshot, so editing them is how
 * you move a card — nothing else in the scene derives from a card's position.
 *
 * Each card owns its own entry, its own settle and its own idle drift, which is
 * what keeps the whole thing from looking like eight things moving in lockstep.
 */

/** Square 1:1, matching the reference. Change both numbers together. */
export const CANVAS = 1080;

export const TALENT_RING_FPS = 30;

/**
 * The last card starts moving at MAX(delay) and takes entryFrames to arrive, so
 * the ring is fully assembled well before IDLE_START.
 *
 * IDLE_LOOP is the length of the seamless tail: every card's idle periods below
 * are divisors of it, and every card's entry/settle motion is finished before
 * IDLE_START — so frames [IDLE_START, IDLE_START + IDLE_LOOP) loop perfectly.
 * If you change IDLE_LOOP, keep the idle periods as divisors of the new value
 * or the loop point will jump.
 */
export const IDLE_START = 96;
export const IDLE_LOOP = 180;
export const TALENT_RING_DURATION = IDLE_START + IDLE_LOOP;

/** Corner radius of every card, in canvas px. */
export const CARD_RADIUS = 26;

export type SpringConfig = {
  damping: number;
  mass: number;
  stiffness: number;
};

export type CardSpec = {
  id: string;
  /** Path under public/. */
  image: string;
  /** Card fill behind the image. Portraits are full-bleed so this never shows. */
  background: string;
  /** "cover" for photos, "contain" for logos that need breathing room. */
  fit: "cover" | "contain";
  /** Inset around a "contain" image, in canvas px. Ignored for "cover". */
  padding: number;

  /** Resting centre of the card, in canvas px. */
  x: number;
  y: number;
  /** Resting size, in canvas px. */
  width: number;
  height: number;
  /** Resting scale and rotation. Keep these at 1 / 0 to match the screenshot. */
  scale: number;
  rotate: number;

  /**
   * Stacking order at rest. Higher sits in front. These reproduce the exact
   * overlap chain in the reference, so change them only in pairs.
   */
  zIndex: number;
  /**
   * Optional stacking order while the card is still flying. Lets a card pass in
   * front of its neighbours on the way in and then drop behind them as it
   * lands, which is what makes the depth read as physical. Omit to keep the
   * resting order for the whole shot.
   */
  flightZIndex?: number;

  /** Frames to wait before this card starts moving. */
  delay: number;
  /** Frames the entry spring is stretched over. */
  entryFrames: number;
  spring: SpringConfig;

  /** Where the card comes from, expressed relative to its resting place. */
  from: {
    dx: number;
    dy: number;
    scale: number;
    rotate: number;
    /** Small Y-axis tilt so the card reads as a physical object turning to face
     *  camera. Set to 0 for a flat, purely 2D entry. */
    rotateY: number;
  };

  /** The little bit of weight the card carries past its landing. */
  settle: {
    /** Vertical wobble in px. */
    amplitude: number;
    /** Rotational wobble in degrees. */
    rotateAmplitude: number;
    /** Oscillations per second. */
    frequency: number;
    /** Seconds for the wobble to fall to ~1/e. Keep short. */
    decay: number;
  };

  /** The permanent hover. Periods are in frames and must divide IDLE_LOOP. */
  idle: {
    ampX: number;
    ampY: number;
    ampRotate: number;
    periodX: number;
    periodY: number;
    periodRotate: number;
    /** Radians. Offsets this card's whole idle cycle from its neighbours'. */
    phase: number;
  };
};

const LOGO_CARD = {
  background: "#FFFFFF",
  fit: "contain",
  padding: 34,
} as const;

const PORTRAIT_CARD = {
  background: "#2A2E33",
  fit: "cover",
  padding: 0,
} as const;

/**
 * The ring, listed clockwise from the top.
 *
 * zIndex runs 10 (Intuit, furthest back) to 70 (Swiggy, front-most) and
 * reproduces the overlap chain in the reference exactly:
 *   Intuit < top portrait < Amazon < right portrait < NVIDIA
 *   < bottom portrait < Swiggy, with the left portrait sitting between the
 *   top portrait and Amazon.
 */
export const CARDS: CardSpec[] = [
  {
    id: "portrait-top",
    ...PORTRAIT_CARD,
    image: "talent-ring/portraits/01.svg",
    x: 533,
    y: 270,
    width: 218,
    height: 230,
    scale: 1,
    rotate: 0,
    zIndex: 20,
    delay: 0,
    entryFrames: 48,
    spring: { damping: 13, mass: 0.95, stiffness: 108 },
    from: { dx: 0, dy: -268, scale: 0.86, rotate: -4, rotateY: 9 },
    settle: { amplitude: 3.4, rotateAmplitude: 0.5, frequency: 2.6, decay: 0.3 },
    idle: {
      ampX: 4,
      ampY: 6,
      ampRotate: 0.45,
      periodX: 180,
      periodY: 90,
      periodRotate: 180,
      phase: 0,
    },
  },
  {
    id: "logo-amazon",
    ...LOGO_CARD,
    image: "talent-ring/logos/amazon.svg",
    x: 731,
    y: 341,
    width: 214,
    height: 206,
    scale: 1,
    rotate: 0,
    zIndex: 30,
    flightZIndex: 90,
    delay: 5,
    entryFrames: 46,
    spring: { damping: 14, mass: 0.9, stiffness: 115 },
    from: { dx: 252, dy: -196, scale: 0.9, rotate: 5, rotateY: -8 },
    settle: { amplitude: 2.6, rotateAmplitude: 0.42, frequency: 2.9, decay: 0.26 },
    idle: {
      ampX: 5,
      ampY: 4,
      ampRotate: 0.3,
      periodX: 90,
      periodY: 180,
      periodRotate: 60,
      phase: 0.8,
    },
  },
  {
    id: "portrait-right",
    ...PORTRAIT_CARD,
    image: "talent-ring/portraits/02.svg",
    x: 818,
    y: 536,
    width: 220,
    height: 206,
    scale: 1,
    rotate: 0,
    zIndex: 40,
    delay: 11,
    entryFrames: 50,
    spring: { damping: 13.5, mass: 1, stiffness: 104 },
    from: { dx: 300, dy: -18, scale: 0.88, rotate: 3.5, rotateY: -10 },
    settle: { amplitude: 3, rotateAmplitude: 0.46, frequency: 2.5, decay: 0.3 },
    idle: {
      ampX: 6,
      ampY: 5,
      ampRotate: 0.4,
      periodX: 180,
      periodY: 60,
      periodRotate: 90,
      phase: 1.7,
    },
  },
  {
    id: "logo-nvidia",
    ...LOGO_CARD,
    image: "talent-ring/logos/nvidia.svg",
    x: 738,
    y: 733,
    width: 214,
    height: 210,
    scale: 1,
    rotate: 0,
    zIndex: 50,
    delay: 17,
    entryFrames: 44,
    spring: { damping: 14.5, mass: 0.88, stiffness: 120 },
    from: { dx: 232, dy: 212, scale: 0.9, rotate: -4.5, rotateY: -7 },
    settle: { amplitude: 2.4, rotateAmplitude: 0.38, frequency: 3, decay: 0.24 },
    idle: {
      ampX: 4,
      ampY: 6,
      ampRotate: 0.28,
      periodX: 60,
      periodY: 180,
      periodRotate: 180,
      phase: 2.5,
    },
  },
  {
    id: "portrait-bottom",
    ...PORTRAIT_CARD,
    image: "talent-ring/portraits/03.svg",
    x: 534,
    y: 811,
    width: 218,
    height: 220,
    scale: 1,
    rotate: 0,
    zIndex: 60,
    delay: 22,
    entryFrames: 50,
    spring: { damping: 13, mass: 1.02, stiffness: 102 },
    from: { dx: 12, dy: 282, scale: 0.87, rotate: 3, rotateY: 8 },
    settle: { amplitude: 3.6, rotateAmplitude: 0.52, frequency: 2.4, decay: 0.32 },
    idle: {
      ampX: 5,
      ampY: 7,
      ampRotate: 0.42,
      periodX: 90,
      periodY: 180,
      periodRotate: 60,
      phase: 3.3,
    },
  },
  {
    id: "logo-swiggy",
    ...LOGO_CARD,
    image: "talent-ring/logos/swiggy.svg",
    background: "#FC8019",
    padding: 46,
    x: 350,
    y: 733,
    width: 212,
    height: 212,
    scale: 1,
    rotate: 0,
    zIndex: 70,
    delay: 28,
    entryFrames: 44,
    spring: { damping: 14, mass: 0.9, stiffness: 118 },
    from: { dx: -242, dy: 218, scale: 0.9, rotate: -3, rotateY: 8 },
    settle: { amplitude: 2.5, rotateAmplitude: 0.4, frequency: 2.9, decay: 0.25 },
    idle: {
      ampX: 4,
      ampY: 5,
      ampRotate: 0.32,
      periodX: 180,
      periodY: 90,
      periodRotate: 90,
      phase: 4.1,
    },
  },
  {
    id: "portrait-left",
    ...PORTRAIT_CARD,
    image: "talent-ring/portraits/04.svg",
    x: 271,
    y: 534,
    width: 218,
    height: 206,
    scale: 1,
    rotate: 0,
    zIndex: 25,
    flightZIndex: 92,
    delay: 33,
    entryFrames: 50,
    spring: { damping: 13.5, mass: 1, stiffness: 106 },
    from: { dx: -302, dy: 28, scale: 0.88, rotate: 4, rotateY: 10 },
    settle: { amplitude: 3.1, rotateAmplitude: 0.48, frequency: 2.5, decay: 0.3 },
    idle: {
      ampX: 6,
      ampY: 4,
      ampRotate: 0.38,
      periodX: 60,
      periodY: 180,
      periodRotate: 180,
      phase: 4.9,
    },
  },
  {
    id: "logo-intuit",
    ...LOGO_CARD,
    image: "talent-ring/logos/intuit.svg",
    x: 341,
    y: 341,
    width: 208,
    height: 210,
    scale: 1,
    rotate: 0,
    zIndex: 10,
    delay: 38,
    entryFrames: 46,
    spring: { damping: 14, mass: 0.92, stiffness: 114 },
    from: { dx: -252, dy: -204, scale: 0.9, rotate: -5, rotateY: 9 },
    settle: { amplitude: 2.6, rotateAmplitude: 0.44, frequency: 2.8, decay: 0.26 },
    idle: {
      ampX: 5,
      ampY: 5,
      ampRotate: 0.34,
      periodX: 90,
      periodY: 60,
      periodRotate: 180,
      phase: 5.6,
    },
  },
];
