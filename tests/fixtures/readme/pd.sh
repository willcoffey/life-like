WIDTH=150
HEIGHT=150
TICKS=10
FUTURE_TICKS=10   # README targets 10000 for the wave-synchronization example
SEED_TICKS=150    # how long to settle the sparse-seeded waves state before snapshotting
RULE=r5m0s35-107b10-27m
terminal-life --rule $RULE --reset-random .8,.3 \
  --width $WIDTH --height $HEIGHT --ticks $TICKS --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} \
    -framerate 10 -i - -loop 0 -y "${RULE}.webp"
