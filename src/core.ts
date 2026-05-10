/**
 * @TODO - Standardize NAMED_RULES structure
 */
import { NAMED_RULES, Rule, Rules } from "./lib/rules.ts";
import { isShaperName, Shaper, ShaperName, Shapers } from "./shapers.ts";
import { PaletteName, Themes } from "./lib/ColorMap.ts";
import { hashFloatArray128 } from "./util.ts";

/** Create a seeded random function to replace Math.random() for determinism */
const Random = splitmix32(2567452050);
/**
 * Used as the source of default parameters for creating a grid
 */
const DEFAULT_GRID: Optional<Grid, "cache" | "cells"> = {
  tick: 0,
  width: 50,
  height: 50,
  //  rule: "b3s23",
  // rule: "r8m0s26-32b26-32d",
  // rule: "r5m0s26-32b26-32m",
  rule: "r5m0s35-107b10-27m",
  mode: "Fixed",
  alpha: 1,
  beta: 1,
  activation: "none",
  phaseDiagram: {
    type: "rule",
    lowB: 0,
    lowS: 0,
    x: [0, 80],
    y: [0, 80],
  },
  theme: "viridis",
  changeRate: 1,
  playing: false,
};

/**
 * Contains core logic behind the automata, seperated from any interface that controls it
 * no reliance on DOM, could be turned into terminal utility.
 */
interface Command {
  command: string;
  [key: string]: any;
}
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface Grid {
  mode: "PhaseDiagram" | "Fixed";
  /**
   * When mode is set to PhaseDiagram phaseDiagram is used to interpoate different properties over
   * x and y with a moveable window
   */
  phaseDiagram: PhaseDiagram;
  width: number;
  height: number;
  // A string encoding of a rule to follow. e.g r1m0s2-3b3-3nm would mean
  // radius 1, middle excluded, survive at 2-3 living neighbors, birth at 3-3 neighbors.
  // Which is Conways
  rule: string;
  cells: Float64Array;
  // The number of ticks this grid has experienced, used for testing / command replay
  tick: number;
  // A determinstic hash of the cells, usefule for testing. gets cleared at the start of every tick
  hash?: string;
  /** The activation function to use. i.e. gaussian or sin */
  activation: ShaperName;
  /** Properties of the activation function used to shape the probability */
  alpha: number;
  beta: number;
  /**
   * how much of the function result to apply to the cell state per tick
   * classic conways only runs at 1
   * @TODO rename
   */
  changeRate: number;
  playing: boolean;
  /** Which theme to use to conver 0-1 values to RGBA and back from image data to 0-1 */
  theme: PaletteName;
  /**
   * Values that are pure functions of other grid properties. used for performance reasons. never
   * serialized.
   */
  cache: Cache;
}

/**
 * Phase Diagram settings for different modes. Determines what ranges to sweep over and how to
 * apply the cell update function
 */
export type PhaseDiagram = RulePhaseDiagram | ActivationPhaseDiagram;
interface ActivationPhaseDiagram {
  type: "activation";
  x: [number, number];
  y: [number, number];
}

interface RulePhaseDiagram {
  type: "rule";
  lowS: number;
  lowB: number;
  x: [number, number];
  y: [number, number];
}

/**
 * Pre-computed values for performance reasons, such as the array of offsets that represent the
 * neighborhood
 */
interface Cache {
  neighborhood: number[];
  rule: Rule;
  activation: Shaper;
  parsedRule: RuleParameters;
}

export type RuleParameters = LtLRule | LifeLikeRule;
interface LtLRule {
  type: "LtL";
  radius: number;
  middle: boolean;
  sRange: [number, number];
  bRange: [number, number];
  neighborhood: "moore" | "disc";
}
interface LifeLikeRule {
  type: "LifeLike";
  radius: number;
  middle: boolean;
  birth: number[];
  survive: number[];
  neighborhood: "moore" | "disc";
}

