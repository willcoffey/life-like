# *Almost* Life-Like
<p class="subtitle">A Probabilistic extension of Conways Game of Life and other life-like automata</p>

<img src="tests/fixtures/banner.png" />

## About
This project is an exploration of extending life-like automata to continous states by interpreting
state as a probability. This differs from Smoothlife and Lenia, which use essentially a convolution
kernel and growth function.

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

### Web App
The web app is a vanilla-web-component and is bundled with the repo. It can be
viewed by opening the [demo.html](./demo.html) in the root of the repo. It can
also be hosted via a vite dev server targeting `index.html` via `deno task dev`

### Terminal Utility
The terminal utility can be used to load, generate, and run the automata as well
as pipe raw data for use in pipelines with `ffmpeg` or other tools. For 
additional details see `terminal-life -h`.

To run the utility without installing
`deno run --allow-read --allow-write ./src/terminal-life.ts -t 100 --out life.png`

which will run the default grid for 100 ticks. To install globally, run
`deno install -g --allow-read --allow-write ./src/terminal-life.ts` which will 
install it as `terminal-life`.

[0]: https://deno.com/
---

## Usage
### Using the Web App

### Generating images

### Generating videos

### Sharing state


