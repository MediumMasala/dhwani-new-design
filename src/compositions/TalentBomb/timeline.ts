/**
 * Every timing value for the Talent Bomb interaction lives here, in SECONDS.
 *
 * Nothing else in the folder hardcodes a time, so the whole choreography can be
 * retimed from this one file. Seconds (rather than frames) keep the numbers
 * readable and make the animation identical at 30fps, 60fps or 120fps.
 */
export const TIMELINE = {
  // Phase 1 — the bomb drops into the headline and settles.
  bombEnter: { start: 0.0, end: 0.45 },

  // Phase 2 — the fuse catches. The flame pops, flickers and holds at the tip.
  ignite: { start: 0.45, end: 0.8 },

  // Phase 3 — the loading state. The flame eats its way down the fuse while
  // the bomb gets progressively more impatient.
  burn: { start: 0.8, end: 2.7 },

  // Phase 4 — one last violent shake, then a dead-still held breath.
  finalShake: { start: 2.7, end: 2.82 },
  hold: { start: 2.82, end: 2.9 },

  // Phase 5 — the stylised explosion.
  boom: { start: 2.9, end: 3.2 },

  // Phase 6 — candidates land in the cards and everything settles.
  talent: { start: 3.2, end: 3.5 },
} as const;

/** Total length of the choreography; the composition holds a beat after it. */
export const SEQUENCE_END = TIMELINE.talent.end;

export type Phase = { start: number; end: number };

/** Linear 0 → 1 across a phase, clamped outside it. */
export const phaseProgress = (time: number, phase: Phase) => {
  if (phase.end === phase.start) return time >= phase.end ? 1 : 0;
  const p = (time - phase.start) / (phase.end - phase.start);
  return p < 0 ? 0 : p > 1 ? 1 : p;
};

/**
 * The "held breath" freezes the world for ~80ms before the blast. Anything
 * driven by a continuously running clock (flame flicker, sparks, wobble) reads
 * this clock instead of the raw time, so it stops dead and then resumes
 * without a jump.
 */
export const flowTime = (time: number) => {
  const { start, end } = TIMELINE.hold;
  if (time <= start) return time;
  if (time <= end) return start;
  return time - (end - start);
};
