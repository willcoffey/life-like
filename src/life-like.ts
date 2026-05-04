import html from "./life-like.html?raw";
import "./lib/color-scale.ts";
import { StateDisplay } from "./lib/state-display.ts";
import { KeyBinder } from "../vendor/vimlike-keybinder/keybinder.ts";
import { Grid, LifeLike } from "./core.ts";
import { ColorMap } from "./lib/ColorMap.ts";
import { ColorScale } from "./lib/color-scale.ts";

const CELL_SIZE = 1;
/**
 * Web component. Interprets all user input and sends it to core app. Renders output of core app
 * to a canvas element.
 */
class LifeLikeElement extends HTMLElement {
  shadow?: ShadowRoot;
  component: LifeLike;
  container: HTMLElement | null = null;
  canvas: HTMLCanvasElement | null = null;
  colorMap: ColorMap;

  stateDisplay: null | StateDisplay = null;
  colorScale: ColorScale | null = null;
  context: CanvasRenderingContext2D | undefined;
  vlk: KeyBinder;

  blinkControl: boolean = false;
  constructor() {
    super();
    this.component = new LifeLike({
      width: 50,
      height: 50,
      changeRate: 1,
    });
    this.vlk = new KeyBinder();
    this.handleCommands();
    this.colorMap = new ColorMap();
  }

  /**
   * Invoked when the custom element is first connected to the document's DOM.
   * shadow cannot be attached before this is run.
   */
  connectedCallback() {
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = html;
    this.container = this.shadow.getElementById("container");
    this.stateDisplay = this.getTypedEl("state-display", StateDisplay);
    this.colorScale = this.getTypedEl("color-scale", ColorScale);

    /** Get the canvas context and set it's width */
    /** @TODO scale to size of canvas */
    //
    this.context = LifeLikeElement.getContext(this.shadow);
    this.canvas = getByIdOrThrow(this.shadow, "grid") as HTMLCanvasElement;

    /** @TODO - scale to size of container
     */
    this.context.canvas.width = this.component.grid.width;
    this.context.canvas.height = this.component.grid.height;

    // Initial render
    this.render(this.component.grid, this.context, this.canvas);

    /** Tick as fast as browser can animate  frame is complete */
    // @TODO Have LifeLike do loop and output updates to web component. Give it a framerate option
    // as well

    const fn = async () => {
      if (this.component.grid.playing) {
        this.component.stdin({ "command": "tick" });
        if (this.blinkControl) {
          this.component.stdin({ "command": "tick" });
        }
      }
      if (!this.canvas || !this.context) throw "Error: no canvas or context at render stage";
      this.render(this.component.grid, this.context, this.canvas);
      setTimeout(() => {
        window.requestAnimationFrame(fn);
      }, 0);
    };
    fn();

    this.listenForMouseEvents();
    this.setupKeyBindings();

    /** For pasting JSON into the interface */
    this.stateDisplay?.addEventListener("load-state", (e) => {
      const detail = (e as CustomEvent).detail;
      this.component.stdin({ command: "load-state", args: detail });
    });
  }

  /**
   * Main render function, called on connected to DOM and on play setTimeout loop
   */
  render(grid: Grid, context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const imgDataArray = new Uint8ClampedArray(grid.width * grid.height * 4);
    const imageData = new ImageData(imgDataArray, grid.width, grid.height);

    for (const [position, x, y] of LifeLike.cellIterator(grid)) {
      const [r, g, b, a] = this.colorMap.getRGBA(grid.cells[position]);
      const i = (y * grid.width + x) * 4;
      imgDataArray[i] = r;
      imgDataArray[i + 1] = g;
      imgDataArray[i + 2] = b;
      imgDataArray[i + 3] = a;
    }

    if (canvas.width !== grid.width || canvas.height !== grid.height) {
      canvas.width = grid.width;
      canvas.height = grid.height;
    }
    context.putImageData(imageData, 0, 0);

    if (grid.theme !== this.colorMap.theme) this.colorMap.load(grid.theme);
    this.stateDisplay?.render(grid);
    this.colorScale?.render(this.colorMap);
  }

  /**
   * gets the element by id, checks it against provided constructor to confirm
   * type of element
   */
  getTypedEl<T extends HTMLElement>(
    id: string,
    ctor: new () => T,
  ): T {
    const el = this.shadow?.getElementById(id);
    if (!(el instanceof ctor)) throw `#${id} missing or not ${ctor.name}`;
    return el;
  }

  async handleCommands() {
    for await (const command of this.vlk) {
      console.log(command);
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
     */
    vlk.bind("brush:<n>", "set-mode:normal", "Exit brush mode back to normal mode");
    vlk.bind("<b>", "set-mode:brush", "Enter brush mode, for changing the parameters of the brush");

    /**
     * Moving and zooming the window into the phase diagram
     */
    vlk.bindKeys("<l>", "move-right", "normal");
    vlk.bindKeys("<h>", "move-left", "normal");
    vlk.bindKeys("<j>", "move-down", "normal");
    vlk.bindKeys("<k>", "move-up", "normal");
    vlk.bindKeys("<=>", "zoom-in", "normal");
    vlk.bindKeys("<+>", "zoom-in", "normal");
    vlk.bindKeys("<->", "zoom-out", "normal");

    // @TODO - goto standard resolution for current activation function
    vlk.bindKeys("<g><g>", "goto-start", "normal");

    // Setting the center point of the current diagram as grid params
    vlk.bindKeys("<Shift-Enter>", "select-params", "normal");
    // Toggle between normal mode (wrap edges, constant params, and phase diagram)
    vlk.bindKeys("<m>", "toggle-mode", "normal");

    /** Increase the resolution of the grid */
    vlk.bindKeys("<Shift-+>", "increase-res", "normal");
    vlk.bindKeys("<Shift-->", "decrease-res", "normal");
    vlk.bindKeys("<Shift-_>", "decrease-res", "normal");

    /**
     * Change the activation
     */
    vlk.bindKeys("<Shift-G>", "set-activation", "normal", "gaussian");
    vlk.bindKeys("<Shift-S>", "set-activation", "normal", "sigmoid");
    vlk.bindKeys("<Shift-W>", "set-activation", "normal", "will");

    vlk.bindKeys("<a>", "next-activation", "normal");
    vlk.bindKeys("<Shift-A>", "prev-activation", "normal");


    vlk.bindKeys("<d>", "next-diagram", "normal");
    vlk.bindKeys("<Shift-D>", "prev-diagram", "normal");

    vlk.bindKeys("<c>", "increase-rate", "normal");
    vlk.bindKeys("<Shift-C>", "decrease-rate", "normal");

    vlk.bindKeys("<t>", "next-theme", "normal");
    vlk.bindKeys("<Shift-T>", "prev-theme", "normal");

    /**
     * bindings for manipulating the grid. reset, random pixels
     */
    vlk.bindKeys("<s>", "make-symmetric", "normal");
    vlk.bindKeys("<r>", "reset-random", "normal");
    vlk.bindKeys("<x>", "reset", "normal");

    vlk.bindKeys("<f>", "blink-control", "normal");

    vlk.bindKeys("< >", "play-pause", "normal");
    vlk.bindKeys("<.>", "tick", "normal");

    vlk.bindKeys("<Shift-L>", "debug", "normal");
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

function getByIdOrThrow(root: ShadowRoot, id: string): HTMLElement {
  const el = root.getElementById(id);
  if (!el) throw "Error: Failed to get element for id";
  return el;
}
