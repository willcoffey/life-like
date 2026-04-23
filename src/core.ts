import { NAMED_RULES } from "./lib/rules.ts";

/**
 * Contains core logic behind the automata, seperated from any interface that controls it
 * no reliance on DOM, could be turned into terminal utility.
 */

/**
 * Main datastructure for component, anything that can effect the next state calculation of the grid
 * should be in this object.
 */
const mouseModes: ("observe" | "randomize" | "kill" | "set")[] = [
  "observe",
  "randomize",
  "kill",
  "set",
];
interface Command {
  command: string;
  [key: string]: any;
}
export interface Grid {
  mouseMode: "observe" | "randomize" | "kill" | "set";
  brushSize: number;
  brushProb: number;
  // An array of life-like rules specified in golly format.
  // [See wiki](https://en.wikipedia.org/wiki/Life-like_cellular_automaton)
  // Conway's game of life = B3/S23 = birth at 3 neighbors, survive 2 or 3, else die
  // @TODO
  rules: string[];
  // Width of the grid
  width: number;
  // Height of the grid
  height: number;
  mouseIsDown: boolean;
  playing: boolean;
  mousePosition: [number, number];
  position: number;
  cells: Float64Array;

  // Controls how the probilities are modified after being computed
  pM: number;
  pX: number;
  pY: number;
}

export class LifeLike {
  grid: Grid;
  constructor(grid?: Partial<Grid>) {
    this.grid = LifeLike.createGrid(grid);
    LifeLike.addCircle(this.grid);
    this.makeSymmetric();
    return;
  }
  /**
   * Process any input that can effect the internal state of the component.
   * All mouse / key events etc must interact via this function
   *
   * Possible interactions
   *  - play/pause simulation
   *  - reset
   *  - observe via mouse
   *  - randomize via mouse
   */
  stdin(command: Command) {
    switch (command.command) {
      case "reset-random":
        this.resetRandom();
        return;
      case "make-symmetric":
        this.makeSymmetric();
        return;
      case "increase-prob-m":
        this.grid.pM += .01;
        return;
      case "decrease-prob-m":
        this.grid.pM -= .01;
        return;
      case "increase-prob-x":
        this.grid.pX += .01;
        return;
      case "decrease-prob-x":
        this.grid.pX -= .01;
        return;
      case "increase-prob-y":
        this.grid.pY += .01;
        return;
      case "decrease-prob-y":
        this.grid.pY -= .01;
        return;
      case "mouse-mode":
        const currentIndex = mouseModes.indexOf(this.grid.mouseMode);
        const nextIndex = (currentIndex + 1) % mouseModes.length;
        this.grid.mouseMode = mouseModes[nextIndex];
        return;
      case "increase-brush-prob":
        this.grid.brushProb += .01;
        return;
      case "decrease-brush-prob":
        this.grid.brushProb -= .01;
        return;
      case "increase-brush":
        this.grid.brushSize += 1;
        return;
      case "decrease-brush":
        this.grid.brushSize -= 1;
        if (this.grid.brushSize < 1) this.grid.brushSize = 1;
        return;
      case "mousedown":
        this.grid.mouseIsDown = true;
        return;
      case "mouseup":
        this.grid.mouseIsDown = false;
        return;
      case "mousemove":
        this.grid.mousePosition = command.pos;
        return;
      case "tick":
        this.tick();
        return;
      case "play-pause":
        this.grid.playing = !this.grid.playing;
        if (this.grid.playing) this.play();
        return;
      case "move-right":
        this.grid.position++;
        return;
      case "move-left":
        this.grid.position--;
        return;
      case "move-down":
        this.grid.position += this.grid.width;
        return;
      case "move-up":
        this.grid.position -= this.grid.width;
        return;
      case "toggle-cell":
        this.grid.cells[this.grid.position] = Number(!this.grid.cells[this.grid.position]);
        return;
      case "random-cell":
        this.grid.cells[this.grid.position] = Math.random();
        return;
      case "reset":
        this.grid.cells = new Float64Array(new ArrayBuffer(8 * this.grid.width * this.grid.height));
        return;
      case "goto-start":
        this.grid.position = 0;
        return;
      case "goto-end":
        this.grid.position = (this.grid.width * this.grid.height) - 1;
    }
  }

  resetRandom() {
    this.grid = LifeLike.createGrid({ width: this.grid.width, height: this.grid.height });
    this.makeSymmetric();
    this.grid.playing = true;

    this.grid.pX = 0.3 + Math.random() * 0.4; // [0.3, 0.7]
    this.grid.pY = (Math.random() - 0.5) * 0.02; // [-0.01, 0.01] — drift accumulates k=4 times per tick

    this.grid.pM = Math.random() * 10; // [2, 6] — bigger range since 3-root cubic has smaller nudge magnitude
    this.grid.pX = Math.random() * 2; // [2, 6] — bigger range since 3-root cubic has smaller nudge magnitude
    this.grid.pY = Math.random() - .5; // [2, 6] — bigger range since 3-root cubic has smaller nudge magnitude

    LifeLike.addCircle(this.grid);
  }

