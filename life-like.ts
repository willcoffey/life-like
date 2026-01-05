import html from "./life-like.html?raw";
import { KeyBinder } from "vimlike-keybinder";
import { NAMED_RULES } from "./lib/rules.ts";
const CELL_SIZE = 1;
/**
 * [FINAL REVIEW] @TODO - Color gradient cells
 * @TODO - Integrate keybinder
 * @TODO - presets
 * @TODO - Custom rules
 * @TODO - Save rules
 * @TODO - ELO for shared rules (show 2 random rules, pick best)
 * @TODO - Controls for
 *  - Rule input
 *  - amp
 *  - play/pause
 *  - insert structure
 *  - mouse over observe
 */

/**
 * Quick hack class, receives input as events and calls the stdin function on
 * component.
 * @TODO - Add events to a buffer and process in sequence in case component cannot
 * handle event volume
 */
class EventBuffer {
  component: { stdin: Function };
  constructor(component: { stdin: Function }) {
    this.component = component;
  }

  dispatchEvent(event: any) {
  }
}
interface Command {
  command: string;
  [key: string]: any;
}
const mouseModes: ("observe" | "randomize" | "kill" | "set")[] = [
  "observe",
  "randomize",
  "kill",
  "set",
];

/**
 * Main datastructure for component, anything that can effect the next state calculation of the grid
 * should be in this object.
 */
export interface Grid {
  mouseMode: "observe" | "randomize" | "kill" | "set";
  brushSize: number;
  brushProb: number;
  frame_time: number[];
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
  amp: number;

  pM: number;
  pX: number;
  pY: number;
}

/**
 * This class does all the actual computation, and could be used to run the simulation on a server
 * without any browser api's
 */

const WIDTH = 100, HEIGHT = 100;
export class LifeLike {
  grid: Grid;
  constructor() {
    this.grid = LifeLike.createGrid(WIDTH, HEIGHT);
    addCircle(this.grid);
    this.makeSymmetric();
    return;
  }

  resetRandom() {
    this.grid = LifeLike.createGrid(WIDTH, HEIGHT);
    this.makeSymmetric();
    this.grid.playing = true;
    this.grid.pY = Math.random() - .5;
    this.grid.pM = Math.random() * 3;
    this.grid.pX = Math.random();
    addCircle(this.grid);
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
    this.grid.frame_time.push(time);
    if (this.grid.frame_time.length > 10) this.grid.frame_time.shift();
    setTimeout(() => this.play(), 50);
    return false;
  }

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

