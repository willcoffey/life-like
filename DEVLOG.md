# Tue Apr 21 14:26:05 EDT 2026
Starting to clean up an old personal project into a portfolio piece. Getting 
re-aquainted with the source and cleaning it up
 - added dev script, removed unused files

## Rough task list
 - move controls to their own component
 - move DOM stuff to own component, seperate automata logic
 - update to latest vimlike-keybinder
 - ongoing determinism issue
 - get README.md and notes merged.


### working notes
---
noticing some mouse logic in core.ts, I know that actions need to occur between ticks, otherwise
its not deterministic but there should be a away to do it without mouse stuff in core.ts

actually, this serves as a good illustration of the seperation of UI state and core state. mouseModes
is state, but only relevant to a UX that involves a mouse. would a terminal utility set the mouseMode?

conclusion:
grid maintains the mouse position, and uses it to inbetween ticks to perform whatever action is
queued. this is interface agnostic, since you could set "position" via command and queue an action
as a perfectly reasonable way to interact. The issue is that it's mouse specific, and that the 
mouse position is converted by core, when it should be converted by the element & reference a specific
pixel, not the position on the canvas.

alternatively, more generically, you could queue commands to core.ts, which processes them between
ticks. the commands could have bindings of arbitrary serializable vars such as position. i.e. get
rid of tracking mouse position, move to a set of commands that core buffers. limit via the element
not arbitrarily inside core. Address as part of UI overhaul. 