export class LifeLike {
  grid: Grid;
  constructor(grid?: Partial<Grid>) {
    this.grid = LifeLike.createGrid(grid);
    return;
  }

  /**
   * @TODO Mon May  4 04:13:17 PM EDT 2026
   * I need to start making test files using JSON lists of commands. use them for
   * blog visuals. Update this to have thorough comments after usage.
   */
  stdin(command: Command) {
    if (Object.hasOwn(Controls, command.command)) {
      //@ts-ignore
      Controls[command.command as ControlName](this.grid, command.args);
    }
    return;
  }

  /**
   * Create a new grid assuming defaults but accepting any partial Grid properties
   */
  static createGrid(initial: Partial<Grid> = {}): Grid {
    const grid = structuredClone(DEFAULT_GRID);
    Object.assign(grid, initial);
    const cache = LifeLike.buildGridCache(grid);
    const cells = grid.cells
      ? grid.cells
      : LifeLike.createBufferedArray({ width: grid.width, height: grid.height, cache });
    return { ...grid, cache, cells };
  }

  /**
   * Compute the next state of the grid
   */
  static getNextState(grid: Grid): Float64Array {
    delete grid.hash;

    const nextState = LifeLike.createBufferedArray(grid);
    for (const [position, x, y] of LifeLike.cellIterator(grid)) {
      /**
       * Get the rule and activation function to be applied, varies based on position when
       * creating a phase diagram
       */
      const [rule, alpha, beta] = grid.mode === "PhaseDiagram"
        ? LifeLike.getInterpolatedRule(grid, x, y)
        : [grid.cache.rule, grid.alpha, grid.beta];

      /**
       * Compute the PMF used to apply the rule, sort it to ensure symmetry of floating point
       * operations due to non-associativity
       */
      const pmf = LifeLike.computeNeighborTotalOddsDC(
        LifeLike.getNeighborhood(position, grid).sort(),
      );

      /**
       * Update the cell state
       *  - Apply rule to PMF
       *  - Apply activation function to result
       *  - Clamp value
       *  - Apply time smoothing
       */
      let state = rule(grid.cells[position], pmf);
      state = grid.cache.activation.fn(state, alpha, beta);
      if (state < 0) state = 0;
      else if (state > 1) state = 1;
      state = grid.cells[position] + ((state - grid.cells[position]) / grid.changeRate);
      nextState[position] = state;
      if (isNaN(state)) {
        console.log(rule);
        throw "adsad";
      }

      /**
       * If in Fixed mode, copy the buffered edges to the opposite sides to make updates flow
       * from one side of the grid to the opposite side. A toroidal topology.
       */
      if (true || grid.mode === "Fixed") {
        LifeLike.copyBufferedEdges(
          nextState,
          grid.width,
          grid.height,
          grid.cache.parsedRule.radius,
        );
      }
    }

    grid.tick++;
    return nextState;
  }

  static createRange(min: number, size: number): [number, number] {
    if (min < 0) min = 0;
    min = Math.round(min);
    size = Math.round(size);
    return [min, min + size];
  }

  /**
   * @TODO - Mon May  4 04:05:18 PM EDT 2026
   * Need to revisit how to interpolate over rules again. Originally I had it as either interpolating
   * over birth or survival. and only for LtL rules where it was specified via a single contiguous
   * range. I want to make it work for all life-like rules in a single diagram requiring some other
   * way of interpolating.
   *
   * lots of existing literature to review, such as
   * https://csc.ucdavis.edu/~evca/Papers/RevEdge.pdf
   *
   * For now, I'll use an external rule generator and do grid search vs phase diagram on rules.
   */
  static getInterpolatedRule(
    grid: Grid,
    x: number,
    y: number,
  ): [Rule, number, number] {
    switch (grid.phaseDiagram.type) {
      default:
      case "activation":
        const [alpha, beta] = LifeLike.getPhaseParameters(grid, x, y);
        return [grid.cache.rule, alpha, beta];
        break;
      case "rule":
        /**
         * For interpolating over the rules, use a fixed midpoint and interpolate over the size
         */
        const { lowB, lowS } = grid.phaseDiagram;
        const [minX, maxX] = grid.phaseDiagram.x;
        const [minY, maxY] = grid.phaseDiagram.y;

        const xSize = Math.round(LifeLike.linearInterpolate(grid.width, x, minX, maxX));
        const ySize = Math.round(LifeLike.linearInterpolate(grid.height, y, minY, maxY));
        const n = grid.cache.neighborhood.length;

        if (xSize < 0 || ySize < 0 || xSize > n || ySize > n) {
          return [Rules.zero, grid.alpha, grid.beta];
        }
        const sRange = LifeLike.createRange(lowS, ySize);
        const bRange = LifeLike.createRange(lowB, xSize);
        const rule = Rules.largerThanLife.bind(null, sRange, bRange, false);
        return [rule, grid.alpha, grid.beta];
        break;
    }

    return [grid.cache.rule, x, y];
  }

