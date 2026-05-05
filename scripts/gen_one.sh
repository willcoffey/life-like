#!/usr/bin/env bash
# Render a single terminal-life rule to .webp.
#
# Usage: ./gen_one.sh <rule>
#
# Output: <rule>.webp in the current directory (overwritten).

set -uo pipefail

RULE="${1:?usage: $0 <rule>}"
WIDTH=50
HEIGHT=50
TICKS=100
SPEED_FACTOR=1

echo ">>> $RULE"
terminal-life --rule "$RULE" \
  --width "$WIDTH" --height "$HEIGHT" \
  -t "$TICKS" \
  --stream \
  --theme inferno \
  --phase \
  --rate 1 \
| ffmpeg \
    -hide_banner -loglevel error \
    -y \
    -f rawvideo \
    -pixel_format rgba \
    -video_size "${WIDTH}x${HEIGHT}" \
    -framerate 10 \
    -i - \
    -vf "select='not(mod(n,2))',setpts=${SPEED_FACTOR}*PTS,format=yuv444p,eq=saturation=1.2:contrast=1.1" \
    -c:v libwebp \
    -preset drawing \
    -q:v 80 \
    -loop 0 \
    "${RULE}.webp"

rc=$?
echo "<<< $RULE (exit $rc)"
exit "$rc"
