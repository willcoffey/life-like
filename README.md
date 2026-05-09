@TODO - Progress on terminal command


# *Almost* Life-Like
<p class="subtitle">A Probabilistic extension of Conways Game of Life and other life-like automata</p>
<img src="tests/fixtures/banner.png" />

## About
This project is an exploration of extending life-like automata to continous states by interpreting
state as a probability. This differs from Smoothlife and Lenia, which use convolution kernel to get
a weighted sum of the neighborhood, then apply a growth function.

The state of each cell is treated as the odds of that cell being alive. The array of neighborhood 
states is therefore is a poisson binomial, and we can compute a probability mass function for it. 
This lets us apply standard life-like rules to discrete states that have a probability associated
with them

There is a web interface for exploring patterns and rules, a terminal utility for generating and
loading PNG images and a ffmpeg pipeline for creating `.webp` videos.

A demo page can be found [here](https://willcoffey.github.io/life-like/demo.html) 

## Installation
This project uses [Deno][0] as a runtime, so it must be installed first in order to use the terminal
utility or run the dev server.

### Clone the Repo
```
git clone git@github.com:willcoffey/life-like
git submodule update --init

# Make the terminal utility accessible globally
deno install -g --allow-read --allow-write ./src/terminal-life.ts
```

### Examples
A few example commands to demonstrate the terminal app.

Create a 100x100 png with a deterministic random starting point, tick it 100 times and save as 
`example_1.png`. The rule is one I know to be chaotic. No activation function.

`terminal-life --rule b3456s3456 --reset-random --width 100 --height 100 --ticks 100 --out chaos.png`
<img src = "./tests/fixtures/example_1.png" />

Create a phase diagram for the sin activation function for Conways. Note that we don't need to
initialize the grid to any values since some parameters of the activation function make life from
0 states.
`terminal-life --width 500 --height 500 --rule b3s23 --activation sin --theme managua --ticks 100 --phase --out pd.png`

Create the phase diagram again, but this time with time step smoothing
`terminal-life --width 500 --height 500 --rule b3s23 --activation sin --theme managua --ticks 100 --rate 3 --phase --out pd.png`

Another diagram, this time with the `inferno` theme on the `gaussian` activation function
`terminal-life --width 400 --height 400 --rule b3s23 --activation gaussian --theme inferno --ticks 300 --rate 3 --phase --out phase_3.png`

I zoomed in on an interesting region in the webapp, and used the copy command as a template for this.
This time in the berlin theme.
`terminal-life --reset-random --width 300 --height 300 --rule b3s23 --activation gaussian --theme berlin --alpha 0.3 --beta 0.13 --rate 3 --ticks 150 --out example_5.png`

We can also load the settings from an existing PNG instead of having to input manually every time. 
Cell state is also saved in the PNG image data, but it is rounded so some information is lost on save
`terminal-life --load ./example_5.png --log-json`


We can load this PNG and create webp animation for it using FFMPEG. The width & height has to be
correct.
```
terminal-life --load example_5.png --stream --ticks 100 | \
ffmpeg -f rawvideo -pixel_format rgba -video_size 300x300 -framerate 10 -i - -loop 0 waves.webp
```

An intersting thing about that pattern is it slowly converges over time, if we tick the PNG for many
ticks and generate a new animation this can be seen where the wave like behaviour synchronizes.
`terminal-life --load example_5.png  --ticks 1000 --out example_6.png`

Generate a new animation from the updated PNG.


But enough with the activation functions, they are unsatisfying since it's another thing to add.
lets generate some examples via larger than life rules. no activation function but with a larger
neighborhood.



Generate a phase diagram of the gaussian activation function on Conways rules. The phase window was 
determined via web app exploration and the command copied from it.

From exploring the phase diagram, I saw some interesting pseudo-wave behaviour at a certain part.
After navigating to that region, and fixing the parameters I can generate a few animations. First,
I'll save a PNG to make the next steps more succint.
`
terminal-life --reset-random --width 250 --height 250 --rule b3s23 --activation gaussian --theme managua --alpha 0.238 --beta=-0.130 --rate 5 --ticks 10 --out waves.png
`
Create an animation from the PNG for 100 ticks by piping raw RGBA frames into ffmpeg
```
terminal-life --load waves.png --stream --ticks 100 | \
ffmpeg -f rawvideo -pixel_format rgba -video_size 250x250 -framerate 10 -i - -loop 0 waves.webp
```

---

### The Algorithm
The basic algorithm just uses life-like rules with state values treated as a probability between 
0 and 1 inclusive. I've added additional parameters such as time step smoothing, larger neighborhood
size, and activation functions, but the main point of difference between this and other things like
Lenia and Smoothlife is the probability aspect. These rules cannot be reproduced via convolution 
kernel + growth function. The PMF must be calculated.

The next cell state is calculated by determining the odds for each possible neighborhood state; 1 
alive neighbor, 2 alive neighbors and so forth; and adding up all the probabilities for states where 
the cell would be alive.

In pseudocode
```
state = 0
for(let i=0;i<odds.length;i++) {
    // Where i is the number of alive neighbors and odds[i] is the probability of that state given
    // the cell's neighbors

    // Odds this cell is alive and would survive for this state
    state += cellState * applySurviveRule(i) * odds[i]
    // Odds this cell is dead, but would become alive for this state
    state += (1-cellState) * applyBirthRule(i) * odds[i]
}
```
`odds` is an array 0..N where the value at each index is the probability of that number of neighbors
being alive. It is computed using the direct convolution method for solving binomial poisson 
distributions.

Additional, optional parameters include larger than life neighborhoods, an activation function and 
time step smoothing where:

 - neighborhood : a Moore or disc neighborhood with radius r
 - activation : $f: [0, 1] \to [0, 1]$
 - time smoothing : Reduces the amount that an update applies to a state. Essentially `state = state + change / smoothing`


A property of this approach is that if you have no time step smoothing, and the activation 
function satisfies f(0) = 0 and f(1) = 1 then if you seed the grid with only 0 or 1 values, then it
simply follows the life-like or larger-than-life discrete rules. You only get continuous behaviour
when you introduce a continuous value.

Pains have been taken to keep the output deterministic. This means limiting computation to the CPU
to avoid GPU floating point differences.

### Usage
Most options can be discovered through the `terminal -h` help or via the web app interface. However
it is worth noting the parameters that this is meant to explore

- **Rules** : rules are specified in one of two formats. Basic life-like rules can be specified as
a string of the form `b2s23` where the numbers represent what values cause a cell to become alive or 
survive. They can be non-contigous such as `b157s23`. The second format is a larger than life format
with more options. `b2s23` would be specified as `r1m0s2-3b3-3m` which decods as

 - `r1` = radius 1 neighborhood
 - `m0` = middle cell excluded from neighborhood
 - `s2-3` = survive between 2 and 3 neighbors alive, inclusive
 - `b3-3` = become alive for values 3-3. note that you still need to specify a range for a single value

- **Activation Function** : Available activation functions can be seen in the `shapers.ts` file. If
a new function is added to `shapers.ts` it will becoma available via toggling in the web app or via
the `--activation` option in the terminal app. Activation functions take two tuning parameters, 
`alpha` and `beta` which are linearly interpolated over in phase diagram mode which is useful for
finding patterns.

- **Time Step Smoothing** : Simple scalar value that dampens the effect of each tick. If any other
value besides 1 then discrete 0 1 values will become continous. i.e. no classic conways.



### Web App
The web app is a vanilla-web-component and is bundled with the repo. It can be
viewed by opening the `demo.html` in the root of the repo. It can also be hosted via a vite dev 
server targeting `index.html` via `deno task dev`

### Terminal Utility
The terminal utility can be used to load, generate, and run the automata as well
as pipe raw data for use in pipelines with `ffmpeg` or other tools. For 
additional details see `terminal-life -h`.

To create a basic PNG
`terminal-life --width 100 --height 100 --rule b3s23 --reset-random --out conway.png --ticks 10`

which runs conways with a deterministic random seed. It's not very interesting since conways just
collapses to a blob of the same value. A more interesting rule is `b3456s3456` which produces 
flickering chaos.
`terminal-life --width 100 --height 100 --rule b3456s3456 --reset-random --out chaos.png --ticks 50`

---

load-and-tick

log-json and load + log-json

grid search

ffmpeg



[0]: https://deno.com/
---