        //newCells[position + xOffset * yOffset * this.grid.width] = this.grid.cells[position]; // Top right
      }
    }

    this.grid.cells = newCells;
  }

  tick() {
    this.grid.cells = LifeLike.getNextState(this.grid);

    /** @TODO Refactor - mouse add random noise */
    /*
    if (this.grid.mouseIsDown) {
      const [x, y] = this.grid.mousePosition;
      for (let i = x - 20; i < x + 20; i++) {
        if (x < 0 || x > this.grid.width) continue;
        for (let j = y - 20; j < y + 20; j++) {
          if (y < 0 || y > this.grid.width) continue;
          //this.grid.cells[i + j * this.grid.width] = Math.random() > .7 ? 1 : 0;
          this.grid.cells[i + j * this.grid.width] = Math.random();
        }
      }
    }
    */
  }

  /* @TODO get neighborhood, runs extremely slow */
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

  static getNextState(grid: Grid): Float64Array {
    const { pX, pY, pM } = grid;
    /** Create a new 1D array of 8 bit floats that represent grid state */
    const nextState = new Float64Array(new ArrayBuffer(8 * grid.width * grid.height));
    /**
     * Iterate over each cell, skipping the edges since they don't have all their neighbors
     */
    for (let position = 0; position < grid.cells.length; position++) {
      /** Skip the edges since they don't have 8 neighbors */
      /*
      if (
        position % grid.width === 0 || // Position is left side of grid
        (position + 1) % grid.width == 0 || // Position is right most side of grid
        position < grid.width - 1 || // Position is top side of grid
        position > grid.width * (grid.height - 1) // Position is bottom of grid
      ) continue;
      const neighbors = [
        grid.cells[position - grid.width - 1],     // y - 1, x - 1
        grid.cells[position - grid.width],         // y - 1
        grid.cells[position - grid.width + 1],     // y - 1, x + 1
        grid.cells[position - 1],                  // x - 1
        grid.cells[position + 1],                  // x + 1
        grid.cells[position + grid.width - 1],     // y + 1, x - 1
        grid.cells[position + grid.width],         // y + 1
        grid.cells[position + grid.width + 1],     // y + 1, x + 1
      ];
     */
      const neighbors = LifeLike.getNeighborhood(position, grid);

      // Compute the odd of # of alive neighbors by computing odds of each possible neighbor state,
      // and summing them
      const odds = LifeLike.computeNeighborTotalOdds(LifeLike.computeNeighborStateOdds(neighbors));

      // Apply the rules to the current state
      let state = NAMED_RULES.conway(grid, position, odds);

      //let state = NAMED_RULES.dayNight(grid, position, odds);
      //let state = NAMED_RULES.diomoeba(grid, position, odds);
      //let state = NAMED_RULES.anneal(grid, position, odds);

      // Amplify odds such that low prob events become lower, high prob events become higher
      // @TODO Find a way to not need this ugliness
      //const amp = 1.6;
      /*
      if (state <= 0.4) {
        state = state / grid.pM;
        //state = Math.pow(state, grid.pM);
      } else {
        //state = 1 - Math.pow(1 - state, grid.pM);
        state = 1 - ((1 - state) / grid.pM);
      }
     */

      /*
      state = Number(state.toFixed(8));
      state = state + (1 - state) / grid.amp;
     */

      //state = LifeLike.sigmoid(state, grid.amp).toFixed(8);
      //state = LifeLike.powerTransform(state, grid.amp).toFixed(8);
      //state = LifeLike.addition(state, grid.amp);
      //state = LifeLike.multiplication(state, grid.amp);
      //

      if (state >= 1) state = 1;
      else if (state <= 0) state = 0;
      else if (state < pX) {
        state = (state / pM) + pY;
        //state = grid.pY - (grid.pM * (grid.pX - state));
        //state = Math.pow(state, grid.pM);
      } else {
        state = 1 - ((1 - state) / pM) + pY;
        //state = (state * pM) + pY;
        //state = grid.pY + (grid.pM * (state - grid.pX));
        //state = 1 - Math.pow(1 - state, grid.pM);
      }

      if (state >= 1) state = 1;
      else if (state <= 0) state = 0;

      nextState[position] = Number(state.toFixed(10));
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
      let numNeighbors = bitCount(i);
      res[numNeighbors] += odds[i];
    }
    return res;
  }
  /**
   * Iterates over all possible states that neighbors could be in and calculates the chance of each
   * one being true
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
        //if (prob === 0) break;
      }
      odds.push(prob);
    }

    return odds;
  }

  static createGrid(width: number, height: number): Grid {
    const grid: Grid = {
      mouseMode: "randomize",
      brushProb: .5,
      frame_time: [],
      rules: [],
      brushSize: 10,
      amp: 0,
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
    return grid;
  }
}

/**
 * Web component. Interprets all user input and sends it to core app. Renders output of core app
 * to a canvas element.
 */
class LifeLikeElement extends HTMLElement {
  shadow?: ShadowRoot;
  component: LifeLike;
  container: HTMLElement | null = null;
  context: CanvasRenderingContext2D | undefined;
  vlk: KeyBinder;
  blinkControl: boolean = false;

  constructor() {
    super();
    this.component = new LifeLike();
    this.vlk = new KeyBinder();
    this.handleCommands();
  }

