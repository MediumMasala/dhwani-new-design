/** Small, pure helpers shared by the cards. No hooks, no state. */

/**
 * Linear blend that deliberately does NOT clamp.
 *
 * `spring()` overshoots past 1 and settles back, and that overshoot is the
 * whole point — feeding it through `interpolate` with the default clamping
 * would flatten every landing into a dead stop.
 */
export const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

/**
 * How many decay constants the wobble is allowed to run for. An exponential
 * never actually reaches zero, and a wobble that is still worth 0.04px at the
 * loop point is enough to change the sub-pixel antialiasing along a card's
 * edge — which makes the seam a hair short of bit-identical even though it is
 * invisible. Windowing it to a hard stop removes that entirely.
 */
const SETTLE_CUTOFF = 3;

/**
 * A decaying oscillation, used for the bit of weight a card carries past its
 * landing. Returns exactly 0 outside [0, SETTLE_CUTOFF * decay], so it costs
 * nothing during the entry and leaves nothing behind afterwards.
 *
 * The exponential is multiplied by a linear window that also reaches 0 at the
 * cutoff, so the wobble is not simply truncated — it arrives at zero smoothly
 * and there is no step in the transform.
 *
 * @param t         seconds since the card arrived
 * @param amplitude peak value at t = 0
 * @param frequency oscillations per second
 * @param decay     seconds for the amplitude to fall to ~1/e
 */
export const settleWobble = (
  t: number,
  amplitude: number,
  frequency: number,
  decay: number,
) => {
  const cutoff = SETTLE_CUTOFF * decay;
  if (t <= 0 || t >= cutoff || amplitude === 0) {
    return 0;
  }
  const envelope = Math.exp(-t / decay) * (1 - t / cutoff);
  return amplitude * Math.sin(2 * Math.PI * frequency * t) * envelope;
};

/**
 * The idle hover: a plain sine keyed off an absolute frame.
 *
 * Because it is keyed off `start` rather than off the card's own arrival, any
 * `period` that divides the idle segment's length produces a seamless loop.
 */
export const idleWave = (
  frame: number,
  start: number,
  period: number,
  phase: number,
) => Math.sin((2 * Math.PI * (frame - start)) / period + phase);
