WIDTH=1000
HEIGHT=1000
TICKS=200
RULE=r5m1s20-20b35-35m

# terminal-life --theme magma --rule $RULE --reset-random 0.5,.95 --rule-phase \
#   --width $WIDTH --height $HEIGHT --ticks $TICKS \
#   --out "${RULE}_phase.png"

terminal-life --width $WIDTH --height $HEIGHT --rule r5m0s35-107b10-27m --activation gaussian --theme berlin \
  --alpha 1 --beta 1 --rate 3 --phase=-5:5,-3.14:6.28 --ticks 10 --out r5m0s35-107b10-27m_phase.png