  /**
   * Invoked when the custom element is first connected to the document's DOM.
   * shadow cannot be attached before this is run.
   */
  connectedCallback() {
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = html;
    this.container = this.shadow.getElementById("container");

    /** Get the canvas context and set it's width */
    /** @TODO scale to size of canvas */
    //
    this.context = LifeLikeElement.getContext(this.shadow);

    /** @TODO - scale to size of container
     */
    this.context.canvas.width = this.component.grid.width;
    this.context.canvas.height = this.component.grid.height;

    // Initial render
    this.render(this.component.grid, this.context);

    /** Tick as fast as browser can animate  frame is complete */
    // @TODO Have LifeLike do loop and output updates to web component. Give it a framerate option
    // as well

    const fn = async () => {
      if (this.component.grid.playing) {
        this.component.tick();
        if (this.blinkControl) {
          this.component.tick();
        }
      }
      this.render(this.component.grid, this.context!);
      setTimeout(() => {
        window.requestAnimationFrame(fn);
      }, 0);
    };
    fn();

    this.listenForMouseEvents();
    this.setupKeyBindings();
    this.component.play();
  }

  render(grid: Grid, context: CanvasRenderingContext2D) {
    const imgDataArray = new Uint8ClampedArray(grid.width * grid.height * 4);
    const imageData = new ImageData(imgDataArray, grid.width, grid.height);

    for (let position = 0; position < grid.width * grid.height; position++) {
      const [r, g, b, a] = getColorGradientArr(grid.cells[position] * 255, 255);
      imgDataArray[position * 4] = r;
      imgDataArray[position * 4 + 1] = g;
      imgDataArray[position * 4 + 2] = b;
      imgDataArray[position * 4 + 3] = a;
    }
    context.putImageData(imageData, 0, 0);

    /** Render the mouse brush */
    const [mX, mY] = grid.mousePosition;
    // Draw a circle
    context.beginPath();
    // make sure it is filled
    context.arc(
      mX * CELL_SIZE + CELL_SIZE / 2,
      mY * CELL_SIZE + CELL_SIZE / 2,
      grid.brushSize * CELL_SIZE,
      0,
      2 * Math.PI,
    );
    context.fillStyle = "rgba(50, 50, 50, 0.4)";
    context.fill();
    context.stroke();

    /** Update the state of vars */
    this.shadow!.getElementById("mouse-mode")!.innerHTML = "Random";
    this.shadow!.getElementById("playback-state")!.innerHTML = grid.playing ? "Playing" : "Paused";
    this.shadow!.getElementById("brush-size")!.innerHTML = grid.brushSize.toString();
    this.shadow!.getElementById("mouse-mode")!.innerHTML = grid.mouseMode;
    this.shadow!.getElementById("brush-prob")!.innerHTML = grid.brushProb.toFixed(4);
    this.shadow!.getElementById("kb-mode")!.innerHTML = this.vlk.state.mode;
    this.shadow!.getElementById("flicker-control")!.innerHTML = `${this.blinkControl}`;
    const framerate = grid.frame_time.reduce((a, b) => a + b, 0) / grid.frame_time.length;

    /** y=mx+b for slope probability control */
    this.shadow!.getElementById("prob-m")!.innerHTML = grid.pM.toFixed(2);
    this.shadow!.getElementById("prob-x")!.innerHTML = grid.pX.toFixed(2);
    this.shadow!.getElementById("prob-y")!.innerHTML = grid.pY.toFixed(2);
  }

  async handleCommands() {
    for await (const command of this.vlk) {
      switch (command.command) {
        case "blink-control":
          this.blinkControl = !this.blinkControl;
          break;
        default:
          this.component.stdin(command);
      }
    }
  }

