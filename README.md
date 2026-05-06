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

## Usage
### Using the Web App

### Generating images

### Generating videos

### Sharing state