  play() {
    const now = Date.now();
    // Update from user input, regardless if paused or not
    if (this.grid.mouseIsDown) {
      const b = this.grid.brushSize;
      const [x, y] = this.grid.mousePosition;
      for (let i = x - b; i < x + b; i++) {
        if (x < 0 || x > this.grid.width) continue;
        for (let j = y - b; j < y + b; j++) {
          if (y < 0 || y > this.grid.width) continue;
          const dist = Math.sqrt((i - x) ** 2 + (j - y) ** 2) + 1;
          if (dist > b) continue;
          // Depending on the mouse mode, modify the state
          const pos = i + j * this.grid.width;
          switch (this.grid.mouseMode) {
            case "observe":
              if (this.grid.cells[pos] < 0) console.log(this.grid.cells[pos]);
              if (this.grid.cells[pos] > Math.random()) {
                this.grid.cells[pos] = 1;
              } else {
                this.grid.cells[pos] = 0;
              }
              break;
            case "randomize":
              this.grid.cells[pos] = Math.random();
              break;
            case "kill":
              this.grid.cells[pos] = 0;
              break;
            case "set":
              this.grid.cells[pos] = this.grid.brushProb;
              break;
          }
        }
      }
    }

    const time = Date.now() - now;
    setTimeout(() => this.play(), 50);
    return false;
  }

  /** Mirrors the top left quadrant to the other 3 quadrants */
  makeSymmetric() {
    const newCells = new Float64Array(new ArrayBuffer(8 * this.grid.width * this.grid.height));
    for (let position = 0; position < this.grid.cells.length; position++) {
      const x = position % this.grid.width;
      const y = (position - x) / this.grid.width;
      //** This is top left quadrant, which gets mirrored to other quadrants */
      if (x < this.grid.width / 2 && y < this.grid.height / 2) {
        const xOffset = this.grid.width - (2 * x) - 1;
        const yOffset = (this.grid.height - 1) - (2 * y);

        newCells[position] = this.grid.cells[position];
        newCells[position + xOffset] = this.grid.cells[position];
        newCells[position + xOffset + yOffset * this.grid.width] = this.grid.cells[position];
        newCells[position + yOffset * this.grid.width] = this.grid.cells[position];
      }
    }
    this.grid.cells = newCells;
  }

  /**
   * Calculate the next state of the grid
   */
  tick() {
    this.grid.cells = LifeLike.getNextState(this.grid);
  }

  /**
   * Get's the neighborhood for the cell at specified position. If the position is on the edge of
   * the grid, it's neighbor is the opposite edge.
   * @TODO: optimize
   */
  static getNeighborhood(position: number, grid: Grid): number[] {
    const x = position % grid.width;
    const y = (position - x) / grid.width;
    // return value is a lenght 8 array
    // 0 1 2
    // 3 C 4
    // 5 6 7
    //const neighbors = new Int16Array(8);
    const neighbors = [];
    neighbors[0] = position - grid.width - 1;
    neighbors[1] = position - grid.width;
    neighbors[2] = position - grid.width + 1;
    neighbors[3] = position - 1;
    neighbors[4] = position + 1;
    neighbors[5] = position + grid.width - 1;
    neighbors[6] = position + grid.width;
    neighbors[7] = position + grid.width + 1;

    if (position < grid.width) {
      // Position is on top side
      neighbors[0] += grid.cells.length;
      neighbors[1] += grid.cells.length;
      neighbors[2] += grid.cells.length;
    } else if (position >= grid.width * (grid.height - 1)) {
      //position is on bottom side
      neighbors[5] -= grid.cells.length;
      neighbors[6] -= grid.cells.length;
      neighbors[7] -= grid.cells.length;
    }

    if (position % grid.width === 0) {
      // Position is left side
      neighbors[0] += grid.width;
      neighbors[3] += grid.width;
      neighbors[5] += grid.width;
    } else if ((position + 1) % grid.width === 0) {
      // Position is left side
      neighbors[2] -= grid.width;
      neighbors[4] -= grid.width;
      neighbors[7] -= grid.width;
    }
    const n = new Array(8);
    for (let i = 0; i < neighbors.length; i++) {
      n[i] = grid.cells[neighbors[i]];
    }
    return n;
  }

