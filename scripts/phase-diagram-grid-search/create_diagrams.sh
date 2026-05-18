#!/usr/bin/env bash
# Render rule phase diagrams as high-res mp4s, in parallel, for a batch of rules.
#
# Usage:
#   ./create_diagrams.sh <rules-file>    # read rules from file
#   ./create_diagrams.sh -               # read rules from stdin
#   ./create_diagrams.sh r5m0s70-130b22-82m r12m0s35-107b10-27m   # inline rules
#
# Input format (one rule per line for file/stdin):
#   - Rule strings like:  r5m0s70-130b22-82m
#   - Blank lines and `#`-prefixed lines are skipped
#
# Output (both overwritten in this directory):
#   <rule>_rule_phase_hires.mp4   — animated sweep across --ticks frames
#   <rule>_rule_phase.png         — single image of the final frame

set -uo pipefail
cd "$(dirname "$0")"

JOBS=4
WIDTH=1110
HEIGHT=1110
TICKS=150
FRAMERATE=10

render_one() {
  local RULE="$1"
  echo ">>> $RULE"
  terminal-life --theme inferno --rule "$RULE" --reset-random .25,.5 --rule-phase \
    --width "$WIDTH" --height "$HEIGHT" --ticks "$TICKS" --stream \
    --out "${RULE}_rule_phase.png" \
    | ffmpeg -hide_banner -loglevel error \
        -f rawvideo -pixel_format rgba -video_size "${WIDTH}x${HEIGHT}" \
        -framerate "$FRAMERATE" -i - -c:v libx264 -pix_fmt yuv420p -y \
        "${RULE}_rule_phase_hires.mp4"
  local rc=$?
  echo "<<< $RULE (exit $rc)"
  return "$rc"
}
export -f render_one
export WIDTH HEIGHT TICKS FRAMERATE

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <rules-file|-|rule [rule ...]>" >&2
  exit 1
fi

if [[ $# -eq 1 && ( "$1" == "-" || -f "$1" ) ]]; then
  src="$1"
  [[ "$src" == "-" ]] && src=/dev/stdin
  grep -vE '^\s*(#|$)' "$src" \
    | xargs -I{} -P "$JOBS" bash -c 'render_one "$@"' _ {}
else
  printf '%s\n' "$@" \
    | xargs -I{} -P "$JOBS" bash -c 'render_one "$@"' _ {}
fi
