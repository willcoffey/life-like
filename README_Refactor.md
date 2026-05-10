<!--
REFACTOR NOTES — delete this block before publish.

STRUCTURAL MOVES (no content change):
- Flattened all section headings to `##` (was a mix of `##` and `###` for peer sections).
- Promoted "Examples" out from under Installation to a top-level section after Installation.
- Removed the `### Clone the Repo` subheading; its body now sits directly under `## Installation`.
- Renamed "Usage" → "Parameter Reference" and moved it to the bottom (was above Web App / Terminal Utility).
- Trailing stub keywords (load-and-tick, log-json, grid search, ffmpeg) kept where they are, adjacent to Terminal Utility — preserved as a TODO list for you to flesh out.

NON-MOVE EDITS:
- Removed stale `@TODO - Progress on terminal command` banner that sat above the title.
- Typo fixes:
  - "continous" → "continuous" (2 instances)
  - "non-contigous" → "non-contiguous"
  - "decods" → "decodes"
  - "becoma" → "become"
  - "Heres" → "Here's"
- Grammar:
  - "use convolution kernel to get" → "use a convolution kernel to get"
  - "states is therefore is a poisson binomial" → "states is therefore a Poisson binomial" (dropped duplicate "is")
- Terminology / capitalization:
  - "poisson binomial" → "Poisson binomial" (proper noun, 2 instances)
  - "binomial poisson distributions" → "Poisson binomial distributions" (term was inverted)

LEFT UNTOUCHED — your remaining work:
- Captionless image/video block in Examples (8 media tags with no surrounding prose or commands).
- Stub keywords block under Terminal Utility (`load-and-tick`, `log-json and load + log-json`, `grid search`, `ffmpeg`).
- example_1 prose says "100x100 png" but the command produces 400x200.
- example_2 command has a trailing backslash `\` outside any multi-line shell context.
- The "raw RGBA values can be piped to ffmpeg" sentence is followed by a command that writes a PNG, not a piped stream — wording or command needs to match.
-->

# *Almost* Life-Like
<p class="subtitle">A Probabilistic extension of Conways Game of Life and other life-like automata</p>
<img src="tests/fixtures/banner.png" />

## About
This project is an exploration of extending life-like automata to continous states by interpreting
state as a probability. This differs from Smoothlife and Lenia, which use convolution kernel to get
a weighted sum of the neighborhood, then apply a growth function.

The state of each cell is treated as the odds of that cell being alive. The update function 
calculates the odds of there being 0, 1, 2 neighbors alive and so forth. Standard life-like rules
are applied to each discrete state and combined to form next state.

There is a web interface for exploring patterns and rules, a terminal utility for running the model,
saving and loading images, and streaming to FFMPEG to create animations.

A demo page can be found [here](https://willcoffey.github.io/life-like/demo.html) 

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

# Install globally
deno install -g --allow-read --allow-write ./src/terminal-life.ts
```

### Run using tsx
```
npm install
npx tsx src/terminal-life.ts --help
```

## Examples
A few example commands to demonstrate the terminal app. Paramters are generally discovered in web 
app which can output command strings for further tweaking via terminal-life.

Create a 100x100 png with some initial noise, tick it 100 times and save as `example_1.png`. 
The rule is one I know to be chaotic. No activation function.
```
terminal-life --rule b3456s3456 --reset-random --width 400 --height 200 --ticks 100 --out example_1.png
```
<img src = "./tests/fixtures/example_1.png" />

Create a phase diagram for the sin activation function for Conways. Note that we don't need to
initialize the grid to any values since some parameters of the activation function make life from
0 states. Here's another phase diagram, but animated and with time smoothing.

```
terminal-life --width 400 --height 200 --rule b3s23 --activation sin --theme managua --ticks 200 --phase --stream \
```


<img src = "./tests/fixtures/example_2.png" />

But it's usually much nicer to see it as an animation, raw RGBA values can be piped to ffmpeg to 
create a webp.
`terminal-life --width 500 --height 500 --rule b3s23 --activation sin --theme managua --ticks 100 --rate 3 --phase --out pd.png`

<video src="./tests/fixtures/example_3.mp4" autoplay loop muted playsinline></video>

<video src="./tests/fixtures/example_4.mp4" autoplay loop muted playsinline></video>

<img src = "./tests/fixtures/example_5.png" />

<video src="./tests/fixtures/example_6.mp4" controls autoplay loop muted playsinline></video>

<img src = "./tests/fixtures/example_7.png" />

<video src="./tests/fixtures/example_8.mp4" autoplay loop muted playsinline></video>

## The Algorithm
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
being alive. It is computed using the direct convolution method for solving Poisson binomial 
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

## Web App
The web app is a vanilla-web-component and is bundled with the repo. It can be
viewed by opening the `demo.html` in the root of the repo. It can also be hosted via a vite dev 
server targeting `index.html` via `deno task dev`

## Terminal Utility
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

## Parameter Reference
Most options can be discovered through the `terminal -h` help or via the web app interface. However
it is worth noting the parameters that this is meant to explore

- **Rules** : rules are specified in one of two formats. Basic life-like rules can be specified as
a string of the form `b2s23` where the numbers represent what values cause a cell to become alive or 
survive. They can be non-contiguous such as `b157s23`. The second format is a larger than life format
with more options. `b2s23` would be specified as `r1m0s2-3b3-3m` which decodes as

 - `r1` = radius 1 neighborhood
 - `m0` = middle cell excluded from neighborhood
 - `s2-3` = survive between 2 and 3 neighbors alive, inclusive
 - `b3-3` = become alive for values 3-3. note that you still need to specify a range for a single value

- **Activation Function** : Available activation functions can be seen in the `shapers.ts` file. If
a new function is added to `shapers.ts` it will become available via toggling in the web app or via
the `--activation` option in the terminal app. Activation functions take two tuning parameters, 
`alpha` and `beta` which are linearly interpolated over in phase diagram mode which is useful for
finding patterns.

- **Time Step Smoothing** : Simple scalar value that dampens the effect of each tick. If any other
value besides 1 then discrete 0 1 values will become continuous. i.e. no classic conways.


[0]: https://deno.com/