  /**
   * Recalculates all the cached properties on the grid
   */
  static buildGridCache(grid: Optional<Grid, "cache" | "cells">): Cache {
    const parsedRule = LifeLike.parseRuleString(grid.rule);
    const neighborhood = LifeLike.createNeighborhoodStencil(grid.width, parsedRule);
    const activation = Shapers[grid.activation];
    let rule: Rule;
    if (parsedRule.type === "LtL") {
      rule = Rules.largerThanLife.bind(
        null,
        parsedRule.sRange,
        parsedRule.bRange,
        parsedRule.middle,
      );
    } else {
      rule = Rules.lifeLike.bind(
        null,
        parsedRule.survive,
        parsedRule.birth,
      );
    }
    return { parsedRule, neighborhood, activation, rule };
  }

  /**
   * Parses the rule string into fixed parameters
   *
   * accepts either a larger than life rule in my format, or a simple life-like formula
   * i.e.
   * `b3s23` for basice life-like or
   * `r1m0s2-3b3-3m` for LtL definition of conways
   */
  static parseRuleString(rule: string): RuleParameters {
    rule = rule.toLowerCase();
    const ltl = rule.match(/^r(\d+)m(\d)s(\d+)-(\d+)b(\d+)-(\d+)([a-z])$/);
    if (ltl) {
      // If the larger than life regex matched, treat as a LtL rule
      const [, r, m, sMin, sMax, bMin, bMax, n] = ltl;
      const radius = Number(r);
      const middle = !!Number(m);
      const sRange: [number, number] = [Number(sMin), Number(sMax)];
      const bRange: [number, number] = [Number(bMin), Number(bMax)];

      sRange.sort((a, b) => a - b);
      bRange.sort((a, b) => a - b);

      switch (n) {
        case "m":
          return { sRange, bRange, radius, middle, neighborhood: "moore", type: "LtL" };
        case "d":
          return { sRange, bRange, radius, middle, neighborhood: "disc", type: "LtL" };
      }
    } else {
      const lifeLike = rule.toLowerCase().match(/^b(\d*)s(\d*)$/);
      if (lifeLike) {
        const birth = new Array(9).fill(0);
        const survive = new Array(9).fill(0);
        const [, birthStr, surviveStr] = lifeLike;
        for (const char of birthStr) birth[Number(char)] = 1;
        for (const char of surviveStr) survive[Number(char)] = 1;
        return {
          birth,
          survive,
          radius: 1,
          middle: false,
          neighborhood: "moore",
          type: "LifeLike",
        };
      }
    }
    throw "Invalid neighborhood type";
  }

