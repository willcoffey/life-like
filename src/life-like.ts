import html from "./life-like.html?raw";
import "./lib/color-scale.ts";
import "./lib/state-display.ts";
import { KeyBinder } from "vimlike-keybinder";
import { Grid, LifeLike } from "./core.ts";
const CELL_SIZE = 1;
/**
 * Web component. Interprets all user input and sends it to core app. Renders output of core app
 * to a canvas element.
 */
class LifeLikeElement extends HTMLElement {
  shadow?: ShadowRoot;
  component: LifeLike;
  container: HTMLElement | null = null;
  stateDisplay: null | StateDisplay = null;
  context: CanvasRenderingContext2D | undefined;
  vlk: KeyBinder;

  blinkControl: boolean = false;
  constructor() {
    super();
    this.component = new LifeLike(100, 100);
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
    this.stateDisplay = this.shadow.getElementById("state-display");

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
      }, 50);
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

    this.stateDisplay?.render(grid);

    /**
     * Render the rest of the non-cell state as a subcomponent
     */

    /** Update the state of vars */
    /*
    this.shadow!.getElementById("mouse-mode")!.innerHTML = "Random";
    this.shadow!.getElementById("playback-state")!.innerHTML = grid.playing ? "Playing" : "Paused";
    this.shadow!.getElementById("brush-size")!.innerHTML = grid.brushSize.toString();
    this.shadow!.getElementById("mouse-mode")!.innerHTML = grid.mouseMode;
    this.shadow!.getElementById("brush-prob")!.innerHTML = grid.brushProb.toFixed(4);
    this.shadow!.getElementById("kb-mode")!.innerHTML = this.vlk.state.mode;
    this.shadow!.getElementById("flicker-control")!.innerHTML = `${this.blinkControl}`;

    this.shadow!.getElementById("prob-m")!.innerHTML = grid.pM.toFixed(2);
    this.shadow!.getElementById("prob-x")!.innerHTML = grid.pX.toFixed(2);
    this.shadow!.getElementById("prob-y")!.innerHTML = grid.pY.toFixed(2);
    */
    /** y=mx+b for slope probability control */
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
    const vlk = this.vlk;
    window.addEventListener("keydown", (e) => {
      const res = vlk.handleKeyEvent(e);
      //if (res) e.preventDefault();
    });

    /** Keybindings for mode switching */
    /** @TODO change to system handlers
    vlk.bind("<Escape>", "set-mode:normal", "Exit brush mode back to normal mode");
    vlk.bind("<b>", "set-mode:brush", "Enter brush mode, for changing the parameters of the brush");
    */

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

// Int to hex, for hex color codes
function i2h(num: number, length = 2) {
  let hex = num.toString(16);
  while (hex.length < length) hex = "0" + hex;
  return hex;
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

export function getColorGradientArr(num: number, max: number): number[] {
  const VIRIDIS = [
    [0, 0, 4],
    [31, 12, 72],
    [85, 15, 109],
    [136, 34, 106],
    [186, 54, 85],
    [227, 89, 51],
    [249, 140, 10],
    [249, 201, 50],
    [253, 231, 150],
    [254, 245, 210],
    [255, 255, 255],
  ];
  const t = num / max;
  if (!(t >= 0.001)) return [20, 20, 20, 255]; // catches NaN, <0.001, bad inputs

  const s = Math.min(t, 1) * (VIRIDIS.length - 1);
  const i = Math.min(Math.floor(s), VIRIDIS.length - 2);
  const f = s - i;
  const [r0, g0, b0] = VIRIDIS[i];
  const [r1, g1, b1] = VIRIDIS[i + 1];

  return [
    Math.round(r0 + (r1 - r0) * f),
    Math.round(g0 + (g1 - g0) * f),
    Math.round(b0 + (b1 - b0) * f),
    255,
  ];
}
