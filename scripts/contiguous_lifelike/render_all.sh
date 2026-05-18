#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

WIDTH=100
HEIGHT=100
TICKS=10
FRAMERATE=10
PARALLEL=4

TOTAL=$(wc -l < all_contiguous_lifelike_rules.txt)

render_rule() {
  local rule="$1"
  terminal-life --rule "$rule" --reset-random \
    --width "$WIDTH" --height "$HEIGHT" --ticks "$TICKS" --stream \
    | ffmpeg -loglevel error -f rawvideo -pixel_format rgba \
        -video_size "${WIDTH}x${HEIGHT}" -framerate "$FRAMERATE" -i - \
        -pix_fmt yuv420p -y "${rule}.mp4"
  local done
  done=$(find . -maxdepth 1 -name '*.mp4' | wc -l)
  printf '[%d/%d] %s\n' "$done" "$TOTAL" "$rule"
}
export -f render_rule
export WIDTH HEIGHT TICKS FRAMERATE TOTAL

xargs -a all_contiguous_lifelike_rules.txt -n 1 -P "$PARALLEL" \
  bash -c 'render_rule "$@"' _
