# *Almost* Life-Like
<p class="subtitle">A probabilistic extension of Conway's Game of Life and other life-like automata</p>
<img src="tests/fixtures/readme/banner.webp" />

## About
This project is an exploration of extending life-like automata to continuous states by interpreting
state as a probability. This differs from Smoothlife and Lenia, which use a convolution kernel to
get a weighted sum of the neighborhood, then apply a growth function.

The state of each cell is treated as the odds of that cell being alive. The update function 
calculates the odds of there being 0, 1, 2 neighbors alive and so forth. Standard life-like rules
are applied to the probabilities for each discrete state and combined to form the next state.

There is a web interface for exploring patterns and rules and a terminal utility for running the 
model and saving the grid state as PNG images. It can also be combined with `ffmpeg` to create 
animations.

The web app is a vanilla web component which can be found
[here](https://willcoffey.github.io/life-like/demo.html).

## Installation
This project was built for `Deno` but can also be run under `Node` using `tsx`

A build of the web app is included as a vanilla web component which can be viewed in `demo.html` or
by running the dev server.

```
git clone git@github.com:willcoffey/life-like
git submodule update --init
```

### Run or Install via Deno
```
# Run directly
deno run --allow-read --allow-write ./src/terminal-life.ts --help

# Install globally (--config is needed for pngjs dependency)
deno install -g --config ./deno.json --allow-read --allow-write ./src/terminal-life.ts
```

### Run using tsx
```
npm install
npx tsx src/terminal-life.ts --help
```

## Examples
Below are a series of examples that can be copied verbatim to generate 
animations so long as `ffmpeg` and `terminal-life` are properly installed. To
understand what the different options do, see `terminal-life -h` and the 
algorithm section of this doc.

### Basic Pattern
Basic usage to generate a PNG for a life-like rule. Random initial state, 200x200, run for 100 ticks
and saved as `b3456s3456.png`.
```
terminal-life --rule b3456s3456 --reset-random --width 200 --height 100 --ticks 100 --out b3456s3456.png
```

<img src="./tests/fixtures/readme/b3456s3456.png" />

---

We can then load the state and log the json parameters via this command. 
Useful for copying parameters but not grid state to the web app, or inspecting
the settings.
```
terminal-life --load b3456s3456.png --log-json
```

----------------------------------------------------------------------------------------------------

These examples all create animations from simple life-like rules. The only differences in the 
commands are the initial random state and what rule is being applied.

```
terminal-life --rule b01s78 --reset-random --width 150 --height 150 --ticks 100 --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size 150x150 \
    -framerate 10 -i - -loop 0 -y b01s78.webp
```

```
terminal-life --rule b4567s01457 --reset-random --width 150 --height 150 --ticks 100 --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size 150x150 \
    -framerate 10 -i - -loop 0 -y b4567s01457.webp
```

```
terminal-life --rule b0237s2345 --reset-random .25,.25:.5 --width 150 --height 150 --ticks 100 --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size 150x150 \
    -framerate 10 -i - -loop 0 -y b0237s2345.webp
```

<img src="./tests/fixtures/readme/b01s78.webp" width="200" height="200" />
<img src="./tests/fixtures/readme/b4567s01457.webp" width="200" height="200" />
<img src="./tests/fixtures/readme/b0237s2345.webp" width="200" height="200" />

----------------------------------------------------------------------------------------------------

These examples are similar to the above, but use larger than life neighborhoods that include many
more cells.

```
terminal-life --rule r5m0s35-107b10-27m --reset-random .8,.3 --width 150 --height 150 --ticks 100 --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size 150x150 \
    -framerate 10 -i - -loop 0 -y r5m0s35-107b10-27m.webp
```

```
terminal-life --rule r5m0s64-86b18-69m --reset-random .5,.5 --theme berlin --width 150 --height 150 --ticks 100 --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size 150x150 \
    -framerate 10 -i - -loop 0 -y r5m0s64-86b18-69m.webp
```

```
terminal-life --rule r5m0s32-36b23-31m --reset-random .35,.8 --width 150 --height 150 --ticks 100 --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size 150x150 \
    -framerate 10 -i - -loop 0 -y r5m0s32-36b23-31m.webp
```
<img src="./tests/fixtures/readme/r5m0s35-107b10-27m.webp" width="200" height="200" />
<img src="./tests/fixtures/readme/r5m0s64-86b18-69m.webp" width="200" height="200" />
<img src="./tests/fixtures/readme/r5m0s32-36b23-31m.webp" width="200" height="200" />

----------------------------------------------------------------------------------------------------

For larger-than-life rules, there is also the option to render a "phase diagram" which is a 
linear interpolation of the rule space across the x/y coordinates. I.e. the rule being applied
depends on the position on the grid.

```
terminal-life --rule r5m0s35-107b10-27m --reset-random .8,.3 --phase \
  --width 300 --height 300 --ticks 100 \
  --out r5m0s35-107b10-27m_phase.png
```

<img src="./tests/fixtures/readme/r5m0s35-107b10-27m_phase.png" width="300" height="300" />

---

The above examples demonstrate the basic behaviour, and the core idea of this
approach, which is that when values are discrete the behaviour of the system is
identical to standard life-like or larger-than-life behaviour. The rest of the
examples below use activation functions or time-step smoothing that can create 
continuous values from discrete 0/1 states. For this reason I find them less 
mathematically satisfying since you're introducing additional complexity that 
goes against the simple rules to emergent behaviour principle that makes 
automata so interesting. The `sin` and `gaussian` activation functions also use
transcendental math functions which won't be deterministic across machines.

Still, they add a lot of visual interest and an easy means by which to continuously
explore the rule space.

----------------------------------------------------------------------------------------------------

These examples show standard Conway's rules with different activation phase diagrams. The first two
examples create a phase diagram of the `sin` and `smoothstep` activation functions. The second two
examples are `sin` and `gaussian` activation functions with additional time step smoothing and a 
different theme.

```
terminal-life --rule b3s23 --activation sin --theme cividis --phase \
  --width 150 --height 150 --ticks 100 --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size 150x150 \
    -framerate 10 -i - -loop 0 -y b3s23_sin.webp
```

```
terminal-life --rule b3s23 --activation smoothstep --theme cividis --phase=-0.75:0.75,-0.75:0.75 \
  --width 150 --height 150 --ticks 100 --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size 150x150 \
    -framerate 10 -i - -loop 0 -y b3s23_smoothstep.webp
```

```
terminal-life --rule b3s23 --activation sin --theme managua --phase --rate 3 \
  --width 150 --height 150 --ticks 100 --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size 150x150 \
    -framerate 10 -i - -loop 0 -y b3s23_sin_smoothed.webp
```

```
terminal-life --rule b3s23 --activation gaussian --theme managua --phase --rate 3 \
  --width 150 --height 150 --ticks 100 --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size 150x150 \
    -framerate 10 -i - -loop 0 -y b3s23_gaussian_smoothed.webp
```

<img src="./tests/fixtures/readme/b3s23_sin.webp" width="200" height="200" />
<img src="./tests/fixtures/readme/b3s23_smoothstep.webp" width="200" height="200" />
<img src="./tests/fixtures/readme/b3s23_sin_smoothed.webp" width="200" height="200" />
<img src="./tests/fixtures/readme/b3s23_gaussian_smoothed.webp" width="200" height="200" />

----------------------------------------------------------------------------------------------------

One interesting example I found was some wave-like behaviour that shows up in some regions. After
enough ticks the "waves" synchronize across the grid. Generating these animations also showcases the
use case of saving grid state. We can generate an initial image and animation, then tick it 1000s 
of times to save another PNG. And then generate an image from this PNG to see what it looks like
without needing to render the entire animation.

```
# Seed and settle the initial state, save as PNG
terminal-life --rule b3s23 --reset-random .999 --activation sin --theme managua \
  --alpha=-1.35 --beta 3.92 --rate 3 \
  --width 150 --height 150 --ticks 150 \
  --out waves_initial.png

# Animate from the saved initial state
terminal-life --load waves_initial.png --ticks 100 --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size 150x150 \
    -framerate 10 -i - -loop 0 -y waves_initial.webp

# Advance the state forward by 10,000 ticks without rendering
terminal-life --load waves_initial.png --ticks 10000 \
  --out waves_future.png

# Animate the future state
terminal-life --load waves_future.png --ticks 100 --stream \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size 150x150 \
    -framerate 10 -i - -loop 0 -y waves_future.webp
```

<img src="./tests/fixtures/readme/waves_initial.webp" width="200" height="200" />
<img src="./tests/fixtures/readme/waves_future.webp" width="200" height="200" />

----------------------------------------------------------------------------------------------------

## The Algorithm
The basic algorithm continues to use the same standard life-like or larger-than-life rules but uses
a [probability mass function][pmf] to apply the rules to every possible neighbor state and sets the
next state as the sum of all the alive probabilities.

This is achieved by treating the neighborhood as a [poisson binomial distribution][pbd] and 
computing the PMF for each cell via direct convolution.

Once the PMF is computed, each possible state is iterated over and the life-like rule is applied. 
Each state where the cell would be alive is summed.

By following these simple additions not only do you get continuous values for states, but you still 
retain the original behaviour when states are discrete. One part of the grid can have a continuous 
range of values while another is just running standard Conway's rules, with the identical math. 
Furthermore this is not replicable in Lenia, as that is based on a weighted sum of the neighborhood 
using a kernel function. For Lenia, [.5, .5] = [1, 0] whereas for a PMF [.5,.5] is a very different 
situation than [1, 0].

[pmf]: https://en.wikipedia.org/wiki/Probability_mass_function
[pbd]: https://en.wikipedia.org/wiki/Poisson_binomial_distribution

### Activation function and time smoothing

I did add two features from Lenia in addition to the basic algorithm for visual interest and to 
add more parameters to explore. An activation function can be used which takes in the result of 
the previous step and modifies it. Formally:

$$s_{t+1} = f(s_t), \quad f: [0,1] \to [0,1]$$

If the activation function satisfies `f(1) = 1` and `f(0) = 0` you still get the ability to run
discrete simulations. Otherwise continuous values may appear.

The next parameter is the `rate` value which limits the magnitude of the change of state per tick.
With the default rate of 1 the state is just overwritten, but with a rate of 2 only half of the 
state change will be applied. For 3 a third and so forth. Formally:

$$s_{t+1} = s_t + \frac{f(s_t) - s_t}{r}, \quad r \geq 1$$


## Web App
The web app can be run by either visiting the [demo][demo] page or by cloning the repo and opening
`demo.html`. For development, `vite` can be used for hot reloading via `npx vite dev`. The app is
built around vim-style keybindings which operate on key sequences. For example to reset the grid to
random values, you would press `r` then `r`. To reset to random sparse values it would be `r` then
`s`. There is a side pane that shows all current keybindings and allows for clicking them as a 
button instead of via keyboard. 

[demo]: foo

## Terminal Utility
The terminal utility can be used to load, generate, and run the automata as well
as pipe raw data for use in pipelines with `ffmpeg` or other tools. For 
additional details see `terminal-life -h` and the Examples section for basic 
usage.

For loading PNGs, cell state is loaded from the image data but the round trip is lossy. Only
about 8 bits can be recovered from the RGBA values per cell. Additionally, if sharing PNGs some
websites or messengers will strip the `tEXt` blocks which contain the grid parameters. Either ensure
metadata isn't stripped or share separately with the `--log-json` option.

## Parameter Reference
Most options can be discovered through the `terminal -h` help or via the web app interface. However
it is worth noting the parameters that this is meant to explore

- **Rules** : rules are specified in one of two formats. Basic life-like rules can be specified as
a string of the form `b2s23` where the numbers represent how many alive neighbors cause a cell to 
become alive or survive. They can be non-contiguous such as `b157s23`. The second format is a larger 
than life format with more options. `b2s23` would be specified as `r1m0s2-3b3-3m` which decodes as

 - `r1` = radius 1 neighborhood
 - `m0` = middle cell excluded from neighborhood
 - `s2-3` = survive between 2 and 3 neighbors alive, inclusive
 - `b3-3` = become alive for values 3-3. Note that you still need to specify a range for a single value
 - `m` = A Moore neighborhood, i.e. a square with side length = 2r + 1. The other option is `d` for
        disc.

- **Activation Function** : Available activation functions can be seen in the `shapers.ts` file. If
a new function is added to `shapers.ts` it will become available via toggling in the web app or via
the `--activation` option in the terminal app. Activation functions take two tuning parameters, 
`alpha` and `beta` which are linearly interpolated over in phase diagram mode which is useful for
finding patterns.

- **Time Step Smoothing** : Simple scalar value that dampens the effect of each tick. If any other
value besides 1 then discrete 0/1 values will become continuous. i.e. no classic Conway's.


## What's Next?
Honestly I imagine it will be a while before I put more work into this repo. I'm much more 
interested in reversible automata and have some ideas that have more practical potential. This 
project was mostly just because I wasn't satisfied with other continuous extensions. I wanted 
something that respected the underlying discrete rules, but provided additional continuous state. 
That said the next things I would prioritize, in no particular order, would be

 - Better parameter searching. Perhaps latin hypercube sampling. Move away from the 2D phase 
diagrams which are neat, but arbitrarily force 2D parameter searches. 

 - Optimization. The PMF calculation on larger neighborhoods is very low hanging fruit, tons of 
duplicated work because of neighborhood overlap. GPU shaders would be a massive performance 
improvement but would lose determinism across machines. A perfect use case for using the CPU 
version as an oracle for an agent to create a GPU version. 

 - Fractional rules. This model naturally allows for rules that are 50% Conway's and 50% Diamoeba and
any other combination of rules. In practice this would become rules where birth and survive values
can be continuous values.

 - PNG Support in the web app. Would be fairly simple to add, but I would want to be careful about
codebase splitting. Really `terminal-life` and the web app should share the same PNG library and 
functions. This may mean rolling my own PNG tool, like the hand rolled `tEXt` blocks so code can
be shared between terminal and browser.

 - Command recording. In principle `core.ts` can record all input commands for deterministic replay
by either app or terminal utility. The only update needed would be to combine all the `tick` 
commands from playback into a `tick N` command for all consecutive `tick` commands. In most cases it
should fit into `tEXt` blocks and give a means to verify hashes.

 - Making state complex and switching to probability amplitudes would be the most interesting further
extension in my opinion. 

 - Web app should run simulation in a separate web worker to avoid the blocking behaviour when 
the compute time for the next grid is large. Alternatively the tick function could be made async,
but this is a worse solution. 
