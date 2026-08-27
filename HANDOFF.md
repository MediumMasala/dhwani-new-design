# Handoff — Tal Boss motion project

A [Remotion](https://www.remotion.dev) project: React components rendered
frame by frame into MP4s and GIFs. There is no server and nothing to deploy —
you run a local studio to preview, and a CLI command to render files.

> `README.md` in this folder is the original Remotion starter readme and is out
> of date: it describes four starter compositions, and there are now thirteen.
> Trust this file instead.

## Requirements

- **Node 18 or newer** (built and tested on v24.19.0). Get it from
  [nodejs.org](https://nodejs.org) or via `nvm`.
- macOS or Linux. Renders drive a headless Chrome that Remotion downloads on
  first use, so the first render is slower than the rest.
- ~1.5GB free disk: `node_modules` alone is ~550MB.

## Setup

```bash
npm install
npm run studio
```

The studio opens at <http://localhost:3000> with every composition in the left
sidebar, a timeline, and a props panel that edits each composition's inputs
live. Nothing in the studio is saved back to disk — it is a preview.

## Rendering

Every render command writes into `out/`. **`out/` does not exist in a fresh
copy of this project** — it was a symlink to a folder on the original author's
Desktop, and symlinks do not survive a zip or a git clone. Create it once:

```bash
mkdir -p out
```

Then:

| Command | Output |
| --- | --- |
| `npm run render:swipe` | `out/HiringSwipe.mp4` — the 4:5 hiring creative |
| `npm run render:swipe:gif` | Same, as a 1080px GIF (~25MB) |
| `npm run render:swipe:gif:light` | Same, 810px (~15MB) |
| `npm run render:swipe:loop:gif` | The seamless-loop variant (see below) |
| `npm run render:ring` / `:gif` | TalentRing |
| `npm run render:deck` | CardDeckReel |
| `npm run render:phones` / `:gif` | PhoneCarousel |
| `npm run render:promo` / `:gif` | PhoneCarouselBranded |
| `npm run render:deckpromo` / `:gif` | DeckPromo |

To render anything else, or at a different size:

```bash
npx remotion render <CompositionId> out/whatever.mp4 --codec=h264 --crf=18
```

`npm run lint` runs ESLint and `tsc` together — worth running before you
commit anything.

## The compositions

Registered in [`src/Root.tsx`](src/Root.tsx), one folder or file each under
`src/compositions/`.

| Id | Size | fps | What it is |
| --- | --- | --- | --- |
| `HiringSwipe` | 1080×1350 | 25 | **The current creative.** Hiring card strip swiping past a static headline |
| `TalentRing` | 1080×1080 | 30 | Eight cards flying into a ring, then a seamless idle hover |
| `TalentBomb` | 1080×2160 | 60 | Portrait product UI: fuse burn and blast |
| `CardDeckReel` | 1080×1080 | 30 | Cards travelling through a stacked deck |
| `CardFlipReel` | 1080×1080 | 30 | Cards turning in place |
| `PhoneCarousel` | 1080×1080 | 30 | Phones rotating one slot per image; loops seamlessly |
| `PhoneCarouselBranded` | 1080×1080 | 30 | Same component, headline/logo/CTA switched on |
| `DeckPromo` | 1080×1080 | 30 | CardDeckReel footage composited into a phone mockup |
| `CardFlip` | 1920×1080 | 30 | Single card flip |
| `TitleCard`, `LowerThird`, `KineticText`, `TransparentBadge` | 1920×1080 | 30 | Untouched Remotion starter pieces |

`TransparentBadge` renders with alpha — the README covers the ProRes 4444 /
PNG-sequence commands that preserve it.

## HiringSwipe, in detail

Three files in `src/compositions/HiringSwipe/`:

- **`layout.ts`** — canvas size, frame rate, and the geometry of the card strip.
- **`index.tsx`** — the component: headline, strip, wordmark, and both motions.

The card row is **one supplied PNG**, `public/hiring/strip.png` — seven cards
exported together from Figma, 8668×1424. It is not rebuilt in code, so
changing a name, role, or photo means re-exporting that file. The constants in
`layout.ts` marked "measured" were read off the file's own alpha channel:

- 78px transparent bleed on all four sides, for the cards' drop shadows
- cards are 1180×1268 with 42px gaps

The layout aligns the *cards*, not the file's edges, so the margins are real
margins. If you re-export the strip at a different size, update `STRIP` in
`layout.ts` to match and everything else follows.

### The two motions

`motion: "pass"` (the default) is what the reference prototype does: the strip
starts with the first card against the left margin, eases across, and stops
with the last card against the right margin. It is a shot with a beginning and
an end, **so a GIF of it visibly cuts back to the start when it loops.**

`motion: "marquee"` runs at constant speed and draws the strip twice so it
wraps. The last frame meets the first exactly and the GIF loops with no seam —
at the cost of the cards repeating, and of the ease.

Switch modes from the studio's props panel, or on the CLI:

```bash
npx remotion render HiringSwipe out/loop.mp4 --props='{"motion":"marquee"}'
```

Timing lives in the props too: `holdStart` and `holdEnd` are the seconds held
on the first and last card, and the eased travel fills whatever is left of the
four seconds.

## Two things that will bite you

**GIF frame rates.** GIF frame delays are whole centiseconds, so only frame
rates that divide 100 play back at the speed they were rendered — 25fps is
exactly 4cs, while 30fps rounds to 3cs and runs a four-second clip in three and
a half. That is why `HiringSwipe` is 25fps where the rest of the project is 30.
`scripts/render-gif.sh` warns if you hand it a rate that does not divide 100.

**GIF encoding.** `remotion render --codec=gif` quantises with a single global
palette and speckles photographic content. `scripts/render-gif.sh` does the
standard two-pass instead — render lossless PNGs, build a palette from the
whole clip, map the frames onto it:

```bash
./scripts/render-gif.sh <CompositionId> out/thing.gif [size] [fps] [src_fps]
```

Set `PROPS='{"...":"..."}'` in front of it to override the composition's props.

## Fonts

Both live in `public/fonts/` and are loaded through `src/fonts.ts` with
`loadFont`, which holds the render back until the face is ready — a bare
`@font-face` does not, and the first frames rasterise in a fallback with the
line breaks in the wrong place.

- **Obviously Wide Bold** — the headline face on the older branded cuts.
- **SF Pro Display Semibold** — `HiringSwipe`. Apple's licence does not permit
  redistribution, so if this project ever goes into a public repo, that file
  should come out of it first.

## Assets

```
public/
  hiring/strip.png        the seven-card strip (HiringSwipe)
  brand/logo.png          talboss wordmark, WHITE artwork on transparency —
                          HiringSwipe inverts it to sit on a light background
  brand/cta.png           CTA pill
  cards/, cards/reel/     card artwork for the flip and deck reels
  phones/                 phone screenshots and the mockup frame
  talent-ring/            TalentRing portraits and logos — these are still
                          PLACEHOLDER SVGs, not real photography
  video/card-deck-reel.mp4  pre-rendered footage DeckPromo composites
  audio/pop.wav           demo click
preview/
  HiringSwipe-preview.mp4   what the current creative looks like
```

## Git

This copy includes its `.git` folder, with the full history and no remote
configured. To put it on your own GitHub:

```bash
git remote add origin https://github.com/YOUR-USERNAME/motion.git
git push -u origin main
```

`node_modules/`, `build/`, and `out/` are gitignored.
