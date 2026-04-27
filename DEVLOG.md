# Mon Apr 27 12:18:50 PM EDT 2026
Completed general refactor of controls / state. Just deleted the old mouse brush controls, may add
back at some point but were too out of sync with the architecture.

Extracted activation functions and started assigning them default windows for phase diagram
rendering.

Moved switch statement for stdin to a Controls object with "pure" functions that mutate grid state.

misc hosuekeeping and bugfixes

---

Grid state is still not fully defined, contains two types of state.
 - State required to compute next tick. The majority of state.
 - State required for rendering / playback. Just 
    - theme : which is needed to render to image and render from image.
    - playing : which is read by the webcomponent, which then calls tick. This is the main
    piece I want to remove eventually. means that recording stdin would result in 1000's of tick
    commands if playing a lot. still need to think through the async "tick 100" pattern with a 
    command buffer and mutated recording log.
    


# Sun Apr 26 10:26:19 AM EDT 2026
The general refactor is done, and now I need to wire in the controls. First I'll knock out a few
simple things before getting into it.
 - update the reset random function to do linear interpolation of denisty / range
 - eventaully update controls for component - directions change the range of the phase diagram
with zoom in and out.

I've got the activation functions mostly wired in. Not getting the results I had before, need to 
look into them. Also need to update my function to use 2 params instead of 3 so it can be 
interpolated over.

## Rewiring input
Phase diagram movement, zoom, parameter selection prototyped out. Functioning.

- Need default phase diagram params for each activation function
- Need to validate ranges on phase diagram to avoid issues when with params
- Need to wire in controls for change rate control
- Need to wire in controls for activation function change


# Sat Apr 25 05:16:54 PM EDT 2026
I've been playing around with various parameters and tuning. Generating phase diagrams by tweaking
params by x/y is cool, really useful insight into the changes a different shaping function makes.

That said, I need to stop playing around making patterns and do a basic, minimal refactor. get the
parameter stuff out of main function. delete dead code. clean up hacks. 

---

Finished refactor on core.ts, cleaning up and getting ready for some features. Still lots to 
go.

now need to decide on full grid props that account for state. width, height, alpha, beta, change rate
etc. and get rid of the old ones.

start with terminal utility setting up functionality via args
 - theme
 - a, b, r = alpha beta rate
 - phase diagram with min & max
 - activation - sigmoid, power, gaussian


# Fri Apr 24 01:32:49 AM EDT 2026

I'm about to move on the metadata saving in the PNG for the non-cell graph state, but wanted to get
down some architecture thoughts first.

I want the web component to do as little as possible, mostly just a renderer with the underlying
platform agnostic core code running most UX. At the same time, cursor position and mouse modes are
not really relevant to a terminal app. 

But, I do want to be able to record a web session, and send it to the terminal. the ability to do 
this shows good seperation.

---

I made a fair amount of progress, got terminal PNG saving w/metadata and loading complete. Albeit
with only ~8 bits of recovery from the loading as a bunch of data is lost in the image.

I'm also approaching how much time I want to put into this project, and know there is more I would
want to do. So it's a good time to make a rough list of what to do, what not to do, and what the
minimum is.

 - *README.md* - Final thing, need to document
 - *core.test.ts* - Now that png saving/loading is done, it's easier to write some tests. just basic
run - save - load - run check if same type thing. Need to think about it a little more as I 
eventually intend this as a test case for 1-shotting via agent a version of core that uses shaders.
 - Dead code cleanup, and general cleaning and readability refactor
 - *web-component* - Need to get basic UX. Polish the brush briefly, outline the vim controls but
I'm not going to try to make a lay-interface. maybe do some agent frontend gen. one more keybinding
for theme toggle. maybe revisit when I polish vimlike.
 - *logit and smoothing* - finalize these
 - Find a bunch of params for pretty patterns. use one on my blog as header. maybe some imagemagick
gif from png
 - *per-frame-png* option for terminal utility, for making pretty gifs
 - *blog post*








# Thu Apr 23 11:56:27 AM EDT 2026
Added a bunch of themes for colors based on human color perception. Unlike my handrolled method
these themes don't cover the entire color space, so I can't import arbitrary images and expect
them to work. Will address that later.

Next task is getting a deno terminal utility to be able to generate images, and tests for
performance of it.

---

stubbed out a terminal utility with ability to save pngs. Need to polish it with options and
add grid settings via png metadata


could I change it to nudge slightly in a direction. make continous in time

`t_2 = (f(t_1) + t_1) / 2`?

that had a cool effect

---

1. should I refactor play() to be web component only? And have component call tick.
2. Finalize non-grid state

logit params
time smoothing
width, height
rules ????

Then I have to think about UX state. I.e. cursor position

If I ever want UX state shared, such as what param I'm tuning or where the c
cursor is, I should keep it platform agnostic.

what will the terminal utility look like

replaying a list of commands from a file for things like symmetry, resets, brush strokes?

Either I need commands embedded as json: { toggleCell: [112, 223] } etc

or

'moveDown'
'moveDown'
'moveDown'
'moveRight'
'tick'
'tick'
'tick'
'toggleCell'

do I even care about this?

I need a way to load data in and out in command line right?

but that could just be

{ import: [0,0], data : "foo.bin" }



---
## scratch

stdin is interface, a list of commands can be saved and replayed
vlk directly binds to stdin, so if I want an action it must be bound to a command

don't want list stdin commands to bloat too much
if maps to vlk, it maxes out at total keybindings, which isn't too bad


# Wed Apr 22 11:18:41 AM EDT 2026
Continued getting stuff moved into custom components. Appears ok in browser, now just need to 
decide on what final features I want and write a post.

in no particular order
 - fix the brush controls
 - decide on VIRIDIS scheme, maybe add themes
 - investigate poisson binomials
 - re-vamp keybindings to for param selection vs individual keys
 - canvas size as element params

---

## Quick status update
 - got direct convolution solver for poisson binomial so it runs much faster
 - determinism should be fixed via sorting neighbors since floating point stuff not communitive

## Rough task list
 - refactor core to use a stack of pending operations, get rid of mouse state
 - create terminal utility for generating images
 - idea : x/y coord determines what prob modifier to follow



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
