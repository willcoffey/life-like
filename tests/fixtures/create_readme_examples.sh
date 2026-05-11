#!/usr/bin/env bash
# Generates every fixture referenced from the README Examples section.
# Variables at the top start small so the whole pipeline can be smoke-tested
# end-to-end before committing to longer runs.
set -euo pipefail
cd "$(dirname "$0")"

WIDTH=120
HEIGHT=240
TICKS=5
FUTURE_TICKS=10  # README targets 10000 for the wave-synchronization example


# ==============================================================================
# PART 1 — no activation function or time smoothing
# ==============================================================================


# ------------------------------------------------------------------------------
# Chaotic life-like rule, still PNG
# ------------------------------------------------------------------------------
RULE=b3456s3456
terminal-life --rule $RULE --reset-random \
  --width $WIDTH --height $HEIGHT --ticks $TICKS \
  --out example_1.png


# ------------------------------------------------------------------------------
# Game of Life animation, initialized with "almost alive" states
# ------------------------------------------------------------------------------
RULE=b3s23
terminal-life --rule $RULE --reset-random \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y gol_animation.webp


# ------------------------------------------------------------------------------
# Flicker example 1 — standard life-like rule
# ------------------------------------------------------------------------------
RULE=b135s23
terminal-life --rule $RULE --reset-random \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}.webp"


# ------------------------------------------------------------------------------
# Flicker example 2 — standard life-like rule
# ------------------------------------------------------------------------------
RULE=b27s368
terminal-life --rule $RULE --reset-random \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}.webp"


# ------------------------------------------------------------------------------
# Flicker example 3 — standard life-like rule
# ------------------------------------------------------------------------------
RULE=b46s2358
terminal-life --rule $RULE --reset-random \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}.webp"


# ------------------------------------------------------------------------------
# LtL favorite 1
# ------------------------------------------------------------------------------
RULE=r3m1s10-15b14-18
terminal-life --rule $RULE --reset-random \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}.webp"


# ------------------------------------------------------------------------------
# LtL favorite 2
# ------------------------------------------------------------------------------
RULE=r5m1s23-32b25-30
terminal-life --rule $RULE --reset-random \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}.webp"


# ------------------------------------------------------------------------------
# LtL favorite 3
# ------------------------------------------------------------------------------
RULE=r2m0s5-9b6-8
terminal-life --rule $RULE --reset-random \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}.webp"


# ------------------------------------------------------------------------------
# LtL phase diagram — size-1 ranges make the fixed midpoint explicit
# ------------------------------------------------------------------------------
RULE=r4m1s22-22b25-25
terminal-life --rule $RULE --reset-random --phase \
  --width $WIDTH --height $HEIGHT --ticks $TICKS \
  --out "${RULE}_phase.png"


# ==============================================================================
# PART 2 — with activation function and/or time smoothing
# ==============================================================================


# ------------------------------------------------------------------------------
# Conway + sin activation, phase diagram animation
# ------------------------------------------------------------------------------
RULE=b3s23
terminal-life --rule $RULE --activation sin --theme managua --phase \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}_sin.webp"


# ------------------------------------------------------------------------------
# Conway + sin activation + time smoothing
# ------------------------------------------------------------------------------
RULE=b3s23
terminal-life --rule $RULE --activation sin --theme managua --phase --rate 3 \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}_sin_smoothed.webp"


# ------------------------------------------------------------------------------
# Wave synchronization — initial animation, advance state, animate again
# ------------------------------------------------------------------------------
RULE=b245s58

terminal-life --rule $RULE --reset-random \
  --width $WIDTH --height $HEIGHT --ticks 0 \
  --out "${RULE}_state_initial.png"

terminal-life --load "${RULE}_state_initial.png" --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}_initial.webp"

terminal-life --load "${RULE}_state_initial.png" --ticks $FUTURE_TICKS \
  --out "${RULE}_state_future.png"

terminal-life --load "${RULE}_state_future.png" --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}_future.webp"
