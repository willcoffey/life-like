<script src="./dist/life-like.js"></script>
## Top banner image of a cool pattern
- sin shaper, rotated 90 degrees

# *Almost* Life-Like - A continuous extension of Conway's Game of Life
*And other life-like rules*
I've developed a continuous extension of Conways Game of Life by treating cell states as 
probabilities. The neighboorhood is handled as a poisson binomial distribution and a PMF is derived
using a direct convolution method. This differs from lenia/smoothlife which use a convolution of a
kernel across a neighborhood and then applies a growth function. By using a PMF, life-like rules
such as Conways can be naturally applied to the odds of each neighbor state.

---

For example, if we had a moore neighborhood of
```
[
  1.0, 0.2, 0.3,
  0.5, 0.1, 1.0,
  0.3, 1.0, 0.7
]
```
We would then calculate the PMF of the neighbors (excluding the value of the cell itself) with result
```
const PMF = [0.0, 0.0, 0.0, 0.0588, 0.2611, 0.3776, 0.2326, 0.0636, 0.0063]
```
Where each index represents the odds of that many neighbors being alive. We can then calculate then
next state of the cell via.
```typescript
// 0.1 === state of cell we are updating
state = ((1 - 0.1) * PMF[3]) +      // Any dead cell with exactly 3 neighbors becomes living
        (0.1 * (PMF[2] + PMF[3]))  // Any live cell with 2 or 3 neighbors remains alive
state = activationFunction(state)
```

In contrast, Lenia would apply a constant convolution kernel to the neighborhood resulting in a 
scalar value instead of a PMF. The psuedocode being

```
state = convolve(kernel, neighborhood)
state = growthFunction(state)
```

---

GOL can be reproduced in both Lenia and _____

In Lenia
```
2.1.6 GoL inside Lenia
GoL can be considered a special case of discrete Lenia with R = T = P = 1,
using a variant of the rectangular kernel core:
KC (r) = 1[ 1 4 , 3 4 ](r) + 1 2 1[0, 1 4 )(r) (14)
and the rectangular growth mapping with μ = 0.35, σ = 0.07
```

Whereas in ______ GOL can be reproduced 
```
R = T = P = 1
Apply GOL and combine rules to discrete PMF values
Use any activation function that satisfies f(0) = 0 and f(1) = 1
---
```

Personally, I find it more satisfying to apply the identical conways function you would use in a 
classical simulation then the Lenia way. Of course both produce the same output.

## @TODO - Exploration of moore neighborhood 

## @TODO - Exploration of larger neighborhoods

## @TODO - Genearative AI
`core.ts` is kept as a single threaded, deterministic, human written oracle for AI to use to design 
optimized multithreaded and GPU optimized solvers.

@TODO - Terminal life bench option



## A Quick Contrast to Snoothlife and Leniamake state a complex value
 - make the neighboorhood extendable akin to lenia/smoothlife
 - make state a complex value
 - make the neighboorhood extendable akin to lenia/smoothlife

Unlike Lenia or Smoothlife, I've designed the rules such that, when the states are 0 or 1 the 
simulation just becomes the classical Game of Life, or whatever life-like rule is set up. 

## Things to do
 - make state a complex value
 - make the neighboorhood extendable akin to lenia/smoothlife

---


---

Although quantum mechanics was an inspiration for designing this, I would never call it quantum just
because it uses probabilities. I think it's interesting to see the simulation collapse from 
continous values back to a discrete, classical, conways simulation but it would be a mistake to 
think of it like wave function collapse. The most meaningful bit about quantum mechanics to me is 
the entanglement aspect, which is at direct odds to the local behaviour of cellular automata that I
do so adore. I still daydream about making some spooky automata that appears non-local, but that is
for another day. Requiring reversible rules and and retro-causality.





## Brief summary of thing, 1 paragraph

<life-like></life-like>

## Longer discussion about controls
@TODO - Update keybindings to have their help text, include a cheat sheet generated from them

## Some details about the terminal utility
@TODO - Generate some webp animations