  setupKeyBindings() {
    const eventBuffer = new EventBuffer(this.component);
    const vlk = this.vlk;
    //kb.setTarget(eventBuffer);
    window.addEventListener("keydown", (e) => {
      const res = vlk.handleKeyEvent(e);
      //if (res) e.preventDefault();
    });

    /** Keybindings for mode switching */
    /** @TODO change to system handlers */
    vlk.bindKeys("<Escape>", "set-mode", "brush", "normal");
    vlk.bindKeys("<b>", "set-mode", "normal", "brush");

    /** Controls for changing the m/x/y variables that modify final probabilities */
    vlk.bindKeys("<+>", "increase-prob-m", "normal");
    vlk.bindKeys("<=>", "increase-prob-m", "normal");
    vlk.bindKeys("<->", "decrease-prob-m", "normal");
    vlk.bindKeys("<]>", "increase-prob-x", "normal");
    vlk.bindKeys("<[>", "decrease-prob-x", "normal");
    vlk.bindKeys("<'>", "increase-prob-y", "normal");
    vlk.bindKeys("<;>", "decrease-prob-y", "normal");

    vlk.bindKeys("<s>", "make-symmetric", "normal");
    vlk.bindKeys("<r>", "reset-random", "normal");
    vlk.bindKeys("<f>", "blink-control", "normal");

    vlk.bindKeys("<+>", "increase-brush-prob", "brush");
    vlk.bindKeys("<=>", "increase-brush-prob", "brush");
    vlk.bindKeys("<->", "decrease-brush-prob", "brush");
    vlk.bindKeys("<]>", "increase-brush", "brush");
    vlk.bindKeys("<[>", "decrease-brush", "brush");
    vlk.bindKeys("<m>", "mouse-mode", "brush");
    vlk.bindKeys("< >", "play-pause", "normal");
    vlk.bindKeys("<.>", "tick", "normal");
    vlk.bindKeys("<l>", "move-right", "normal");
    vlk.bindKeys("<h>", "move-left", "normal");
    vlk.bindKeys("<j>", "move-down", "normal");
    vlk.bindKeys("<k>", "move-up", "normal");
    vlk.bindKeys("<t>", "toggle-cell", "normal");
    vlk.bindKeys("<x>", "reset", "normal");
    vlk.bindKeys("<s-G>", "goto-end", "normal");
    vlk.bindKeys("<g><g>", "goto-start", "normal");
  }

  /**
   * Listen for mouse events and send only necessary data to LifeLike
   */
  listenForMouseEvents() {
    this.addEventListener("mousedown", (mouseEvent) => {
      /** Send minimal state to processing class */
      this.component.stdin({ command: "mousedown" });
    });
    this.addEventListener("mouseup", (mouseEvent) => {
      /** Send minimal state to processing class */
      this.component.stdin({ command: "mouseup" });
    });
    this.addEventListener("mousemove", (mouseEvent) => {
      /** Send minimal state to processing class */
      this.component.stdin({ command: "mousemove", pos: this.getMousePosition(mouseEvent) });
    });
  }

  /** Calculate position of mouse relative to canvas */
  getMousePosition(event: MouseEvent) {
    if (!this.context) throw "getMousePosition err: No canvas context";
    //const rect = this.context.canvas.getBoundingClientRect();
    const rect = this.context.canvas.getBoundingClientRect();
    const xRatio = this.component.grid.width / rect.width;
    const yRatio = this.component.grid.height / rect.height;
    const x = xRatio * (event.clientX - rect.x);
    const y = yRatio * (event.clientY - rect.y);

    return [Math.floor(x / CELL_SIZE), Math.floor(y / CELL_SIZE)];
  }

  static getCellColor(state: number): string {
    if (state == 0 || state == 1) {
      const intensity = Math.round(state * 255); // Converting to a scale of 0-255
      const color = `#${i2h(intensity)}${i2h(intensity)}${i2h(intensity)}`; // Creating the color hex
      return color;
    } else {
      const intensity = Math.round(state * 200); // Converting to a scale of 0-255
      const color = `#${i2h(intensity)}${i2h(intensity)}${i2h(intensity + 55)}`; // Creating the color hex
      return color;
    }
  }

  static getContext(shadow: ShadowRoot): CanvasRenderingContext2D {
    const canvas = shadow.getElementById("grid");
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) throw "No canvas element";
    const ctx = canvas.getContext("2d");
    if (!ctx) throw "Could not get 2D context";
    return ctx;
  }

  static addStyle(shadow: ShadowRoot, style: string) {
    if (!shadow) throw "No shadow dom";
    const element = document.createElement("style");
    element.innerHTML = style;
    shadow.appendChild(element);
  }
}
customElements.define("life-like", LifeLikeElement);

