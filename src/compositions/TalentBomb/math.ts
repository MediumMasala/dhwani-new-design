/**
 * Deterministic helpers.
 *
 * Remotion renders every frame in a fresh pass (and often out of order across
 * several workers), so `Math.random()` would produce a different picture on
 * every frame and a different video on every render. Every "random" value in
 * this animation therefore comes from `seeded()` — a pure hash of an integer.
 */

/** Stable pseudo-random in [0, 1) for an integer seed. */
export const seeded = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};

/** Stable pseudo-random in [min, max) for an integer seed. */
export const seededRange = (seed: number, min: number, max: number) =>
  min + seeded(seed) * (max - min);

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export type Point = { x: number; y: number };

/** Point on a cubic Bézier at t ∈ [0, 1]. */
export const cubicPoint = (
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number,
): Point => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
};

/** Point on a quadratic Bézier at t ∈ [0, 1]. */
export const quadPoint = (p0: Point, p1: Point, p2: Point, t: number): Point => {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
};

/** Turns a list of points into an SVG polyline `d` string. */
export const pathFromPoints = (points: Point[]) =>
  points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

/**
 * Smooth 0 → 1 → 0 pulse, used for one-shot flashes and squashes.
 * Peaks at t = 0.5.
 */
export const pulse = (t: number) => Math.sin(clamp01(t) * Math.PI);
