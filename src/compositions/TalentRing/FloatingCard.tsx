import React, { useMemo } from "react";
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CARD_RADIUS, IDLE_START, type CardSpec } from "./layout";
import { idleWave, lerp, settleWobble } from "./motion";

/**
 * A card is laid out statically at its resting place — `left`/`top` never
 * change — and every frame of animation is expressed as a single `transform`
 * on top of that. Nothing here reads or writes React state, so the whole scene
 * is a pure function of the frame and Remotion can render frames in any order.
 */

/**
 * The fraction of the entry the card has to complete before it drops from its
 * flight stacking order back into its resting one. Late enough that the swap
 * happens while the card is still moving and reads as it settling behind its
 * neighbour, rather than as a visible pop.
 */
const FLIGHT_Z_UNTIL = 0.72;

/** Frames the card takes to reach full opacity. Deliberately short: this is
 *  there to stop a hard pop on the first frame, not to be a fade-in. */
const APPEAR_FRAMES = 6;

/** Frames the idle drift takes to reach full amplitude after the card lands. */
const IDLE_RAMP_FRAMES = 24;

export const FloatingCard: React.FC<{
  spec: CardSpec;
  /** Master multiplier on every card's idle amplitudes. 0 freezes the ring. */
  idleIntensity: number;
  /** Master multiplier on the drop shadows. 0 turns them off. */
  shadowIntensity: number;
}> = ({ spec, idleIntensity, shadowIntensity }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const local = frame - spec.delay;

  // Overshooting spring. `durationInFrames` stretches the same curve shape over
  // the card's own entry length, so retiming a card never changes its feel.
  const progress = spring({
    frame: local,
    fps,
    config: spec.spring,
    durationInFrames: spec.entryFrames,
  });

  // The card is treated as "landed" a little before the spring formally ends —
  // the spring is still creeping back from its overshoot at that point, so the
  // secondary wobble blends into the tail of the entry instead of starting
  // after a dead beat.
  const arrival = spec.delay + spec.entryFrames * 0.55;
  const sinceArrival = (frame - arrival) / fps;

  const settleY = settleWobble(
    sinceArrival,
    spec.settle.amplitude,
    spec.settle.frequency,
    spec.settle.decay,
  );
  const settleRotate = settleWobble(
    sinceArrival,
    spec.settle.rotateAmplitude,
    spec.settle.frequency,
    spec.settle.decay,
  );

  // Idle amplitude ramps in from the card's own landing, but is always at full
  // strength by IDLE_START — which is what lets the tail segment loop.
  const idleGain =
    idleIntensity *
    interpolate(frame, [arrival, arrival + IDLE_RAMP_FRAMES], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const { idle } = spec;
  const idleX =
    idleWave(frame, IDLE_START, idle.periodX, idle.phase) * idle.ampX * idleGain;
  const idleY =
    idleWave(frame, IDLE_START, idle.periodY, idle.phase + 1.1) *
    idle.ampY *
    idleGain;
  const idleRotate =
    idleWave(frame, IDLE_START, idle.periodRotate, idle.phase + 2.2) *
    idle.ampRotate *
    idleGain;

  const offsetX = lerp(spec.from.dx, 0, progress) + idleX;
  const offsetY = lerp(spec.from.dy, 0, progress) + settleY + idleY;
  const scale = lerp(spec.from.scale, spec.scale, progress);
  const rotate = lerp(spec.from.rotate, spec.rotate, progress) + settleRotate + idleRotate;
  const rotateY = lerp(spec.from.rotateY, 0, progress);

  const zIndex =
    spec.flightZIndex !== undefined && progress < FLIGHT_Z_UNTIL
      ? spec.flightZIndex
      : spec.zIndex;

  const opacity = interpolate(local, [0, APPEAR_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Shadow grows with the card's resting depth, so a card in front visibly
  // casts onto the one behind it. This is what carries the stacking read —
  // the resting scales are all exactly 1 so the last frame matches the
  // reference pixel for pixel.
  const shadowLift = (spec.zIndex / 70) * shadowIntensity;
  const boxShadow =
    shadowLift > 0
      ? `0 ${(10 + shadowLift * 26).toFixed(1)}px ${(24 + shadowLift * 46).toFixed(1)}px rgba(0, 0, 0, ${(0.34 + shadowLift * 0.3).toFixed(2)})`
      : undefined;

  const src = useMemo(() => staticFile(spec.image), [spec.image]);

  return (
    <div
      style={{
        position: "absolute",
        left: spec.x - spec.width / 2,
        top: spec.y - spec.height / 2,
        width: spec.width,
        height: spec.height,
        zIndex,
        opacity,
        borderRadius: CARD_RADIUS,
        background: spec.background,
        overflow: "hidden",
        padding: spec.fit === "contain" ? spec.padding : 0,
        boxShadow,
        transform: `translate3d(${offsetX.toFixed(3)}px, ${offsetY.toFixed(3)}px, 0) rotate(${rotate.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg) scale(${scale.toFixed(4)})`,
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        willChange: "transform",
      }}
    >
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: spec.fit,
          display: "block",
        }}
      />
    </div>
  );
};
