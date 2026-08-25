import "./index.css";
import { Composition } from "remotion";
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS, SECOND } from "./config";
import {
  TitleCard,
  titleCardSchema,
  titleCardDefaultProps,
} from "./compositions/TitleCard";
import {
  LowerThird,
  lowerThirdSchema,
  lowerThirdDefaultProps,
} from "./compositions/LowerThird";
import {
  KineticText,
  kineticTextSchema,
  kineticTextDefaultProps,
} from "./compositions/KineticText";
import {
  TransparentBadge,
  transparentBadgeSchema,
  transparentBadgeDefaultProps,
} from "./compositions/TransparentBadge";
import {
  CardFlip,
  cardFlipSchema,
  cardFlipDefaultProps,
} from "./compositions/CardFlip";
import {
  CardFlipReel,
  cardFlipReelSchema,
  cardFlipReelDefaultProps,
  cardFlipReelDuration,
} from "./compositions/CardFlipReel";
import {
  CardDeckReel,
  cardDeckReelSchema,
  cardDeckReelDefaultProps,
  cardDeckReelDuration,
} from "./compositions/CardDeckReel";
import {
  PhoneCarousel,
  phoneCarouselSchema,
  phoneCarouselDefaultProps,
  phoneCarouselBrandedProps,
  phoneCarouselDuration,
} from "./compositions/PhoneCarousel";
import {
  TalentBombScene,
  talentBombSchema,
  talentBombDefaultProps,
  talentBombDuration,
  TALENT_BOMB_FPS,
} from "./compositions/TalentBomb";
import {
  TalentRing,
  talentRingSchema,
  talentRingDefaultProps,
  talentRingDuration,
  TALENT_RING_CANVAS,
  TALENT_RING_FPS,
} from "./compositions/TalentRing";
import {
  HiringSwipe,
  hiringSwipeSchema,
  hiringSwipeDefaultProps,
  hiringSwipeDuration,
  HIRING_SWIPE_WIDTH,
  HIRING_SWIPE_HEIGHT,
  HIRING_SWIPE_FPS,
} from "./compositions/HiringSwipe";
import {
  DeckPromo,
  deckPromoSchema,
  deckPromoDefaultProps,
} from "./compositions/DeckPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TitleCard"
        component={TitleCard}
        durationInFrames={4 * SECOND}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        schema={titleCardSchema}
        defaultProps={titleCardDefaultProps}
      />
      <Composition
        id="LowerThird"
        component={LowerThird}
        durationInFrames={5 * SECOND}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        schema={lowerThirdSchema}
        defaultProps={lowerThirdDefaultProps}
      />
      <Composition
        id="KineticText"
        component={KineticText}
        durationInFrames={3.5 * SECOND}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        schema={kineticTextSchema}
        defaultProps={kineticTextDefaultProps}
      />
      {/*
        Transparent overlay: no backgroundColor is ever set on this
        composition's canvas, so it renders with alpha. See the
        README for the ProRes 4444 / PNG-sequence render commands
        that preserve it.
      */}
      <Composition
        id="TransparentBadge"
        component={TransparentBadge}
        durationInFrames={2.5 * SECOND}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        schema={transparentBadgeSchema}
        defaultProps={transparentBadgeDefaultProps}
      />
      <Composition
        id="CardFlip"
        component={CardFlip}
        durationInFrames={2.5 * SECOND}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        schema={cardFlipSchema}
        defaultProps={cardFlipDefaultProps}
      />
      {/*
        Square 1:1 canvas rather than the project's 16:9 — the duration is
        derived from the props so changing the holds or the image list
        automatically retimes the composition.
      */}
      <Composition
        id="CardFlipReel"
        component={CardFlipReel}
        durationInFrames={cardFlipReelDuration(cardFlipReelDefaultProps)}
        fps={VIDEO_FPS}
        width={1080}
        height={1080}
        schema={cardFlipReelSchema}
        defaultProps={cardFlipReelDefaultProps}
      />
      {/*
        Same square 1:1 canvas as CardFlipReel, but the cards travel through a
        stacked deck instead of turning in place. Duration is derived from the
        props, so editing the image list or the holds retimes it automatically.
      */}
      <Composition
        id="CardDeckReel"
        component={CardDeckReel}
        durationInFrames={cardDeckReelDuration(cardDeckReelDefaultProps)}
        fps={VIDEO_FPS}
        width={1080}
        height={1080}
        schema={cardDeckReelSchema}
        defaultProps={cardDeckReelDefaultProps}
      />
      {/*
        Square 1:1 canvas on black. The phones turn by exactly one slot per
        image, so the last turn lands back on the first phone and the clip
        loops seamlessly — there is deliberately no intro or outro fade.
      */}
      <Composition
        id="PhoneCarousel"
        component={PhoneCarousel}
        durationInFrames={phoneCarouselDuration(phoneCarouselDefaultProps)}
        fps={VIDEO_FPS}
        width={1080}
        height={1080}
        schema={phoneCarouselSchema}
        defaultProps={phoneCarouselDefaultProps}
      />
      {/*
        Same component and same square canvas as PhoneCarousel, but with the
        headline, logo and CTA switched on — compositions here are just prop
        presets over the one carousel.
      */}
      <Composition
        id="PhoneCarouselBranded"
        component={PhoneCarousel}
        durationInFrames={phoneCarouselDuration(phoneCarouselBrandedProps)}
        fps={VIDEO_FPS}
        width={1080}
        height={1080}
        schema={phoneCarouselSchema}
        defaultProps={phoneCarouselBrandedProps}
      />
      {/*
        Portrait product UI at 1080x2160, and the only composition that runs at
        60fps — the micro-interaction lives or dies on how smooth the fuse burn
        and the blast read, and 30fps is not enough for either.
      */}
      <Composition
        id="TalentBomb"
        component={TalentBombScene}
        durationInFrames={talentBombDuration(talentBombDefaultProps)}
        fps={TALENT_BOMB_FPS}
        width={1080}
        height={2160}
        schema={talentBombSchema}
        defaultProps={talentBombDefaultProps}
      />
      {/*
        The finished CardDeckReel clip dropped into the branded square: headline
        up top, scrim over the bottom of the footage, logo and CTA on top of it.
        The duration is taken from CardDeckReel rather than hardcoded, so
        re-rendering that clip longer or shorter retimes this one to match.
      */}
      {/*
        Square 1:1 on black, recreating the reference ring of eight cards. The
        entry runs for the first ~3s and the remaining frames are a seamless
        idle hover — see IDLE_START / IDLE_LOOP in TalentRing/layout.ts, which
        is also where every card's position and motion lives.
      */}
      <Composition
        id="TalentRing"
        component={TalentRing}
        durationInFrames={talentRingDuration()}
        fps={TALENT_RING_FPS}
        width={TALENT_RING_CANVAS}
        height={TALENT_RING_CANVAS}
        schema={talentRingSchema}
        defaultProps={talentRingDefaultProps}
      />
      {/*
        The 4:5 hiring creative: a static headline and wordmark over a strip of
        cards that swipes left to right. The strip travels exactly one whole
        roster length across the clip, so the last frame meets the first and
        the GIF loops with no seam — see HiringSwipe/layout.ts.
      */}
      <Composition
        id="HiringSwipe"
        component={HiringSwipe}
        durationInFrames={hiringSwipeDuration()}
        fps={HIRING_SWIPE_FPS}
        width={HIRING_SWIPE_WIDTH}
        height={HIRING_SWIPE_HEIGHT}
        schema={hiringSwipeSchema}
        defaultProps={hiringSwipeDefaultProps}
      />
      <Composition
        id="DeckPromo"
        component={DeckPromo}
        durationInFrames={cardDeckReelDuration(cardDeckReelDefaultProps)}
        fps={VIDEO_FPS}
        width={1080}
        height={1080}
        schema={deckPromoSchema}
        defaultProps={deckPromoDefaultProps}
      />
    </>
  );
};
