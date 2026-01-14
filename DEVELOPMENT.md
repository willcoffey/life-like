# Tasks

## Update bindings
Use new keybinder API to update the keybindings with help descriptions

## Add methods for export
Methods for exporting canvas as image, and maybe gif

## Make manual ticking render between ticks

## Consider parameter changes
I could use softmax like LLMs do for a temperature parameter, but this is a
non-local function. It requires summing probs over the entire grid.
Alternatively I could softmax only across neighbors, but this does still require
a second round of calculation vs current function that is just part of the normal tick function.

Actually, I think softmax would fit best after computeNeighborStateOdds but before conways rules
get applied.


## Figure out why it's not deterministic
