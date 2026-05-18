#!/usr/bin/env bash
# Usage: random_rule.sh COUNT
# Prints COUNT random life-like rules to stdout, one per line.
# Each neighbor-count bit (0..8) is independently included in birth and survive
# sets with 50% probability.
set -euo pipefail
COUNT=${1:?usage: random_rule.sh COUNT}

for ((i = 0; i < COUNT; i++)); do
  b=""
  s=""
  for n in 0 1 2 3 4 5 6 7 8; do
    (( RANDOM % 2 )) && b+="$n"
    (( RANDOM % 2 )) && s+="$n"
  done
  echo "b${b}s${s}"
done
