# Cellulare Automata Experiments V1
---

I think that the most interesting behaviour that I want to experiment require reversible Automata, 
but not doing anything until working with those more complex rules is putting the cart before the
horse.

## Probabilistic Conway's

The basic idea of this rule, is to have cell state be a probabilitiy between 0 and 1. When computing
the next state, I iterate over all possible configurations of it's [Moore neighborhood](https://en.wikipedia.org/wiki/Moore_neighborhood)
and compute their odds, then further reduce that to odds of n neighbors being alive, from which I can get the odds
of the cell being alive on the next tick.

With that as the rule, it's not terribly interesting. A blob of life over a certain size becomes
semi-stable with a probabilitiy of ~.37. Under a certain size it will dissolve to nothing. Over a
certain size it expands forever. Looks like [curve shortening flow](https://en.wikipedia.org/wiki/Curve-shortening_flow).

It's important to note that this is not exactly correct behaviour, as probabilities fall extremely
fast and floating points cannot represent them. I suspect that these infinitesimal probabilities
are important because

    - They cover large areas, so their sum may not be negligible
    - Tiny probabilities can be compounded just as fast as they are diminished e.g. a glider
    comprised of 9 cells each with 99% accurate state will only be 44% accurate after two ticks. A
    few more ticks and it gets rounded to 0.

## Making it stay coherent

    - By adding a step that makes low probability events lower, and likely events more likely the
      simulation can be made to stay together over time. Doing this with squares didn't work well,
      doing it via `if(p<.5) p = p / factor; else p = p * factor` where `factor` > 1 works but I
      don't like it. I think a trig function would make more sense and I'll try that at some point.

    - I would like to explore other ideas, such as changing the rules in some way to create
      destructive interference. I also want to find a way to correlate probabilities together, but
      to do this I would need to add some non-local hack. I think I can do something like it with
      locality if I have a reversible automata that oscillates time direction.

    - I also added a way to make "observations" where cells get set to 1 or 0 randomly based on 
      their state. I don't like this because it makes it non-deterministic. 

## Other ideas

    - It could be interesting to use this method to combine multiple life-like rules. I could do 
      the same neighborhood calculations but apply both conway and any number of other rules, and 
      combine them. Where they agree would have lower prob, and lower where they disagree.

    - I briefly thought about representing probabilities as `1/2^n` but it seems that you get 
      massively complex polynomials very quickly. I wonder how much information is encoded in these
      polynomials. The entire initial state?

    - There are many structures that only exist at certain probability amplification factors that
      don't exist in regular game of life. Random generation isn't great for finding these as it 
      leaves so much debris.