## Interesting problems to work in
    - direct convolution method of solving poisson binomial
    - floating point associativity and webGPU determinism


Mon Apr 27 15:55:11 EDT 2026
---
Old draft for reference


# Life Like 
###  A Probabilistic Interpretations of Conways Game of Life

I've always liked thinking about cellular automata, ant colony optimization, and other algorithms
with local rules. Cellular automata in particular I find very interesting, especially with how they 
can be used to map computation to distance. If two regions of cells are seperated by a distance of 
1000 cells, then you also know they are causally independent for 1000 ticks of the update algorithm.

Even more interesting are reversible automata, such as Critters rule or Lattice gas automaton. I 
have many grand ideas for what you could do with a reversible automata, but they all remain just 
ideas. The two main ideas I would like to explore:

 - Could reversibility allow for something akin to backpropagation in order to create a 
configuration of cells that performs some useful computation on an input state.

 - Could reversibility be used to simulate something like bells inequality, by reversing the 
direction of time on observation to carry information back to an initial point. And is there any 
meaningful way to have different regions of an automata moving through different time directions 
without issues at the borders. Avoiding the need for a global time variable. 


Google also has some interesting neural cellular automata research, but I haven't looked into it in
much depth. I'm less interested in having cells perform complext calculations, and more interested
in simple cell rules and complex environments. Similar to how people have engineered computation
in Conways Game of Life.

https://en.wikipedia.org/wiki/Critters_(cellular_automaton)
https://en.wikipedia.org/wiki/Lattice_gas_automaton
https://google-research.github.io/self-organising-systems/isonca/




---

## Controls
I'm using my vim inspired keybinding library for controls, changing simulation parameters can be 
done via keybindings and grid values can be changed via mouse. There are two modes for control,
`normal` and `brush`. Normal mode has most controls, brush mode is just used for changing the 
settings for painting on the grid. `Esc` brings you back to `normal` mode.

Just like in vim, you can preceed commands with a number to repeat them that many times.
i.e. `25+` will increase probability amplification by 25 steps. 

Macros are also supported using `q` but outside the scope of this readme.

### Normal Mode
  - `space` -  play/pause
  - `>` - Advance a single frame (useful when paused)
  - `f` - Only render every other frame, useful for period 2 osicllators. There can be other period
oscillations this does not address.
  - `+`/`=` - Increase probability amplification
  - `-` - Decrease probability amplification
  - `]` - Increase probability x threshold
  - `[` - Decrease probability x threshold
  - `'` - Increase probability y offset
  - `;` - Decrease probability y offset
  - `x` - Kill all cells
  - `s` - Mirror top left quadrant to the rest of the grid. Symmetric patterns are interesting.
  - `b` - Enter brush mode
  - `r` - Reset the simulation with random parameters. I've found that the most interesting patterns
          come from tweaking parameters manually.

### Brush Mode
  - `esc` - Exit brush mode
  - `+` - Increase brush value
  - `-` - Decrease brush value
  - `]` - Increase brush size
  - `[` - Decrease brush size
  - `m` - Toggle between `set`, `observe`, and `randomize` brush modes


## Implementation Details
Take the case that a call is 30% alive, and has 3 neighbors each 50% alive. The rest being dead.

The probabilities are as follows:
```
p(0) = .125
p(1) = .375
p(2) = .375
p(3) = .125 
p(3-8) = 0
```

Using the current cell state and Conways Rules

It can be alive according to two rules:
 - It is currently alive and has 2 or 3 alive neighbors
 - It is currently dead and has exactly 3 alive neighbors
`.3 * (.375 + .125) + (.125 * .7) = 23.75% alive`

and
  - It is currently dead, and does not have 3 neighbors alive
  - It is currently alive, and does not have 2 or 3 neighbors alive
`.7 * (.125 + .375 + .375) + (.3 * .875) = 76.25% dead` 

(of course these always sum to 1)

This does mean that the complexity of calculating the next state is equivalent to calculating 512
states for the standard game of life.

---

Following these calculations, you don't get anything terribly interesting to look at. A blob of
partially alive cells that either shrinks or grows depending on the curve of it's border between 
life and death.

