#!/bin/bash
#
# Renders a composition to a GIF that actually looks like the MP4.
#
# `remotion render --codec=gif` quantises with a single global palette and a
# default dither, which speckles photos and shifts colours on dark backgrounds.
# This does the standard two-pass instead: render lossless PNGs, build a palette
# from the whole clip, then map the frames onto it.
#
# Usage: ./scripts/render-gif.sh <CompositionId> <out.gif> [size] [fps] [src_fps]
# Set PROPS to a JSON string to override the composition's default props.
set -euo pipefail

COMP="${1:?composition id required}"
OUT="${2:?output .gif path required}"
SIZE="${3:-720}"
FPS="${4:-15}"

# The PNG sequence is the render's full frame rate; -r drops frames on the way
# into the GIF, so SRC_FPS has to match the composition or the clip changes speed.
SRC_FPS="${5:-30}"

# GIF frame delays are whole centiseconds, so only frame rates that divide 100
# play back at the speed they were rendered at — 30fps becomes 3cs, i.e. 33.3fps
# and a clip that finishes early. Warn rather than refuse: a slightly fast loop
# is sometimes the right trade.
if (( 100 % FPS != 0 )); then
  echo "!! $FPS fps does not divide 100 — the GIF will play at $(python3 -c "print(round(100/round(100/$FPS), 2))") fps" >&2
fi

# Not mktemp: it produces names like `tmp.uqqZNP4mJ1`, and Remotion rejects a
# sequence directory whose path contains a dot as "having an extension".
TMP="${TMPDIR:-/tmp}/remotion-gif-$$"
mkdir -p "$TMP"
trap 'rm -rf "$TMP"' EXIT

echo "==> Rendering $COMP to a PNG sequence"
npx remotion render "$COMP" "$TMP/seq" --sequence --image-format=png --log=error \
  ${PROPS:+--props="$PROPS"}

# Remotion pads the sequence to the width of the last frame's index, so a
# 100-frame clip is element-00.png and a 120-frame one is element-000.png.
# Read the padding off the files rather than assuming either.
FIRST="$(ls "$TMP/seq" | sort | head -1)"
PAD="${FIRST#element-}"
PAD="${#PAD}"
PAD=$((PAD - 4))  # strip ".png"
PATTERN="$TMP/seq/element-%0${PAD}d.png"

echo "==> Building palette"
# stats_mode=diff weights the palette toward pixels that actually change, so a
# large static background does not eat colours the moving content needs.
npx remotion ffmpeg -y -framerate "$SRC_FPS" -i "$PATTERN" \
  -vf "scale=$SIZE:-1:flags=lanczos,palettegen=stats_mode=diff:max_colors=256" \
  "$TMP/palette.png" -loglevel error

echo "==> Encoding GIF"
# sierra2_4a is error-diffusion: cleaner on photographic content than the
# default ordered dither, and it compresses smaller here too.
npx remotion ffmpeg -y -framerate "$SRC_FPS" -i "$PATTERN" -i "$TMP/palette.png" \
  -filter_complex "[0:v]scale=$SIZE:-1:flags=lanczos[s];[s][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle" \
  -r "$FPS" -loop 0 "$OUT" -loglevel error

echo "==> $OUT ($(du -h "$OUT" | cut -f1))"
