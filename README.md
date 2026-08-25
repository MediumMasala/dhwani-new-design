# Motion — Remotion starter

A minimal [Remotion](https://www.remotion.dev) project for designing animated
graphics (title cards, lower thirds, kinetic text, transparent overlays) and
exporting them into any video editor. The four starter compositions are
intentionally plain — swap colors, fonts, and shapes to make them your own.

## Preview

```bash
npm run studio
```

This opens the Remotion Studio, a live preview with a timeline and a panel
for editing each composition's props in real time.

## Project structure

```
src/
  Root.tsx              registers every composition (id, size, fps, schema)
  config.ts             shared video settings — resolution, fps, safe margin
  compositions/          one file per graphic
    TitleCard.tsx
    LowerThird.tsx
    KineticText.tsx
    TransparentBadge.tsx
public/
  fonts/                 static font files, if you add any beyond Google Fonts
  audio/                 sound effects and music (pop.wav is a demo click)
out/                     rendered output lands here (gitignored except .gitkeep)
```

## Changing resolution / fps

Everything reads from [src/config.ts](src/config.ts):

```ts
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = 30;
```

Change these three lines (e.g. to `3840`/`2160`/`60` for 4K60) and every
composition in `src/Root.tsx` picks up the new size and frame rate — nothing
else to touch.

## Adding a new graphic

1. Create `src/compositions/MyGraphic.tsx`. Export:
   - a Zod schema (`myGraphicSchema`) describing its props,
   - default props (`myGraphicDefaultProps`),
   - the component itself, driven by `useCurrentFrame()` and reading
     `fps`/`durationInFrames` from `useVideoConfig()`.
2. Register it in [src/Root.tsx](src/Root.tsx):

   ```tsx
   <Composition
     id="MyGraphic"
     component={MyGraphic}
     durationInFrames={4 * SECOND} // SECOND = VIDEO_FPS, from config.ts
     fps={VIDEO_FPS}
     width={VIDEO_WIDTH}
     height={VIDEO_HEIGHT}
     schema={myGraphicSchema}
     defaultProps={myGraphicDefaultProps}
   />
   ```
3. Run `npm run studio` — it appears in the sidebar with an editable props
   panel generated from your Zod schema.

## Rendering

Render commands take the composition `id` from `src/Root.tsx` and an output
path. Output goes to `out/`.

**MP4 (opaque, e.g. TitleCard, LowerThird, KineticText)**

```bash
npx remotion render TitleCard out/TitleCard.mp4 --codec=h264 --crf=18
```

**Transparent (e.g. TransparentBadge) — MOV with a real alpha channel**

Overlays need an actual alpha channel, not just a black background you key
out later. Use ProRes 4444:

```bash
npx remotion render TransparentBadge out/TransparentBadge.mov \
  --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png
```

Import the resulting `.mov` directly into your editor (Premiere, Final Cut,
DaVinci Resolve, After Effects) — the transparency comes through natively,
no keying required.

**PNG sequence** (per-frame stills, alpha-safe, works with any editor)

```bash
npx remotion render TransparentBadge out/TransparentBadge/frame-%04d.png --image-format=png
```

## Tips

- **Title-safe area**: keep text inside the `TITLE_SAFE_MARGIN` inset
  (`src/config.ts`) so nothing gets clipped by a video editor's title-safe
  guides or a TV's overscan.
- **Always animate a full enter *and* exit**: every starter composition
  fades/slides in near frame 0 and fades/slides out before
  `durationInFrames` ends, so nothing pops in or cuts off abruptly when you
  drop it into a timeline. Follow the same pattern in anything new you add.
- **Trim leading silence on sound effects**: `public/audio/pop.wav` starts
  at full volume with no dead air, so it lands exactly on the frame its
  `<Sequence>` begins. If you drop in your own SFX, trim it the same way —
  otherwise the sound will feel like it's lagging behind the animation.

## Google Fonts

[KineticText.tsx](src/compositions/KineticText.tsx) loads Inter via
`@remotion/google-fonts`:

```tsx
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();
// use fontFamily in a style prop
```

Swap `Inter` for any font listed in the
[`@remotion/google-fonts` docs](https://www.remotion.dev/docs/fonts) — the
import path changes, the rest of the pattern stays the same.

## Sound effects

Also demonstrated in `KineticText.tsx`: play a sound once, at a specific
point in time, by wrapping `<Audio>` in a `<Sequence>`:

```tsx
import { Audio, Sequence, staticFile } from "remotion";

<Sequence durationInFrames={30} layout="none">
  <Audio src={staticFile("audio/pop.wav")} volume={0.5} />
</Sequence>;
```

`staticFile()` resolves paths relative to `public/`. `layout="none"` tells
Remotion this Sequence has no visual footprint of its own.

## TalentRing

A square 1:1 composition on black: eight rounded cards — four company logos and
four portraits — fly in from different directions, settle into a ring around an
empty centre, and then hover there forever.

```bash
npm run studio        # then pick TalentRing
npm run render:ring   # out/TalentRing.mp4
```

### Replacing the placeholder art

Everything under `public/talent-ring/` is a **placeholder** and is meant to be
thrown away. Drop your real files in at the same paths and nothing else needs to
change — or point `image` at a different path in `layout.ts`.

| File | Replace with |
| --- | --- |
| `public/talent-ring/logos/intuit.svg` | The logo, on a **transparent** background |
| `public/talent-ring/logos/amazon.svg` | ” |
| `public/talent-ring/logos/nvidia.svg` | ” |
| `public/talent-ring/logos/swiggy.svg` | ” — white mark, since this card's fill is orange |
| `public/talent-ring/portraits/01.svg` | Portrait photo, top card |
| `public/talent-ring/portraits/02.svg` | Portrait photo, right card |
| `public/talent-ring/portraits/03.svg` | Portrait photo, bottom card |
| `public/talent-ring/portraits/04.svg` | Portrait photo, left card |

PNG and JPG work as well as SVG — the extension only has to match the `image`
path in `layout.ts`.

Logos are drawn with `object-fit: contain` inside the card's `padding`, so a
logo with its own baked-in whitespace will look small; crop it tight. Portraits
are `object-fit: cover` and full-bleed, so they fill the card and centre-crop —
supply something roughly square so the crop does not cut a face off.

The Swiggy card's orange fill is its `background` in `layout.ts`; every other
logo card is white.

### Adjusting the layout

`src/compositions/TalentRing/layout.ts` is the only file you need for tuning.
Each card is one object in the `CARDS` array, and every knob is per-card:

| Field | What it controls |
| --- | --- |
| `x`, `y` | Resting **centre** of the card, in canvas px |
| `width`, `height` | Resting size, in canvas px |
| `scale`, `rotate` | Resting scale and rotation — leave at `1` / `0` to match the reference |
| `zIndex` | Stacking order at rest; higher sits in front |
| `flightZIndex` | Optional stacking order *while flying*, so a card can pass in front and then drop behind as it lands |
| `delay` | Frames to wait before this card starts moving |
| `entryFrames` | Frames the entry takes |
| `spring` | `damping` / `mass` / `stiffness`; lower damping = more overshoot |
| `from` | Where the card comes from, **relative** to its resting place: `dx`, `dy`, `scale`, `rotate`, `rotateY` |
| `settle` | The wobble it carries past its landing: `amplitude` (px), `rotateAmplitude` (deg), `frequency` (Hz), `decay` (s) |
| `idle` | The permanent hover: `ampX` / `ampY` (px), `ampRotate` (deg), `periodX` / `periodY` / `periodRotate` (frames), `phase` (radians) |

Positions are authored against a fixed 1080px square (`CANVAS`) and scaled to
whatever the composition's real width is, so re-rendering at 1440 or 2160 needs
no edits here.

To drop a card, delete its object from `CARDS`. To add one, copy a neighbour and
give it a fresh `id` and `zIndex`.

Scene-wide props live on the composition itself and are editable in the Studio:
`backgroundColor`, `idleIntensity` (`0` freezes the ring once it lands),
`shadowIntensity` (`0` renders the cards flat) and `ringScale`.

### Timing and the idle loop

`IDLE_START` (frame 96) is the point by which every card has landed and its
settle wobble has gone to exactly zero. `IDLE_LOOP` (180 frames) is the length
of the hover that follows, and the composition is exactly `IDLE_START +
IDLE_LOOP` frames long — about 3.2s of assembly then 6s of hover, 9.2s total.

Frames **96–275 loop seamlessly**: every card's idle period is a divisor of
`IDLE_LOOP`, so frame 276 would be pixel-for-pixel identical to frame 96. To
render just the loop:

```bash
npx remotion render TalentRing out/TalentRing-loop.mp4 --frames=96-275 --codec=h264 --crf=18
```

If you change `IDLE_LOOP`, keep every `periodX` / `periodY` / `periodRotate` a
divisor of the new value or the loop point will visibly jump. The current
periods are 60, 90 and 180.

## Commands reference

| Command | What it does |
| --- | --- |
| `npm run studio` | Live preview + prop editor |
| `npm run render:ring` | Render TalentRing to `out/TalentRing.mp4` |
| `npx remotion render <id> out/<id>.mp4 --codec=h264 --crf=18` | Standard MP4 |
| `npx remotion render <id> out/<id>.mov --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png` | Transparent MOV |
| `npx remotion render <id> out/<id>/frame-%04d.png --image-format=png` | PNG sequence |
| `npx remotion upgrade` | Upgrade Remotion to the latest version |

## Docs

[remotion.dev/docs](https://www.remotion.dev/docs/the-fundamentals)