By manipulating the probability, much more interesting patterns can emerge. I messed around with 
several ideas, but no matter what they are all hacks. What I ended up doing was having a simple
function with 3 parameters, `m, x, and y`. I tweaked the exact method several times, but basically
`m` represents slope, `x` is a threshold value. If probability is less than `x` it gets reduced in
accordance with slope, if probability is greater than `x` it gets amplified. `y` is just a simple
addition. Probability is clamped between 0 and 1. So no matter what these parameters are, a fully
observed grid is just normal conways game of life.

# Quantum Musings V.2
Much of my motivation for these ideas comes from reading random articles on quantum mechanics. Just
the big picture stuff, and none of the actual math or hard bits. Without any underlying knowledge of
the hard parts, I want to make a system that has the same big picture properties. Then see if any of
the intuition around that artificial system transfers back to quantum mechanics. Right now I'm 
mostly considering locality with regards to the EPR paradox. I'd like to be able to replicate 
something similar to bells inequality violations and the double slit experiment without sacrificing 
locality.

To clarify what behaviour I want to replicate, and avoid confusion around any misunderstandings I 
may have about these concepts what I want is:

 - When looking at the system in only the forward direction of time, measuring a cell appears to 
   instantaneously affect cells that are far away.
 - Hidden variables cannot explain these effects
 - Behaviour can be explained with local interactions*

I don't have any formally defined rules to achieve this, but I think it should be possible with a
reversible cellular automata. The general idea is that when a measurement is made, globally reverse
the direction of time and propagate information about the measurement backwards to the initial 
source of uncertainty, adjusting probabilities along the way to make the measurement result 
compatible with the rest of the system. Then run the automata forward again to distribute these
adjustments to anything causally connected to the measurement.

I also want the system to have constant space complexity. Just the state of the grid + time 
direction + the rules should be sufficient to determine the grid state at any other point in time.
Where grid state is just an array of 0-1 values. (of course, there are issues with actual 
continuous variables).

I am still bothered by the use of a global variable though. I just cannot think of another way to 
accomplish it. Maybe you can have different regions of the grid experience time in different 
directions, but I don't know how to handle the boundaries between these regions. Notably, tracking
where they are in time via something like t=23 violates the constant memory space requirement.

I also don't like having a continuous variable for probability, since it's another avenue of ever
increasing memory. This, however seems easier to solve by using some discrete approximation.


/** To Delete

# Quantum Musings
A while ago I had an idea for how a cellular automata could exhibit something akin to instantaneous
wavefunction collapse and entanglement using *mostly* local rules. The trick of it was to use a 
reversible cellular automata and when a measurement was made reverse time until reaching the initial source 
of uncertainly, carrying back information about the measurement parameters. Then apply the 
measurement and simulate forward to carry the result back to the point of observation (and any 
correlated cells). If you were observing the automata in only the forward direction, measurements 
would appear to have non-local effects.

I never fully fleshed out the idea, for instance, the direction of time is a non-local variable in 
the example above. Maybe it could be done locally with different regions having different time
directions but I'm not sure how the boundaries would work. I like to think it could work.

Whatever rules the automata follows would also need to have some restrictions. For example, the 
continuous values cannot be allowed to effect the classical ones. That is, running the automata in
reverse then forwards must always return the same classical state, no matter what changes are made
to the continuous values. This would impose restrictions on information transfer, just like 
entanglement does not allow faster than light information transfer, this would not allow information
transfer back in time.
*/
---

Is there an un-measurment problem? Introducing uncertainty to the system seems just as problematic
as removing it via observation.

---


## Wed Dec 24 15:00:50 EST 2025

Does an observation that creates a 1/0 from continuous value, necessitate a continous state that is
a precursur to a known value?

A function that behaves as
in the initial state, var x is below some threshold y. The automata never creates a 0/1 from any
x < y. If x >= y, then eventually observation will occur. Observing causes a 1, which then the
backwards running of the automata finds where modifications are needed to make minimal inital x > y.


