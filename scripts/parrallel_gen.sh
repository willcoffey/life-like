#!/usr/bin/env bash
# Render a batch of terminal-life rules to .webp in parallel.
#
# Usage:
#   ./parrallel_gen.sh <rules-file>      # read rules from file
#   ./parrallel_gen.sh -                 # read rules from stdin
#   node gen-rules.js 32 | ./parrallel_gen.sh -
#
# Input format (one rule per line):
#   - Rule strings like:  r5s34-58b34-45d
#   - Blank lines and `#`-prefixed lines are skipped
#   - Inline comments are NOT supported (the whole line is the rule)
#
# Each rule is rendered by ./gen_one.sh, which owns the render settings.

set -uo pipefail

JOBS=4

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <rules-file|->" >&2
  exit 1
fi

src="$1"
[[ "$src" == "-" ]] && src=/dev/stdin

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

grep -vE '^\s*(#|$)' "$src" \
  | xargs -I{} -P "$JOBS" "$here/gen_one.sh" {}