// Neighbor state is a number, where each bit on is that neighbor being alive or
// dead
function bitCount(n: number) {
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
}

// Int to hex, for hex color codes
function i2h(num: number, length = 2) {
  let hex = num.toString(16);
  while (hex.length < length) hex = "0" + hex;
  return hex;
}

function addCircle(grid: Grid) {
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

/**
 * I don't know how to do a proper color gradient, or much about human perception fo color so I just
 * used sine waves of differing periods to set the value of each color. Might be trippy
 */
function getColorTrig(num: number) {
  // Periods: red = 2, green = 3, blue = 5
  // 0 <= num <= 30
  const rad = num * 3.14159 * 2;

  /** Between 0 and 2 */
  const red = Math.sin(rad / 2 - Math.PI / 2) + 1;
  const green = Math.sin(rad / 3 - Math.PI / 2) + 1;
  const blue = Math.sin(rad / 5 - Math.PI / 2) + 1;

  const rHex = i2h(Math.round(red * 255 / 2));
  const gHex = i2h(Math.round(green * 255 / 2));
  const bHex = i2h(Math.round(blue * 255 / 2));

  return `#${rHex}${gHex}${bHex}`;
}

/**
 * My guess at making a color gradient, abstract function would be better
 *
 * 0 <= num <= 255^3 - 1
 */
function getColorGradient(num: number, max: number) {
  if (num && num / max < .001) return "#333333";
  const adjusted = (num / max) * 4;
  const r = Math.round(red(adjusted) * 255);
  const g = Math.round(green(adjusted) * 255);
  const b = Math.round(blue(adjusted) * 255);

  const col = `#${i2h(r)}${i2h(g)}${i2h(b)}`;
  return col;
  //RED

  //GREEN
  //BLUE
  function blue(n: number): number {
    // 0 < n < 1
    if (n <= 1) return n;
    // 1 < n <= 2
    if (n <= 2) return 1 - (n - 1);
    // 2 < n <= 3
    if (n <= 3) return 0;
    // 3 < n <= 4
    if (n > 3) return (n - 3);
    return 0;
  }
  function green(n: number): number {
    // 0 < n < 1
    if (n <= 1) return 0;
    // 1 < n <= 2
    if (n <= 2) return n - 1;
    // 2 < n <= 3
    if (n <= 3) return 1 - (n - 2);
    // 3 < n <= 4
    if (n > 3) return (n - 3);
    return 0;
  }
  function red(n: number): number {
    // 0 < n < 1
    if (n <= 1) return 0;
    // 1 < n <= 2
    if (n <= 2) return 0;
    // 2 < n <= 3
    if (n <= 3) return n - 2;
    // 3 < n <= 4
    if (n > 3) return 1;
    return 0;
  }
}

function getColorGradientArr(num: number, max: number): number[] {
  if (num / max < .001) return [20, 20, 20, 255];
  const adjusted = (num / max) * 4;

  const r = Math.round(red(adjusted) * 255);
  const g = Math.round(green(adjusted) * 255);
  const b = Math.round(blue(adjusted) * 255);
  //return [r, g, b, 255];
  return [r, g, b, 255];
  function blue(n: number): number {
    // 0 < n < 1
    if (n <= 1) return n;
    // 1 < n <= 2
    if (n <= 2) return 1 - (n - 1);
    // 2 < n <= 3
    if (n <= 3) return 0;
    // 3 < n <= 4
    if (n > 3) return (n - 3);
    return 0;
  }
  function green(n: number): number {
    // 0 < n < 1
    if (n <= 1) return 0;
    // 1 < n <= 2
    if (n <= 2) return n - 1;
    // 2 < n <= 3
    if (n <= 3) return 1 - (n - 2);
    // 3 < n <= 4
    if (n > 3) return (n - 3);
    return 0;
  }
  function red(n: number): number {
    // 0 < n < 1
    if (n <= 1) return 0;
    // 1 < n <= 2
    if (n <= 2) return 0;
    // 2 < n <= 3
    if (n <= 3) return n - 2;
    // 3 < n <= 4
    if (n > 3) return 1;
    return 0;
  }
}