  /**
   * @TODO Mon May  4 04:10:58 PM EDT 2026
   * revisit this now that I have added life-like non contiguous rules
   * maybe a - if r=1 m=0 then life-like else LtL. Works unless a
   * a non contigous LtL somehow exists
   */
  static makeRuleString(params: RuleParameters): string {
    const { type, radius, neighborhood, middle } = params;
    let n: "d" | "m";
    switch (neighborhood) {
      case "disc":
        n = "d";
        break;
      case "moore":
        n = "m";
        break;
    }

    switch (type) {
      case "LtL": {
        params.sRange = [Math.max(0, params.sRange[0]), Math.max(0, params.sRange[1])];
        params.bRange = [Math.max(0, params.bRange[0]), Math.max(0, params.bRange[1])];

        const rule = `r${radius}m${middle ? 1 : 0}s${params.sRange[0]}-${params.sRange[1]}b${
          params.bRange[0]
        }-${params.bRange[1]}${n}`;
        return rule;
      }
      case "LifeLike": {
        let rule = `b`;
        for (let i = 0; i < params.birth.length; i++) if (params.birth[i]) rule += `${i}`;
        rule += "s";
        for (let i = 0; i < params.survive.length; i++) if (params.survive[i]) rule += `${i}`;
        return rule;
      }
    }
    throw "Unknown rule type";
  }

  /**
   * Creates a float array with a buffer of cells around it equal to the neighborhood radius.
   */
  static createBufferedArray(
    { width, height, cache }: Pick<Grid, "width" | "height" | "cache">,
  ): Float64Array {
    const size = (width + (2 * cache.parsedRule.radius)) *
      (height + (2 * cache.parsedRule.radius));
    return new Float64Array(size);
  }

  /**
   * Copy the cell state from the edges to the opposing sides buffer area to make simulation
   * act as if things were flowing across the edges
   */
  static copyBufferedEdges(
    cells: Float64Array,
    width: number,
    height: number,
    radius: number,
  ) {
    const r = radius;
    const stride = width + 2 * r;

    // Horizontal: each inner row's left/right r cells wrap to the opposite buffer.
    for (let y = r; y < r + height; y++) {
      const row = y * stride;
      for (let i = 0; i < r; i++) {
        cells[row + i] = cells[row + width + i]; // left  buf <- inner right edge
        cells[row + r + width + i] = cells[row + r + i]; // right buf <- inner left edge
      }
    }

    // Vertical: copy whole rows (incl. side buffers from pass 1) to top/bottom
    // buffer rows. Corner regions are populated transitively.
    for (let i = 0; i < r; i++) {
      const topBufRow = i * stride; // y = i
      const bottomInner = (height + i) * stride; // inner y = height - r + i
      const bottomBufRow = (r + height + i) * stride; // y = r + height + i
      const topInner = (r + i) * stride; // inner y = i
      cells.copyWithin(topBufRow, bottomInner, bottomInner + stride);
      cells.copyWithin(bottomBufRow, topInner, topInner + stride);
    }
  }

