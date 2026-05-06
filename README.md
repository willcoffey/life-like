# *Almost* Life-Like
<p class="subtitle">A Probabilistic extension of Conways Game of Life and other life-like automata</p>

<img src="tests/fixtures/banner.png" />

## About
This project is an exploration of extending life-like automata to continous states by interpreting
state as a probability. This differs from Smoothlife and Lenia, which use convolution kernel to get
a weighted sum of the neighborhood, then apply a growth function.

The state of each cell is treated as the odds of that cell being alive. The array of neighborhood 
states is therefore is a poisson binomial, and we can compute a probability mass function for it. 
This lets us apply standard life-like rules to the odds of each neighor state.

There is a web interface for exploring patterns and rules, a terminal utility for generating and
loading PNG images and a ffmpeg pipeline for creating `.webp` videos.

A demo page can be found here @TODO

## Installation
This project uses [Deno][0] as a runtime, so it must be installed first

### Clone the Repo
```
git clone git@github.com:willcoffey/life-like
git submodule update --init

# Make the terminal utility accessible globally
deno install -g --allow-read --allow-write ./src/terminal-life.ts
```

---

### The Algorithm
The basic algorithm just uses life-like rules with state values treated as a probability between 
0 and 1 inclusive. I've added additional parameters such as time step smoothing, larger neighborhood
size, and activation functions, but the main point of difference between this and other projects is
the probability aspect.

The next cell state is calculated by determining the odds for each possible neighborhood state; 1 alive 
neighbor, 2 alive neighbors and so forth; and adding up all the probabilities for states where the 
cell would be alive.

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


What I like about this approach is that if you have no time step smoothing, and the activation 
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
viewed by opening the [demo.html](./demo.html) in the root of the repo. It can
also be hosted via a vite dev server targeting `index.html` via `deno task dev`

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