  /**
   * Compute the next state of the grid
   */
  static getNextState(grid: Grid): Float64Array {
    const { pX, pY, pM } = grid;
    /** Create a new 1D array of 8 bit floats that represent grid state */
    const nextState = new Float64Array(new ArrayBuffer(8 * grid.width * grid.height));
    /**
     * Iterate over each cell, skipping the edges since they don't have all their neighbors
     */
    for (let position = 0; position < grid.cells.length; position++) {
      /** Sort is needed for determinism since floating point arithmatic is not communitive */
      const neighbors = LifeLike.getNeighborhood(position, grid).sort();

      // Compute the odd of # of alive neighbors by computing odds of each possible neighbor state,
      // and summing them
      //const odds = LifeLike.computeNeighborTotalOdds(LifeLike.computeNeighborStateOdds(neighbors));
      const odds = LifeLike.computeNeighborTotalOddsDC(neighbors);

      // Apply the rules to the current state
      let state = NAMED_RULES.conway(grid, position, odds);
      //let state = NAMED_RULES.dayNight(grid, position, odds);
      //let state = NAMED_RULES.diomoeba(grid, position, odds);
      //let state = NAMED_RULES.anneal(grid, position, odds);

      //state = LifeLike.sigmoid(state, grid.pX);
      //state = LifeLike.powerTransform(state, grid.amp).toFixed(8);
      //state = LifeLike.addition(state, grid.amp);
      //state = LifeLike.multiplication(state, grid.amp);
      /*
      if (state >= 1) state = 1;
      else if (state <= 0) state = 0;
      else if (state < pX) {
        state = (state / pM) + pY;
      } else {
        state = 1 - ((1 - state) / pM) + pY;
      }
      if (state >= 1) state = 1;
      else if (state <= 0) state = 0;
     */

      // Drop-in for src/core.ts:314-322
      // 3-root bistable cubic: fixed points at `a`, pX, `1-a` (stable, unstable, stable).
      // Matches the original piecewise map's behavior where cells settled near ~0.1 /
      // ~0.9 rather than snapping to 0 / 1. That soft margin keeps neighbor dynamics
      // alive — a cell at 1 is "dead" to influence; a cell at 0.92 still responds.
      const a = 0.12;
      for (let i = 0; i < 4; i++) {
        state = state + pM * (state - a) * (1 - a - state) * (state - pX) + pY / 10;
        if (state >= 1) state = 1;
        else if (state <= 0) state = 0;
      }

      nextState[position] = state;
      //nextState[position] = Math.round(state * 1000) / 1000;
    }

    /** Apply any user interactions after grid has been computed to avoid partial updates */

    return nextState;
  }

  static multiplication(prob: number, gamma: number): number {
    return prob * gamma;
  }

  static addition(prob: number, gamma: number): number {
    return prob + gamma;
  }

  static powerTransform(prob: number, gamma: number): number {
    return Math.pow(prob, gamma) / (Math.pow(prob, gamma) + Math.pow(1 - prob, gamma));
  }

  static sigmoid(x: number, gamma: number): number {
    const x_offset = .3;
    const slope = -10;
    let s = 1 / (1 + Math.pow(Math.E, gamma * (-x + x_offset)));
    return s;
  }

  /**
   * Given the possibility of each state, output the possibilites of a certain number of neighbors
   * being alive
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
   * Same output as computeNeighborTotalOdds(computeNeighborStateOdds(neighbors)),
   * but computed by direct convolution of the Poisson binomial distribution.
   * For each neighbor with alive-probability p, convolve the running distribution
   * with [1-p, p]: new[k] = old[k]*(1-p) + old[k-1]*p. Walk k downward so the
   * in-place update doesn't clobber old[k-1] before it's read.
   * O(n^2) vs the O(n * 2^n) state-enumeration approach.
   */
  static computeNeighborTotalOddsDC(neighbors: number[]): number[] {
    const n = neighbors.length;
    const res: number[] = new Array(n + 1).fill(0);
    res[0] = 1;
    for (let i = 0; i < n; i++) {
      const p = neighbors[i];
      const q = 1 - p;
      for (let k = i + 1; k > 0; k--) {
        res[k] = res[k] * q + res[k - 1] * p;
      }
      res[0] = res[0] * q;
    }
    return res;
  }

  static createGrid(initial: Partial<Grid> = { width: 100, height: 100 }): Grid {
    console.log(initial)
    const width = initial.width ?? 100;
    const height = initial.height ?? 100;
    const grid: Grid = {
      mouseMode: "randomize",
      brushProb: .5,
      rules: [],
      brushSize: 10,
      pM: 1.6,
      pX: .42,
      pY: 0.04,
      position: 0,
      mouseIsDown: false,
      mousePosition: [0, 0],
      width,
      height,
      // New bytes are initialized to 0
      cells: new Float64Array(new ArrayBuffer(8 * width * height)),
      playing: false,
    };
    Object.assign(grid, initial)
    return grid;
  }

  // Neighbor state is a number, where each bit on is that neighbor being alive or
  // dead
  static bitCount(n: number) {
    n = n - ((n >> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
    return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
  }

  static addCircle(grid: Grid) {
    const radius = 25;
    for (let i = 0; i < grid.width * grid.height; i++) {
      const x = i % grid.width;
      const y = (i - x) / grid.height;
      const cX = 1 + (grid.width - 1) / 2;
      const cY = 1 + (grid.height - 1) / 2;
      if (Math.sqrt((x - cX) ** 2 + (y - cY) ** 2) < radius) {
        //grid.cells[i] = 1;
        if (Math.random() > .1) {
          grid.cells[i] = 1 - Math.random() / 2;
        } else {
          grid.cells[i] = 0;
        }
        //grid.cells[i] = Math.random() > .5 ? 1 : 0
        //grid.cells[i] = (x % 3 == 0) || (y%5==0);
      }
    }
  }
}
