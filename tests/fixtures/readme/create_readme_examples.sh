#!/usr/bin/env bash
# Generates every fixture referenced from the README Examples section.
# Variables at the top start small so the whole pipeline can be smoke-tested
# end-to-end before committing to longer runs.
set -euo pipefail
cd "$(dirname "$0")"

WIDTH=150
HEIGHT=150
TICKS=100
FUTURE_TICKS=10000   # README targets 10000 for the wave-synchronization example
SEED_TICKS=150    # how long to settle the sparse-seeded waves state before snapshotting


# ==============================================================================
# PART 1 — no activation function or time smoothing
# ==============================================================================


# ------------------------------------------------------------------------------
# README banner — Conway's GoL seeded with "almost alive" states.
# Wide, short canvas so it reads as a banner.
# ------------------------------------------------------------------------------
terminal-life --rule b3s23 --reset-random .15,.9999999999999999 \
  --theme magma --width 800 --height 80 --ticks 75 --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size 800x80 \
    -framerate 10 -i - -loop 0 -y banner.webp


# ------------------------------------------------------------------------------
# Chaotic life-like rule, still PNG
# ------------------------------------------------------------------------------
RULE=b3456s3456
terminal-life --rule $RULE --reset-random \
  --width $WIDTH --height $HEIGHT --ticks $TICKS \
  --out b3456s3456.png


# ------------------------------------------------------------------------------
# Game of Life animation, initialized with "almost alive" states
# ------------------------------------------------------------------------------
RULE=b3s23
terminal-life --rule $RULE --reset-random .15,.9999999999999999 \
--theme magma --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y gol_animation.webp


#
# Animated chaos
#
RULE=b01s78
terminal-life --rule $RULE --reset-random \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}.webp"

# ------------------------------------------------------------------------------
# Faint curves from dying high life value
# ------------------------------------------------------------------------------
RULE=b4567s01457
terminal-life --rule $RULE --reset-random \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}.webp"


# ------------------------------------------------------------------------------
# 
# ------------------------------------------------------------------------------
RULE=b38s12347
terminal-life --rule $RULE --reset-random \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}.webp"


# ------------------------------------------------------------------------------
# Flicker example 3 — standard life-like rule
# ------------------------------------------------------------------------------
RULE=b0237s2345
terminal-life --rule $RULE --reset-random .25,.25:.5\
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}.webp"


# ------------------------------------------------------------------------------
# LtL favorite 1
# ------------------------------------------------------------------------------

RULE=r5m0s35-107b10-27m
terminal-life --rule $RULE --reset-random .8,.3 \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}.webp"


# ------------------------------------------------------------------------------
# LtL favorite 2
# ------------------------------------------------------------------------------
# RULE=r5m1s23-32b25-30m
# RULE=r5m0s40-87b0-31m
RULE=r5m0s64-86b18-69m
terminal-life --theme berlin --rule $RULE --reset-random .5,.5 \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}.webp"


# ------------------------------------------------------------------------------
# LtL favorite 3
# ------------------------------------------------------------------------------
RULE=r5m0s32-36b23-31m
terminal-life --rule $RULE --reset-random .35,.8 \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}.webp"


# ------------------------------------------------------------------------------
# LtL phase diagram — size-1 ranges make the fixed midpoint explicit
# ------------------------------------------------------------------------------
RULE=r5m1s20-20b35-35m
terminal-life --rule $RULE --reset-random .1,.5 --phase \
  --width 300 --height 300 --ticks $TICKS \
  --out "${RULE}_phase.png"

# ==============================================================================
# PART 2 — with activation function and/or time smoothing
# ==============================================================================


# ------------------------------------------------------------------------------
# Conway + sin activation, phase diagram animation
# ------------------------------------------------------------------------------
RULE=b3s23
terminal-life --rule $RULE --activation sin --theme cividis --phase \
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
# Conway + gaussian activation + time smoothing
# ------------------------------------------------------------------------------
RULE=b3s23
terminal-life --rule $RULE --activation gaussian --theme managua --phase --rate 3 \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}_gaussian_smoothed.webp"


# ------------------------------------------------------------------------------
# Conway + smoothstep activation (no time smoothing), zoomed-in phase window
# ------------------------------------------------------------------------------
RULE=b3s23
terminal-life --rule $RULE --activation smoothstep --theme cividis --phase=-0.75:0.75,-0.75:0.75 \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}_smoothstep.webp"


# ------------------------------------------------------------------------------
# Wave synchronization — Conway + sin + sparse seed produces traveling waves.
# Seed → settle → animate → advance FUTURE_TICKS → animate again to show
# patterns synchronizing over time.
# ------------------------------------------------------------------------------
RULE=b3s23

terminal-life --rule $RULE --reset-random .999 --activation sin --theme managua \
  --alpha=-1.35 --beta 3.92 --rate 3 \
  --width $WIDTH --height $HEIGHT --ticks $SEED_TICKS \
  --out waves_initial.png

terminal-life --load waves_initial.png --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y waves_initial.webp

terminal-life --load waves_initial.png --ticks $FUTURE_TICKS \
  --out waves_future.png

terminal-life --load waves_future.png --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y waves_future.webp
