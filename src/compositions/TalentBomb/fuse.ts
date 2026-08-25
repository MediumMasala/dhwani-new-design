import { Easing, interpolate } from "remotion";
import { TIMELINE, phaseProgress } from "./timeline";
import { cubicPoint, pathFromPoints, type Point } from "./math";

/**
 * Fuse geometry, in bomb-local coordinates: the sphere is centred on (0, 0)
 * with radius `r`, y grows downwards (SVG convention).
 *
 * The fuse is a single cubic Bézier running from the cap on the bomb's upper
 * right (t = 0) out to the free tip (t = 1). Because it is described
 * analytically rather than measured off the DOM, the flame's position can be
 * computed on any frame without touching the browser — which is what keeps the
 * burn identical between the Studio preview and a headless render.
 */
export const fuseCurve = (r: number): [Point, Point, Point, Point] => [
  { x: 0.66 * r, y: -0.86 * r },
  { x: 1.42 * r, y: -1.02 * r },
  { x: 1.02 * r, y: -1.88 * r },
  { x: 1.74 * r, y: -2.18 * r },
];

/**
 * How much of the fuse has been eaten, 0 → 1.
 *
 * Eased so the flame creeps at first and accelerates into the bomb: the burn
 * should feel like it is running out of patience, not like a linear progress
 * bar.
 */
export const burnAt = (time: number) =>
  interpolate(phaseProgress(time, TIMELINE.burn), [0, 1], [0, 1], {
    easing: Easing.bezier(0.32, 0.06, 0.66, 0.4),
  });

/** Bézier parameter the flame sits at — it walks from the tip back to the cap. */
export const flameParamAt = (time: number) => 1 - burnAt(time);

/** Flame position in bomb-local coordinates. */
export const flamePointAt = (time: number, r: number): Point =>
  cubicPoint(...fuseCurve(r), flameParamAt(time));

/**
 * The part of the fuse that has not burned yet, as an SVG path. Sampling the
 * curve (rather than trimming a stroke with a dash offset) keeps the rope's
 * end cap square against the flame at every burn level.
 */
export const remainingFusePath = (time: number, r: number, samples = 26) => {
  const end = flameParamAt(time);
  const curve = fuseCurve(r);
  const points: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    points.push(cubicPoint(...curve, (i / samples) * end));
  }
  return pathFromPoints(points);
};

/**
 * The last stretch of rope right behind the flame, drawn charred. `from` and
 * `to` are fractions of the *remaining* fuse.
 */
export const charredFusePath = (
  time: number,
  r: number,
  from = 0.82,
  samples = 8,
) => {
  const end = flameParamAt(time);
  const curve = fuseCurve(r);
  const points: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = from + (i / samples) * (1 - from);
    points.push(cubicPoint(...curve, t * end));
  }
  return pathFromPoints(points);
};
