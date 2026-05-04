# Almost Life-Like - A Probabilistic extension of Conways Game of Life
and other life-like automata

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
The web app is a vanilla-web-component and is bundled with the repo. It can be
viewed by opening [demo.html](./demo.html)


This project uses [0][Deno] as a runtime.
```
git clone git@github.com:willcoffey/life-like
git submodule update --init

deno task 




[0]: https://deno.com/
