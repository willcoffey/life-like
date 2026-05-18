#!/usr/bin/env bash
# Emit r5m1 (range 5, middle included, Moore = 121-cell neighborhood) rules to
# stdout for a (sLow, bLow) grid search. Pipe into create_diagrams.sh.
#
# Each rule is a point anchor (sLow==sHigh, bLow==bHigh). `--rule-phase` (no
# explicit range) sweeps the full [0, 121] window on both axes from that anchor.
#
# Usage:
#   ./grid_rules.sh | ./create_diagrams.sh -

set -uo pipefail

S_COUNT=7
B_COUNT=8
MAX=121          # neighborhood size for r=5, middle included

# Evenly-spaced integer anchors across [0, MAX] inclusive.
linspace() {
  local n=$1
  awk -v n="$n" -v max="$MAX" 'BEGIN {
    for (i = 0; i < n; i++) printf "%d\n", int(i * max / (n - 1) + 0.5)
  }'
}

mapfile -t s_lows < <(linspace "$S_COUNT")
mapfile -t b_lows < <(linspace "$B_COUNT")

for s in "${s_lows[@]}"; do
  for b in "${b_lows[@]}"; do
    printf 'r5m1s%d-%db%d-%dm\n' "$s" "$s" "$b" "$b"
  done
done