  /**
   * Calculates static offsets so that when iterated
   * grid.cells[position + offsets[i]]
   * yields the full neighborhood. Center position is excluded.
   *
   * Shape:
   *   "disc"  - Based on distance from center
   *   "moore" — Square of 2r+1 centered on position. 1 === moore neighborhood
   */
  static createNeighborhoodStencil(
    width: number,
    parsedRule: RuleParameters,
  ): number[] {
    const radius = parsedRule.radius;
    const radiusSquared = radius * radius;
    const physWidth = width + 2 * parsedRule.radius;
    const offsets: number[] = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        // Skip the center position
        if (!parsedRule.middle && dx === 0 && dy === 0) continue;
        // If a disc, skip the parts of the suare that are outside the disc
        if (parsedRule.neighborhood === "disc" && dx * dx + dy * dy > radiusSquared) {
          continue;
        }
        // set the offset accounting for the buffer area at the edge of the grid
        offsets.push(dy * physWidth + dx);
      }
    }
    return offsets;
  }

  /**
   * Use the cached neighborhood stencil that contains position offsets to load the cells
   * neighborhood
   */
  static getNeighborhood(
    position: number,
    grid: Grid,
  ): number[] {
    const cells: number[] = [];
    for (const offset of grid.cache.neighborhood) cells.push(grid.cells[position + offset]);
    return cells;
  }

  /**
   * Interpolates over the variables in the current phase diagram window
   */
  static getPhaseParameters(grid: Grid, x: number, y: number): [number, number] {
    const [minX, maxX] = grid.phaseDiagram.x;
    const [minY, maxY] = grid.phaseDiagram.y;
    const a = LifeLike.linearInterpolate(grid.width, x, minX, maxX);
    const b = LifeLike.linearInterpolate(grid.height, y, minY, maxY);
    return [a, b];
  }

  static linearInterpolate(
    size: number,
    i: number,
    min: number,
    max: number,
    midpoint: boolean = false,
  ): number {
    if (midpoint) {
      const distanceFromCenter = Math.abs(i - size / 2) / (size / 2);
      return max - (max - min) * distanceFromCenter;
    }
    return min + (max - min) * (i / size);
  }

  /**
   * computeNeighborTotalOdds and computeNeighborStateOdds are a brute force way of computing the
   * probabilities of every neighor state for a cell. No longer used since the direct convolution
   * method was added, but left for potential use as tests.
   *
   * Given the possibility of each state, output the possibilites of a certain number of neighbors
   * being alive.
   */
  static computeNeighborTotalOdds(odds: number[]) {
    const res: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < odds.length; i++) {
      //bit count is the number of alive neighbors
      let numNeighbors = LifeLike.bitCount(i);
      res[numNeighbors] += odds[i];
    }
    return res;
  }

  /**
   * Iterates over all possible states that neighbors could be in and calculates the chance of each
   * one being true.
   * e.g.
   * prob(00110101) = p(neighor 0 dead) * p(neighbor 1 dead) * prob(neighor 2 alive)...
   */
  static computeNeighborStateOdds(neighbors: number[]): number[] {
    /** Odds for each state if the neighbors */
    const odds: number[] = [];
    /**
     * Iterate over every possible state that a neighbor could be in
     */
    for (let i = 0; i < 256; i++) {
      let prob = 1;
      /**
       * Iterate over each neighbor and compute the odds that this neighbor is in
       * this state
       */
      for (let j = 0; j < 8; j++) {
        const neighbor = neighbors[j];
        /** If this neighbor (j) is alive in this state (i), apply the prob */
        /** 2 ** j === 2^j, or the j'th bit turned on */
        if ((2 ** j) & i) {
          prob = prob * neighbor;
        } else {
          prob = prob * (1 - neighbor);
        }
        /** No need to continue computing odds if state is impossible */
        if (prob === 0) break;
      }
      odds.push(prob);
    }

    return odds;
  }

  /**
   * Implementation of the direct convolution method on wikiepedia page
   *
   * Sat Apr 25 05:59:37 PM EDT 2026
   * https://en.wikipedia.org/wiki/Poisson_binomial_distribution
   *
   * and tested manually against brute force
   */
  static computeNeighborTotalOddsDC(neighbors: number[]): number[] {
    const n = neighbors.length;
    const res: number[] = new Array(n + 1).fill(0);
    res[0] = 1;
    for (let i = 0; i < n; i++) {
      const p = neighbors[i];
      if (p === 0) continue;
      const q = 1 - p;
      for (let k = i + 1; k > 0; k--) {
        res[k] = res[k] * q + res[k - 1] * p;
      }
      res[0] = res[0] * q;
    }
    return res;
  }

  // Neighbor state is a number, where each bit on is that neighbor being alive or
  // dead
  static bitCount(n: number) {
    n = n - ((n >> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
    return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
  }

  /**
   * Returns an iterator over the inner portion of the cell array that gets simulated.
   */
  static *cellIterator(
    grid: Grid,
  ): Generator<[position: number, x: number, y: number]> {
    const r = grid.cache.parsedRule.radius;
    const physWidth = grid.width + 2 * r;
    for (let y = 0; y < grid.height; y++) {
      const rowStart = (y + r) * physWidth + r;
      for (let x = 0; x < grid.width; x++) {
        yield [rowStart + x, x, y];
      }
    }
  }
}
/**
 * Seeded random number generator. Should have better randomness than mulberry32, don't care about
 * performance but also don't want to seed more like sfc32.
 *
 * Comparison of various PRNG from PractRand
 * https://github.com/bryc/code/blob/master/jshash/PRNGs.md
 *
 * > This mixing function has been studied quite heavily, and improved constants have been found.
 * > This is the best one found so far:
 *
 * s is coerced into a 32 bit int by bitwise/imul ops
 */
function splitmix32(a: number) {
  return function () {
    a |= 0;
    a = a + 0x9e3779b9 | 0;
    var t = a ^ a >>> 16;
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  };
}

type Control = (grid: Grid, args: any) => void;
/**
 * Controls is a 1-1 mapping of stdin command string to synchronous functions that manipulate Grid
 * state
 */
const Controls = {
  /** advances the grid a single tick */
  "tick"(grid) {
    grid.cells = LifeLike.getNextState(grid);
  },
  /** Toggles between PhaseDiagram mode and FixedMode */
  "toggle-mode"(grid) {
    grid.mode = grid.mode === "PhaseDiagram" ? "Fixed" : "PhaseDiagram";
  },
  "set-diagram"(grid, diagram: string) {
    /** Sets the diagram type, which is a prop on grid.phaseDiagram */
    if (diagram !== "rule" && diagram !== "activation") throw "Invalid set diagram value";
    switch (diagram) {
      case "rule":
        if (grid.cache.parsedRule.type != "LtL") throw "Cannot interpolate non-LtL rules";
        const nieghborCount = grid.cache.parsedRule.radius;
        const diagram: PhaseDiagram = {
          type: "rule",
          lowS: Math.round(grid.cache.neighborhood.length / 2),
          lowB: Math.round(grid.cache.neighborhood.length / 2),
          x: [0, grid.cache.neighborhood.length],
          y: [0, grid.cache.neighborhood.length],
        };
        grid.phaseDiagram = diagram;
        break;
      case "activation":
        // Set the diagram to whatever the default is for the current activation
        grid.phaseDiagram = {
          type: "activation",
          x: Shapers[grid.activation].diagram.alpha,
          y: Shapers[grid.activation].diagram.beta,
        };
        break;
    }
  },
  /**
   * Resets the grid, interpolating over width & height to set density and
   * magnitude of life cells
   */
  "reset-random"(grid, { densityRange, valueRange } = {}) {
    if (!densityRange) densityRange = [.5, .5];
    if (!valueRange) valueRange = [0, 1];
    grid.cells = LifeLike.createBufferedArray(grid);
    for (const [position, x, y] of LifeLike.cellIterator(grid)) {
      const density = LifeLike.linearInterpolate(grid.width, x, densityRange[0], densityRange[1]);
      const min = LifeLike.linearInterpolate(grid.height, y, valueRange[0], valueRange[1]);
      if (Random() > density) {
        grid.cells[position] = Random() * (1 - min) + min;
      } else {
        grid.cells[position] = 0;
      }
    }
  },
  /**
   * Mirrors the top left quadrant to all other quadrants. mostly for the purpose of good visaul
   * patterns
   */
  "make-symmetric"(grid) {
    const newCells = LifeLike.createBufferedArray(grid);
    const bufferedWidth = grid.width + 2 * grid.cache.parsedRule.radius;
    const bufferedHeight = grid.height + 2 * grid.cache.parsedRule.radius;

    for (let position = 0; position < grid.cells.length; position++) {
      const x = position % bufferedWidth;
      const y = (position - x) / bufferedWidth;
      //** This is top left quadrant, which gets mirrored to other quadrants */
      if (x < bufferedWidth / 2 && y < bufferedHeight / 2) {
        const xOffset = bufferedWidth - (2 * x) - 1;
        const yOffset = (bufferedHeight - 1) - (2 * y);

        newCells[position] = grid.cells[position];
        newCells[position + xOffset] = grid.cells[position];
        newCells[position + xOffset + yOffset * bufferedWidth] = grid.cells[position];
        newCells[position + yOffset * bufferedWidth] = grid.cells[position];
      }
    }
    grid.cells = newCells;
  },
  /**
   * 0s out the entire grid
   */
  "reset"(grid) {
    grid.cells = LifeLike.createBufferedArray(grid);
    grid.cache = LifeLike.buildGridCache(grid);
  },

  "load-state"(grid, state: Partial<Grid>) {
    Object.assign(grid, LifeLike.createGrid(state));
  },
  /**
   * Controls related to the PhaseDiagram mode
   *  - moving the window into the diagram, zooming in and out
   *  - selecting paramters from the window as the grid parameters for fixed mode
   */
  "move-right"(grid) {
    const [min, max] = grid.phaseDiagram.x;
    const change = (max - min) / 8;
    const range: [number, number] = [min + change, max + change];
    grid.phaseDiagram.x = range;
  },
  "move-left"(grid) {
    if (grid.mode !== "PhaseDiagram") return;
    const [min, max] = grid.phaseDiagram.x;
    const change = (max - min) / 8;
    const range: [number, number] = [min - change, max - change];
    grid.phaseDiagram.x = range;
  },
  "move-down"(grid) {
    const [min, max] = grid.phaseDiagram.y;
    const change = (max - min) / 8;
    const range: [number, number] = [min + change, max + change];
    grid.phaseDiagram.y = range;
  },
  "move-up"(grid) {
    const [min, max] = grid.phaseDiagram.y;
    const change = (max - min) / 8;
    const range: [number, number] = [min - change, max - change];
    grid.phaseDiagram.y = range;
  },
  "zoom-in"(grid) {
    const [minX, maxX] = grid.phaseDiagram.x;
    const [minY, maxY] = grid.phaseDiagram.y;
    const dX = (maxX - minX) / 8;
    const dY = (maxY - minY) / 8;

    grid.phaseDiagram.x = [minX + dX, maxX - dX];
    grid.phaseDiagram.y = [minY + dY, maxY - dY];
  },
  "zoom-out"(grid) {
    const [minX, maxX] = grid.phaseDiagram.x;
    const [minY, maxY] = grid.phaseDiagram.y;
    let dX = (maxX - minX) / 8;
    let dY = (maxY - minY) / 8;
    grid.phaseDiagram.x = [minX - dX, maxX + dX];
    grid.phaseDiagram.y = [minY - dY, maxY + dY];
  },
  "goto-start"(grid) {
    if (grid.phaseDiagram.type === "activation") {
      /** For activation function params we store a known middle. */
      grid.phaseDiagram.x = Shapers[grid.activation].diagram.alpha;
      grid.phaseDiagram.y = Shapers[grid.activation].diagram.beta;
    } else {
      /** For birth and survival the diagram is 0 - nieghborhood size */
      const nieghborCount = grid.cache.parsedRule.radius;
      grid.phaseDiagram.x = [0, grid.cache.neighborhood.length];
      grid.phaseDiagram.y = [0, grid.cache.neighborhood.length];
    }
  },

  /** Grid resolution control i.e. cell count */
  "increase-res"(grid) {
    grid.width = grid.width + 50;
    grid.height = grid.height + 50;
    Controls.reset(grid);
  },
  "decrease-res"(grid) {
    grid.width = grid.width - 50;
    grid.height = grid.height - 50;
    if (grid.width < 3) grid.width = 3;
    if (grid.height < 3) grid.height = 3;
    Controls.reset(grid);
  },
  /**
   * Uses the middle center value of the current phase diagram range to
   * set the alpha / beta values of the simulation
   */
  "select-params"(grid) {
    if (grid.mode === "Fixed") return;
    const [minX, maxX] = grid.phaseDiagram.x;
    const [minY, maxY] = grid.phaseDiagram.y;
    switch (grid.phaseDiagram.type) {
      case "rule":
        if (grid.cache.parsedRule.type !== "LtL") {
          throw "Cannot use phase diagram on non LtL rules";
        }
        const { lowS, lowB } = grid.phaseDiagram;
        // x window -> sRange size; y window -> bRange size (matches getInterpolatedRule)
        const bSize = Math.round((minX + maxX) / 2);
        const sSize = Math.round((minY + maxY) / 2);
        grid.cache.parsedRule.sRange = LifeLike.createRange(lowS, sSize);
        grid.cache.parsedRule.bRange = LifeLike.createRange(lowB, bSize);
        grid.rule = LifeLike.makeRuleString(grid.cache.parsedRule);
        break;
      case "activation":
        grid.alpha = minX + (maxX - minX) / 2;
        grid.beta = minY + (maxY - minY) / 2;
        grid.rule = LifeLike.makeRuleString(grid.cache.parsedRule);
    }
    grid.cache = LifeLike.buildGridCache(grid);
  },

  /**
   * Activation function controls
   */
  "set-activation"(grid, name: string) {
    if (isShaperName(name)) {
      grid.activation = name;
      grid.phaseDiagram = {
        type: "activation",
        x: Shapers[name].diagram.alpha,
        y: Shapers[name].diagram.alpha,
      };
    }

    grid.cache = LifeLike.buildGridCache(grid);
  },
  "next-activation"(grid) {
    const names = Object.keys(Shapers) as ShaperName[];
    const i = names.indexOf(grid.activation);
    grid.activation = names[(i + 1) % names.length];
    grid.cache = LifeLike.buildGridCache(grid);
  },
  "prev-activation"(grid) {
    const names = Object.keys(Shapers) as ShaperName[];
    const i = names.indexOf(grid.activation);
    grid.activation = names[(i - 1 + names.length) % names.length];
    grid.cache = LifeLike.buildGridCache(grid);
  },
  "next-theme"(grid) {
    const i = Themes.indexOf(grid.theme);
    grid.theme = Themes[(i + 1) % Themes.length];
  },
  "prev-theme"(grid) {
    const i = Themes.indexOf(grid.theme);
    grid.theme = Themes[(i - 1 + Themes.length) % Themes.length];
  },
  "increase-rate"(grid) {
    grid.changeRate += 1;
  },
  "decrease-rate"(grid) {
    if (grid.changeRate > 1) grid.changeRate -= 1;
  },
  "increase-smid"(grid) {
    if (
      grid.phaseDiagram.type === "rule" &&
      grid.phaseDiagram.lowS < grid.cache.neighborhood.length
    ) grid.phaseDiagram.lowS++;
  },
  "decrease-smid"(grid) {
    if (
      grid.phaseDiagram.type === "rule" &&
      grid.phaseDiagram.lowS > 0
    ) grid.phaseDiagram.lowS--;
  },
  "increase-bmid"(grid) {
    if (
      grid.phaseDiagram.type === "rule" &&
      grid.phaseDiagram.lowB < grid.cache.neighborhood.length
    ) grid.phaseDiagram.lowB++;
  },
  "decrease-bmid"(grid) {
    if (
      grid.phaseDiagram.type === "rule" &&
      grid.phaseDiagram.lowB > 0
    ) grid.phaseDiagram.lowB--;
  },

  /**
   * Consider eventual removal if playing is controlled by component or terminal utility
   * via direct tick calls
   *
   * I'm thinking stdin is an async function that buffers commands. have a tick N function that
   * checks the buffer after each tick. If there is a command, log how many ticks occured and then
   * run the command. if it is a tick command increment remaining ticks. otherwise run it and put
   * tick on the back of the buffer
   */
  "play-pause"(grid) {
    grid.playing = !grid.playing;
  },
  "debug"(grid) {
    console.log(grid);
  },
  "hash"(grid) {
    grid.hash = hashFloatArray128(grid.cells);
  },
} satisfies Record<string, Control>;
type ControlName = keyof typeof Controls;
